// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";



/// @notice Candidate only. Future-block hash randomness is not manipulation-proof.
/// Rounds never block new casts. NFT mint gas is paid by the claimant.
contract BnbfishClaim600 is ERC721Enumerable, Ownable2Step, ReentrancyGuard {
 using Strings for uint256;
 struct Species {uint16 id;uint8 tier;uint8 waters;uint16 weight;uint16 minLength;uint16 maxLength;uint16 referenceLength;uint32 referenceMass;}
 struct Fish {uint16 speciesId;uint8 tier;uint8 water;uint16 lengthMm;uint64 massGrams;uint16 qualityBps;uint64 caughtAt;uint64 castBlock;uint256 requestId;}
 enum EntryState {None, Entered, Claimable, Claimed}
 enum RoundState {None, Processing, Completed, Expired}
 struct Entry {address player;uint8 water;EntryState state;uint64 castBlock;uint64 castAt;uint256 roundId;uint256 tokenId;}
 struct Round {bytes32 entropy;uint256 cursor;uint256 awards;RoundState state;}
 uint256 public constant INTERVAL=600;
 uint256 public constant MAX_WINNERS=300;
 uint256 public constant HASH_DEPTH=3;
 uint256 public constant MAX_BATCH=20;
 uint256 public constant MAX_SUPPLY=2000000;
 uint256 public constant baitFee=0;
 bytes32 public immutable rulesHash;
 bool public paused=true;
 uint256 public startBlock;
 uint256 public nextTokenId=1;
 uint256 public issuedCasts;
 uint256 public totalReserved;
 uint256[5] public tierCaps=[uint256(1200000),500000,150000,100000,50000];
 uint256[5] public tierReserved;
 uint256[5] public tierMinted;
 mapping(uint16=>uint256) public speciesCaps;
 mapping(uint16=>uint256) public speciesReserved;
 mapping(uint16=>uint256) public speciesMinted;
 mapping(uint16=>Species) public species;
 mapping(uint16=>bool) private exists;
 mapping(uint256=>uint16[]) private pools;
 mapping(uint256=>uint256) internal remainingPool;
 mapping(uint256=>uint256) public poolWeights;
 mapping(uint256=>Fish) public fish;
 mapping(uint256=>Fish) public awards;
 string public imageBase;
 mapping(uint256=>Entry) public entries;
 mapping(uint256=>Round) public rounds;
 mapping(uint256=>bytes32) public savedHashes;
 mapping(uint256=>uint256[]) private participants;
 mapping(uint256=>mapping(address=>uint256)) public entryOf;
 mapping(address=>uint256[]) private playerEntries;
 // Sparse partial Fisher-Yates shuffle: positions contain index + 1.
 mapping(uint256=>mapping(uint256=>uint256)) private shuffled;
 event CastRequested(uint256 indexed entryId,address indexed player,uint256 indexed roundId,uint8 water,uint256 target);
 event HashSaved(uint256 indexed roundId,uint256 target,bytes32 blockHash);
 event CatchAllocated(uint256 indexed entryId,address indexed player,uint256 indexed roundId,uint16 speciesId);
 event CatchClaimed(uint256 indexed entryId,address indexed player,uint256 indexed tokenId);
 event RoundCompleted(uint256 indexed roundId,uint256 awards);
 event RoundExpired(uint256 indexed roundId);
 event PauseChanged(bool paused);
 error InvalidConfig();error NotReady();error WrongFee();error SoldOut();error WrongState();error Unauthorized();error AlreadyEntered();
 constructor(address admin,bytes32 catalogHash,string memory images,Species[] memory catalog)
 ERC721("Bnbfish Claim 600","BNBFISH600") Ownable(admin) {
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
  if(paused||water>2)revert NotReady();if(msg.value!=0)revert WrongFee();
  if(totalReserved>=MAX_SUPPLY||waterRemaining(water)==0)revert SoldOut();
  uint256 roundId=currentRound();if(entryOf[roundId][msg.sender]!=0)revert AlreadyEntered();
  id=++issuedCasts;entries[id]=Entry(msg.sender,water,EntryState.Entered,uint64(block.number),uint64(block.timestamp),roundId,0);
  entryOf[roundId][msg.sender]=id;participants[roundId].push(id);playerEntries[msg.sender].push(id);
  emit CastRequested(id,msg.sender,roundId,water,targetBlock(roundId));
 }
 function captureHash(uint256 roundId) external returns(bytes32){return _capture(roundId);}
 function _capture(uint256 roundId) private returns(bytes32 h){
  uint256 target=targetBlock(roundId);if(participants[roundId].length==0||block.number<target+HASH_DEPTH)revert NotReady();
  h=savedHashes[roundId];if(h!=0)return h;
  if(rounds[roundId].state==RoundState.Expired||block.number>target+256)revert NotReady();
  h=blockhash(target);if(h==0)revert NotReady();savedHashes[roundId]=h;emit HashSaved(roundId,target,h);
 }
 function roll(uint256 word,uint256 scope,uint256 bound) private view returns(uint256){return uint256(keccak256(abi.encode(word,scope,rulesHash)))%bound;}
 /// Anyone may pay to prepare bounded batches. This reserves fish but NEVER mints.
 function prepareRound(uint256 roundId,uint256 limit) external nonReentrant {
  if(limit==0||limit>MAX_BATCH)revert InvalidConfig();
  uint256 target=targetBlock(roundId);uint256 count=participants[roundId].length;
  if(count==0||block.number<target+HASH_DEPTH)revert NotReady();Round storage r=rounds[roundId];
  if(r.state==RoundState.Completed||r.state==RoundState.Expired)revert WrongState();
  if(r.state==RoundState.None){
   bytes32 h=savedHashes[roundId];
   if(h==0&&block.number>target+256){r.state=RoundState.Expired;emit RoundExpired(roundId);return;}
   if(h==0)h=_capture(roundId);
   r.entropy=keccak256(abi.encode(block.chainid,address(this),rulesHash,roundId,target,h));r.state=RoundState.Processing;
  }
  uint256 stop=r.cursor+limit;if(stop>count)stop=count;
  while(r.cursor<stop&&r.awards<MAX_WINNERS&&totalReserved<MAX_SUPPLY){
   uint256 i=r.cursor;uint256 j=i+roll(uint256(r.entropy),1000+i,count-i);
   uint256 picked=shuffled[roundId][j];if(picked==0)picked=j+1;
   uint256 moved=shuffled[roundId][i];if(moved==0)moved=i+1;
   shuffled[roundId][j]=moved;delete shuffled[roundId][i];r.cursor++;
   uint256 id=participants[roundId][picked-1];Entry storage e=entries[id];
   if(waterRemaining(e.water)==0)continue;
   Fish memory f=_fish(id,uint256(keccak256(abi.encode(r.entropy,id))));Species memory sp=species[f.speciesId];
   for(uint8 w;w<3;w++)if(sp.waters&(uint8(1)<<w)!=0)remainingPool[uint256(w)*5+f.tier]--;
   speciesReserved[f.speciesId]++;tierReserved[f.tier]++;totalReserved++;r.awards++;
   awards[id]=f;e.state=EntryState.Claimable;emit CatchAllocated(id,e.player,roundId,f.speciesId);
  }
  if(r.cursor==count||r.awards==MAX_WINNERS||totalReserved==MAX_SUPPLY){r.state=RoundState.Completed;emit RoundCompleted(roundId,r.awards);}
 }
 /// Claimant pays gas. The recipient is fixed; relayers cannot steal an award.
 function claim(uint256 id) external nonReentrant returns(uint256 token){
  Entry storage e=entries[id];if(e.player!=msg.sender)revert Unauthorized();if(e.state!=EntryState.Claimable)revert WrongState();
  Fish memory f=awards[id];token=nextTokenId++;e.state=EntryState.Claimed;e.tokenId=token;fish[token]=f;
  speciesMinted[f.speciesId]++;tierMinted[f.tier]++;delete awards[id];
  _safeMint(msg.sender,token);emit CatchClaimed(id,msg.sender,token);
 }
 function poolRemaining(uint8 water,uint8 tier) public view returns(uint256){if(water>2||tier>4)revert InvalidConfig();return remainingPool[uint256(water)*5+tier];}
 function waterRemaining(uint8 water) public view returns(uint256 total){for(uint8 t;t<5;t++)total+=poolRemaining(water,t);}
 function _fish(uint256 id,uint256 word) private view returns(Fish memory f){
  Entry storage c=entries[id];uint256[5] memory available;uint256 total;
  for(uint8 t;t<5;t++){available[t]=poolRemaining(c.water,t);if(available[t]>0)total+=tierCaps[t]-tierReserved[t];}
  uint256 r=roll(word,1,total);uint8 tier;
  for(uint8 t;t<5;t++){if(available[t]==0)continue;uint256 remaining=tierCaps[t]-tierReserved[t];if(r<remaining){tier=t;break;}r-=remaining;}
  uint256 k=uint256(c.water)*5+tier;uint256 choice=roll(word,2,available[tier]);uint16 selected;
  for(uint256 i;i<pools[k].length;i++){uint16 id2=pools[k][i];uint256 remaining=speciesCaps[id2]-speciesReserved[id2];if(choice<remaining){selected=id2;break;}choice-=remaining;}
  Species memory sp=species[selected];uint256 length=sp.minLength+roll(word,3,sp.maxLength-sp.minLength+1);
  uint256 denominator=uint256(sp.referenceLength)**3;uint256 mass=(uint256(sp.referenceMass)*length**3+denominator/2)/denominator;
  return Fish(sp.id,tier,c.water,uint16(length),uint64(mass==0?1:mass),uint16(6000+roll(word,4,4001)),uint64(block.timestamp),c.castBlock,id);
 }
 function tokenURI(uint256 id) public view override returns(string memory){
  _requireOwned(id);Fish memory f=fish[id];
  bytes memory json=abi.encodePacked('{"name":"Bnbfish #',id.toString(),'","description":"BNB Chain verifiable aquatic collectible","image":"',imageBase,uint256(f.speciesId).toString(),'.png","attributes":[{"trait_type":"Species ID","value":',uint256(f.speciesId).toString(),'}, {"trait_type":"Rarity","value":',uint256(f.tier).toString(),'}, {"trait_type":"Length mm","value":',uint256(f.lengthMm).toString(),'}, {"trait_type":"Mass grams","value":',uint256(f.massGrams).toString(),'}, {"trait_type":"Quality bps","value":',uint256(f.qualityBps).toString(),'}, {"trait_type":"Water","value":',uint256(f.water).toString(),'}, {"display_type":"date","trait_type":"Caught at","value":',uint256(f.caughtAt).toString(),'}]}');
  return string.concat('data:application/json;base64,',Base64.encode(json));
 }
}

