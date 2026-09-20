// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {HistoricalBlockhashStore} from "./HistoricalBlockhashStore.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";




/// Fixed 200-block batches. Chronological settlement reserves permanent awards.
/// Claimants fund qualification verification and minting. Blockhash is not VRF.
contract BnbfishClaim200 is ERC721Enumerable, Ownable2Step, ReentrancyGuard, HistoricalBlockhashStore {
 using Strings for uint256;
 struct Species {uint16 id;uint8 tier;uint8 waters;uint16 weight;uint16 minLength;uint16 maxLength;uint16 referenceLength;uint32 referenceMass;}
 struct Fish {uint16 speciesId;uint8 tier;uint8 water;uint16 lengthMm;uint64 massGrams;uint16 qualityBps;uint64 caughtAt;uint64 castBlock;uint256 requestId;}
 enum EntryState {None, Entered, Claimed}
 struct Entry {address player;uint8 water;EntryState state;uint16 speciesId;uint64 castBlock;uint64 castAt;uint256 roundId;uint256 tokenId;}
 uint256 public constant INTERVAL=200;
 uint256 public constant MAX_WINNERS=50;
 uint256 public constant HASH_DEPTH=3;
 uint256 public constant MAX_SUPPLY=2000000;
 uint256 public constant protocolFee=0.00001 ether;
 address public immutable feeRecipient;
 bytes32 public immutable rulesHash;
 bool public paused=true;
 uint256 public startBlock;
 uint256 public nextTokenId=1;
 uint256 public issuedCasts;
 struct RoundInfo {bool settled;uint64 settledAt;uint16 awards;}
 mapping(uint256=>RoundInfo) public rounds;
 uint256[] private activeRounds;
 uint256 public settlementCursor;
 uint256 public totalAllocated;
 uint256[5] public tierAllocated;
 mapping(uint16=>uint256) public speciesAllocated;
 uint256 public protocolFeesCollected;
 uint256 public protocolFeesForwarded;
 uint256[5] public tierCaps=[uint256(1200000),500000,150000,100000,50000];
 uint256[5] public tierMinted;
 mapping(uint16=>uint256) public speciesCaps;
 mapping(uint16=>uint256) public speciesMinted;
 mapping(uint16=>Species) public species;
 mapping(uint16=>bool) private exists;
 mapping(uint256=>uint16[]) private pools;
 mapping(uint256=>uint256) internal remainingPool;
 mapping(uint256=>uint256) public poolWeights;
 mapping(uint256=>Fish) public fish;
 string public imageBase;
 mapping(uint256=>Entry) public entries;
 mapping(uint256=>bytes32) public savedHashes;
 mapping(uint256=>uint256[]) private participants;
 mapping(uint256=>mapping(address=>uint256)) public entryOf;
 mapping(uint256=>uint256) public entryIndex;
 mapping(address=>uint256[]) private playerEntries;
 event CastRequested(uint256 indexed entryId,address indexed player,uint256 indexed roundId,uint8 water,uint256 target);
 event ProtocolFeePaid(uint256 indexed entryId,address indexed player,address indexed recipient,uint256 amount,bool forwarded);
 event FeesForwarded(address indexed recipient,uint256 amount);
 event HashSaved(uint256 indexed roundId,uint256 target,bytes32 blockHash);
 event CatchAllocated(uint256 indexed entryId,address indexed player,uint256 indexed roundId,uint16 speciesId);
 event RoundSettled(uint256 indexed roundId,uint256 awards);
 event CatchClaimed(uint256 indexed entryId,address indexed player,uint256 indexed tokenId,uint16 speciesId);
 event PauseChanged(bool paused);
 error InvalidConfig();error NotReady();error WrongFee();error SoldOut();error WrongState();error Unauthorized();error AlreadyEntered();error NotSelected();error FeeTransferFailed();
 constructor(address admin,address recipient,bytes32 catalogHash,string memory images,Species[] memory catalog)
 ERC721("Bnbfish Claim 200","BNBFISH200") Ownable(admin) {
  if(recipient==address(0))revert InvalidConfig();feeRecipient=recipient;
  if(catalogHash==0||bytes(images).length==0||catalog.length!=100)revert InvalidConfig();
  rulesHash=catalogHash;imageBase=images;
  uint256[5] memory counts;
  for(uint256 i;i<catalog.length;i++){if(catalog[i].tier>4||(i>0&&catalog[i].id<=catalog[i-1].id))revert InvalidConfig();counts[catalog[i].tier]++;}
  uint256[5] memory seen;
  for(uint256 i;i<5;i++)if(counts[i]==0)revert InvalidConfig();
  for(uint256 i;i<catalog.length;i++){
   Species memory s=catalog[i];if(s.id==0||exists[s.id]||s.tier>4||s.waters==0||s.waters>7||s.weight==0||s.minLength==0||s.maxLength<s.minLength||s.maxLength>10000||s.referenceLength==0||s.referenceMass==0)revert InvalidConfig();
   if(uint256(s.referenceMass)*uint256(s.maxLength)**3/uint256(s.referenceLength)**3>type(uint64).max)revert InvalidConfig();
   species[s.id]=s;exists[s.id]=true;
   speciesCaps[s.id]=tierCaps[s.tier]/counts[s.tier]+(seen[s.tier]<tierCaps[s.tier]%counts[s.tier]?1:0);seen[s.tier]++;
   for(uint8 w;w<3;w++)if(s.waters&(uint8(1)<<w)!=0){uint256 k=uint256(w)*5+s.tier;pools[k].push(s.id);poolWeights[k]+=s.weight;remainingPool[k]+=speciesCaps[s.id];}
  }
  for(uint256 i;i<15;i++)if(poolWeights[i]==0)revert InvalidConfig();
 }



 function setPaused(bool value) external onlyOwner {if(!value&&startBlock==0)startBlock=block.number;paused=value;emit PauseChanged(value);}
 function currentRound() public view returns(uint256){if(startBlock==0)revert NotReady();return (block.number-startBlock)/INTERVAL+1;}
 function targetBlock(uint256 roundId) public view returns(uint256){if(startBlock==0||roundId==0)revert InvalidConfig();return startBlock+roundId*INTERVAL;}
 function participantCount(uint256 roundId) external view returns(uint256){return participants[roundId].length;}
 function participantAt(uint256 roundId,uint256 index) external view returns(uint256){return participants[roundId][index];}
 function playerEntryCount(address player) external view returns(uint256){return playerEntries[player].length;}
 function playerEntryAt(address player,uint256 index) external view returns(uint256){return playerEntries[player][index];}
 function cast(uint8 water) external payable nonReentrant returns(uint256 id){
  if(paused||water>2)revert NotReady();if(msg.value!=protocolFee)revert WrongFee();
  if(totalAllocated>=MAX_SUPPLY||waterRemaining(water)==0)revert SoldOut();
  uint256 roundId=currentRound();if(entryOf[roundId][msg.sender]!=0)revert AlreadyEntered();
  id=++issuedCasts;entries[id]=Entry(msg.sender,water,EntryState.Entered,0,uint64(block.number),uint64(block.timestamp),roundId,0);
  if(participants[roundId].length==0)activeRounds.push(roundId);
  entryIndex[id]=participants[roundId].length;entryOf[roundId][msg.sender]=id;participants[roundId].push(id);playerEntries[msg.sender].push(id);
  protocolFeesCollected+=msg.value;
  // A rejecting recipient must not lock player participation. Retained fees can
  // only be forwarded to the same immutable address, never withdrawn by admin.
  (bool paid,)=payable(feeRecipient).call{value:msg.value,gas:30000}("");
  if(paid)protocolFeesForwarded+=msg.value;
  emit ProtocolFeePaid(id,msg.sender,feeRecipient,msg.value,paid);
  emit CastRequested(id,msg.sender,roundId,water,targetBlock(roundId));
 }
 function forwardFees() external nonReentrant {
  uint256 amount=protocolFeesCollected-protocolFeesForwarded;if(amount==0)return;
  protocolFeesForwarded+=amount;(bool ok,)=payable(feeRecipient).call{value:amount}("");if(!ok)revert FeeTransferFailed();emit FeesForwarded(feeRecipient,amount);
 }
 function captureHash(uint256 roundId) external returns(bytes32){return _capture(roundId);}
 function _capture(uint256 roundId) private returns(bytes32 h){
  uint256 target=targetBlock(roundId);if(participants[roundId].length==0||block.number<target+HASH_DEPTH)revert NotReady();
  h=savedHashes[roundId];if(h!=0)return h;h=saveHistoricalHash(target);savedHashes[roundId]=h;emit HashSaved(roundId,target,h);
 }
 function _entropy(uint256 roundId,bytes32 h) private view returns(bytes32){return keccak256(abi.encode(block.chainid,address(this),rulesHash,roundId,targetBlock(roundId),h));}
 function roll(uint256 word,uint256 scope,uint256 bound) private view returns(uint256){return uint256(keccak256(abi.encode(word,scope,rulesHash)))%bound;}
 function _lookup(uint256 key,uint256[50] memory keys,uint256[50] memory values,uint256 used) private pure returns(uint256){for(uint256 k;k<used;k++)if(keys[k]==key)return values[k];return key;}
 /// At most 50 shuffle steps, regardless of participant count. No external calls
 /// or storage writes. Sparse swaps in memory select unique uniform indices.
 function _rank(uint256 index,uint256 count,bytes32 entropy) private view returns(uint256){
  if(count<=MAX_WINNERS)return index;
  uint256[50] memory keys;uint256[50] memory values;uint256 used;
  for(uint256 i;i<MAX_WINNERS;i++){
   uint256 j=i+roll(uint256(entropy),1000+i,count-i);
   uint256 chosen=_lookup(j,keys,values,used);if(chosen==index)return i;
   uint256 moved=_lookup(i,keys,values,used);bool updated;
   for(uint256 k;k<used;k++)if(keys[k]==j){values[k]=moved;updated=true;break;}
   if(!updated){keys[used]=j;values[used]=moved;used++;}
  }
  return type(uint256).max;
 }
 // Settlement order is fixed by the first cast in each nonempty batch.
 // Neither claim order nor the caller can choose the inventory snapshot.
 function nextSettlementRound() public view returns(uint256){return settlementCursor<activeRounds.length?activeRounds[settlementCursor]:0;}
 function activeRoundCount() external view returns(uint256){return activeRounds.length;}
 function settleRound(uint256 roundId) external nonReentrant {
  if(roundId==0||nextSettlementRound()!=roundId)revert WrongState();
  bytes32 entropy=_entropy(roundId,_capture(roundId));
  uint256 count=participants[roundId].length;uint256 limit=count<MAX_WINNERS?count:MAX_WINNERS;
  uint256[50] memory keys;uint256[50] memory values;uint256 used;uint16 allocated;
  for(uint256 i;i<limit;i++){
   uint256 chosen=i;
   if(count>MAX_WINNERS){
    uint256 j=i+roll(uint256(entropy),1000+i,count-i);
    chosen=_lookup(j,keys,values,used);uint256 moved=_lookup(i,keys,values,used);bool updated;
    for(uint256 k;k<used;k++)if(keys[k]==j){values[k]=moved;updated=true;break;}
    if(!updated){keys[used]=j;values[used]=moved;used++;}
   }
   uint256 id=participants[roundId][chosen];Entry storage e=entries[id];
   if(totalAllocated>=MAX_SUPPLY||waterRemaining(e.water)==0)continue;
   uint16 selected=_selectSpecies(e.water,uint256(keccak256(abi.encode(entropy,id))));
   Species memory sp=species[selected];
   for(uint8 w;w<3;w++)if(sp.waters&(uint8(1)<<w)!=0)remainingPool[uint256(w)*5+sp.tier]--;
   speciesAllocated[selected]++;tierAllocated[sp.tier]++;totalAllocated++;allocated++;
   // Species occupies the two formerly unused bytes of the entry's first slot.
   // All other traits are reconstructed from this fixed species and saved hash.
   e.speciesId=selected;emit CatchAllocated(id,e.player,roundId,selected);
  }
  rounds[roundId]=RoundInfo(true,uint64(block.timestamp),allocated);settlementCursor++;
  emit RoundSettled(roundId,allocated);
 }
 // 0 missing, 1 waiting, 2 permanently unclaimed, 3 fish escaped, 4 claimed,
 // 5 historical proof needed, 7 waiting for chronological settlement.
 function entryOutcome(uint256 id) external view returns(uint8 outcome,uint256 rank){
  Entry storage e=entries[id];if(e.state==EntryState.None)return(0,0);if(e.state==EntryState.Claimed)return(4,0);
  if(!rounds[e.roundId].settled){
   uint256 target=targetBlock(e.roundId);if(block.number<target+HASH_DEPTH)return(1,0);
   if(savedHashes[e.roundId]==0&&historicalHash(target)==0)return(5,0);return(7,0);
  }
  if(e.speciesId==0)return(3,type(uint256).max);
  return(2,_rank(entryIndex[id],participants[e.roundId].length,_entropy(e.roundId,savedHashes[e.roundId])));
 }
 function awardFish(uint256 id) public view returns(Fish memory){
  Entry storage e=entries[id];if(e.speciesId==0||!rounds[e.roundId].settled)revert NotReady();
  return _fish(id,uint256(keccak256(abi.encode(_entropy(e.roundId,savedHashes[e.roundId]),id))));
 }
 function claim(uint256 id) external nonReentrant returns(uint256 token){return _claim(id);}
 function claimMany(uint256[] calldata ids) external nonReentrant {
  if(ids.length==0||ids.length>5)revert InvalidConfig();for(uint256 i;i<ids.length;i++)_claim(ids[i]);
 }
 function _claim(uint256 id) private returns(uint256 token){
  Entry storage e=entries[id];if(e.player!=msg.sender)revert Unauthorized();if(e.state!=EntryState.Entered)revert WrongState();
  if(!rounds[e.roundId].settled)revert NotReady();if(e.speciesId==0)revert NotSelected();
  Fish memory f=awardFish(id);
  // Allocation, not minting, consumed inventory. No expiry or stock check here.
  speciesMinted[f.speciesId]++;tierMinted[f.tier]++;
  token=nextTokenId++;e.state=EntryState.Claimed;e.tokenId=token;fish[token]=f;
  _safeMint(msg.sender,token);emit CatchClaimed(id,msg.sender,token,f.speciesId);
 }
 function poolRemaining(uint8 water,uint8 tier) public view returns(uint256){if(water>2||tier>4)revert InvalidConfig();return remainingPool[uint256(water)*5+tier];}
 function waterRemaining(uint8 water) public view returns(uint256 total){for(uint8 t;t<5;t++)total+=poolRemaining(water,t);}
 function _selectSpecies(uint8 water,uint256 word) private view returns(uint16){uint256[5] memory available;uint256 total;
  for(uint8 t;t<5;t++){available[t]=poolRemaining(water,t);if(available[t]>0)total+=tierCaps[t]-tierAllocated[t];}
  uint256 r=roll(word,1,total);uint8 tier;
  for(uint8 t;t<5;t++){if(available[t]==0)continue;uint256 remaining=tierCaps[t]-tierAllocated[t];if(r<remaining){tier=t;break;}r-=remaining;}
  uint256 k=uint256(water)*5+tier;uint256 choice=roll(word,2,available[tier]);uint16 selected;
  for(uint256 i;i<pools[k].length;i++){uint16 id2=pools[k][i];uint256 remaining=speciesCaps[id2]-speciesAllocated[id2];if(choice<remaining){selected=id2;break;}choice-=remaining;}
  return selected;
 }
 function _fish(uint256 id,uint256 word) private view returns(Fish memory f){
  Entry storage c=entries[id];uint16 selected=c.speciesId;uint8 tier=species[selected].tier;
  Species memory sp=species[selected];uint256 length=sp.minLength+roll(word,3,sp.maxLength-sp.minLength+1);
  uint256 denominator=uint256(sp.referenceLength)**3;uint256 mass=(uint256(sp.referenceMass)*length**3+denominator/2)/denominator;
  return Fish(sp.id,tier,c.water,uint16(length),uint64(mass==0?1:mass),uint16(6000+roll(word,4,4001)),rounds[c.roundId].settledAt,c.castBlock,id);
 }
 function tokenURI(uint256 id) public view override returns(string memory){
  _requireOwned(id);Fish memory f=fish[id];
  bytes memory json=abi.encodePacked('{"name":"Bnbfish #',id.toString(),'","description":"BNB Chain verifiable aquatic collectible","image":"',imageBase,uint256(f.speciesId).toString(),'.png","attributes":[{"trait_type":"Species ID","value":',uint256(f.speciesId).toString(),'}, {"trait_type":"Rarity","value":',uint256(f.tier).toString(),'}, {"trait_type":"Length mm","value":',uint256(f.lengthMm).toString(),'}, {"trait_type":"Mass grams","value":',uint256(f.massGrams).toString(),'}, {"trait_type":"Quality bps","value":',uint256(f.qualityBps).toString(),'}, {"trait_type":"Water","value":',uint256(f.water).toString(),'}, {"display_type":"date","trait_type":"Caught at","value":',uint256(f.caughtAt).toString(),'}]}');
  return string.concat('data:application/json;base64,',Base64.encode(json));
 }
}

