// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";


/// @notice Independent candidate. NOT the currently deployed VRF contract.
/// Block producers can bias block hashes. This is publicly reproducible, NOT VRF.
contract BnbfishServiceFee is ERC721Enumerable, Ownable2Step, ReentrancyGuard {
 using Strings for uint256;
 struct Species {uint16 id;uint8 tier;uint8 waters;uint16 weight;uint16 minLength;uint16 maxLength;uint16 referenceLength;uint32 referenceMass;}
 struct Fish {uint16 speciesId;uint8 tier;uint8 water;uint16 lengthMm;uint64 massGrams;uint16 qualityBps;uint64 caughtAt;uint64 castBlock;uint256 requestId;}

 enum TicketState {None, Fishing, Caught, Withdrawn}
 enum NodeState {None, Processing, Completed, Expired}
 struct Ticket {address player;uint8 water;TicketState state;uint64 castBlock;uint64 castAt;uint256 tokenId;}
 struct Node {NodeState state;bytes32 entropy;uint256 cursor;uint256 eligible;uint256 winner;uint256 tokenId;}
 uint256 public constant INTERVAL=10;
 uint256 public constant HASH_DEPTH=3;
 uint256 public constant MAX_BATCH=20;
 uint256 public constant MAX_SUPPLY=2000000;
 uint256 public constant baitFee=0.00001 ether;
 address payable public immutable feeRecipient;
 event ServiceFeePaid(uint256 indexed ticketId,address indexed player,address indexed recipient,uint256 amount);
 error FeeTransferFailed();
 bytes32 public immutable rulesHash;
 bool public paused=true;
 uint256 public startBlock;
 uint256 public nextTarget;
 uint256 public lastMintBlock;
 uint256 public nextTokenId=1;
 uint256 public issuedCasts;
 uint256[5] public tierCaps=[uint256(1200000),500000,150000,100000,50000];
 uint256[5] public tierMinted;
 mapping(uint16=>uint256) public speciesCaps;
 mapping(uint16=>uint256) public speciesMinted;
 mapping(uint16=>Species) public species;
 mapping(uint16=>bool) private exists;
 mapping(uint256=>uint16[]) private pools;
 mapping(uint256=>uint256) public poolWeights;
 mapping(uint256=>uint256) internal remainingPool;
 mapping(uint256=>Fish) public fish;
 string public imageBase;
 mapping(uint256=>Ticket) public tickets;
 mapping(uint256=>Node) public nodes;
 mapping(uint256=>bytes32) public savedHashes;
 uint256[] private active;
 mapping(uint256=>uint256) private activePosition;
 mapping(address=>uint256[]) private playerTickets;
 // Each ticket is promoted once; settled nodes never rescan historical tickets.
 uint256 public promotionCursor=1;
 mapping(uint8=>uint256[]) private eligibleTickets;
 mapping(uint256=>uint256) private eligiblePosition;
 mapping(uint256=>bool) private promoted;
 event CastRequested(uint256 indexed ticketId,address indexed player,uint8 water,uint256 eligibleFrom);
 event RodWithdrawn(uint256 indexed ticketId,address indexed player);
 event HashSaved(uint256 indexed target,bytes32 blockHash);
 event NodeCompleted(uint256 indexed target,uint256 indexed winner,uint256 tokenId,uint256 eligible);
 event NodeExpired(uint256 indexed target);
 event IdleSkipped(uint256 firstTarget,uint256 lastTarget);
 event CatchSettled(uint256 indexed ticketId,address indexed player,uint256 indexed tokenId,uint16 speciesId);
 event PauseChanged(bool paused);
 error InvalidConfig();error NotReady();error WrongFee();error SoldOut();error ProgressRequired();error WrongState();error Unauthorized();
 constructor(address admin,address payable recipient,bytes32 catalogHash,string memory images,Species[] memory catalog)
 ERC721("Bnbfish BNB","BNBFISH") Ownable(admin) {
  if(catalogHash==0||bytes(images).length==0||catalog.length!=100)revert InvalidConfig();
  if(recipient==address(0))revert InvalidConfig();feeRecipient=recipient;
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

 // No quota, entropy, cadence or catalog setters. Pause affects NEW casts only.
 function setPaused(bool value) external onlyOwner {
  if(!value&&startBlock==0){startBlock=block.number;nextTarget=startBlock+INTERVAL;}
  paused=value;emit PauseChanged(value);
 }
 function activeCount() external view returns(uint256){return active.length;}
 function activeTicketAt(uint256 index) external view returns(uint256){return active[index];}
 function playerTicketCount(address player) external view returns(uint256){return playerTickets[player].length;}
 function playerTicketAt(address player,uint256 index) external view returns(uint256){return playerTickets[player][index];}
 function eligibleFrom(uint256 id) public view returns(uint256){
  if(tickets[id].state==TicketState.None)revert WrongState();
  uint256 age=uint256(tickets[id].castBlock)+INTERVAL-startBlock;
  return startBlock+((age+INTERVAL-1)/INTERVAL)*INTERVAL;
 }
 // Once a target arrives, freeze membership until its result is committed.
 // This also freezes swaps in eligible pools while bounded promotion runs.
 function _membershipReady() private {
  if(startBlock==0)revert NotReady();
  if(active.length==0){promotionCursor=issuedCasts+1;if(block.number>=nextTarget){uint256 first=nextTarget;nextTarget=startBlock+((block.number-startBlock)/INTERVAL+1)*INTERVAL;emit IdleSkipped(first,nextTarget-INTERVAL);}}
  if(block.number>=nextTarget)revert ProgressRequired();
 }
 function cast(uint8 water) external payable nonReentrant returns(uint256 id){
  if(paused||water>2)revert NotReady();if(msg.value!=baitFee)revert WrongFee();
  if(nextTokenId>MAX_SUPPLY||waterRemaining(water)==0)revert SoldOut();
  _membershipReady();id=++issuedCasts;
  tickets[id]=Ticket(msg.sender,water,TicketState.Fishing,uint64(block.number),uint64(block.timestamp),0);
  activePosition[id]=active.length;active.push(id);playerTickets[msg.sender].push(id);
  emit CastRequested(id,msg.sender,water,eligibleFrom(id));
  (bool paid,)=feeRecipient.call{value:msg.value}("");if(!paid)revert FeeTransferFailed();
  emit ServiceFeePaid(id,msg.sender,feeRecipient,msg.value);
 }
 function withdrawRod(uint256 id) external nonReentrant {
  Ticket storage t=tickets[id];if(t.player!=msg.sender)revert Unauthorized();if(t.state!=TicketState.Fishing)revert WrongState();
  _membershipReady();t.state=TicketState.Withdrawn;_remove(id);emit RodWithdrawn(id,msg.sender);
 }
 function _remove(uint256 id) private {
  if(promoted[id]){
   uint8 water=tickets[id].water;uint256 ep=eligiblePosition[id];uint256 et=eligibleTickets[water][eligibleTickets[water].length-1];
   eligibleTickets[water][ep]=et;eligiblePosition[et]=ep;eligibleTickets[water].pop();delete promoted[id];delete eligiblePosition[id];
  }
  uint256 pos=activePosition[id];uint256 tail=active[active.length-1];active[pos]=tail;activePosition[tail]=pos;active.pop();delete activePosition[id];
 }
 // Anybody may preserve the predetermined hash, including ahead of queue processing.
 function captureHash(uint256 target) external returns(bytes32){return _capture(target);}
 function _capture(uint256 target) private returns(bytes32 h){
  if(startBlock==0||target<nextTarget||(target-startBlock)%INTERVAL!=0||block.number<target+HASH_DEPTH)revert NotReady();
  h=savedHashes[target];if(h!=0)return h;
  if(block.number>target+256)revert NotReady();h=blockhash(target);if(h==0)revert NotReady();
  savedHashes[target]=h;emit HashSaved(target,h);
 }
 function roll(uint256 word,uint256 scope,uint256 bound) private view returns(uint256){return uint256(keccak256(abi.encode(word,scope,rulesHash)))%bound;}
 // Promote at most MAX_BATCH newly mature tickets; old active tickets need no rescan.
 function advance(uint256 limit) external nonReentrant returns(uint256){return _advance(limit);}
 // Automation pins its simulated target; another caller cannot move its transaction
 // onto a different target with a different gas requirement before inclusion.
 function advanceFor(uint256 expectedTarget,uint256 limit) external nonReentrant returns(uint256){
  if(nextTarget!=expectedTarget)revert WrongState();return _advance(limit);
 }
 function _advance(uint256 limit) private returns(uint256 processed){
  if(limit==0||limit>MAX_BATCH)revert InvalidConfig();
  uint256 target=nextTarget;if(target==0||block.number<target+HASH_DEPTH)return 0;
  if(active.length==0){promotionCursor=issuedCasts+1;uint256 first=target;nextTarget=startBlock+((block.number-startBlock)/INTERVAL+1)*INTERVAL;emit IdleSkipped(first,nextTarget-INTERVAL);return 0;}
  Node storage n=nodes[target];
  if(n.state==NodeState.None){
   bytes32 h=savedHashes[target];
   if(h==0&&block.number>target+256){n.state=NodeState.Expired;nextTarget=target+INTERVAL;emit NodeExpired(target);return 0;}
   if(h==0)h=_capture(target);
   n.entropy=keccak256(abi.encode(block.chainid,address(this),rulesHash,target,h));n.state=NodeState.Processing;
  }
  while(promotionCursor<=issuedCasts&&processed<limit){
   uint256 id=promotionCursor;
   if(eligibleFrom(id)>target)break;
   promotionCursor++;processed++;n.cursor++;
   Ticket storage t=tickets[id];
   if(t.state==TicketState.Fishing){eligiblePosition[id]=eligibleTickets[t.water].length;eligibleTickets[t.water].push(id);promoted[id]=true;}
  }
  if(promotionCursor<=issuedCasts&&eligibleFrom(promotionCursor)<=target)return processed;
  // Each active, mature cast has one equal chance. Empty waters are excluded.
  // Pool order is frozen from target height; it cannot change between batches.
  if(n.winner==0){
   uint256 total;for(uint8 w;w<3;w++)if(waterRemaining(w)>0)total+=eligibleTickets[w].length;
   n.eligible=total;
   if(total>0){uint256 choice=roll(uint256(n.entropy),100,total);
    for(uint8 w;w<3;w++){if(waterRemaining(w)==0)continue;uint256 count=eligibleTickets[w].length;
     if(choice<count){n.winner=eligibleTickets[w][choice];break;}choice-=count;
    }
   }
  }
  if(n.winner!=0&&nextTokenId<=MAX_SUPPLY){
   if(lastMintBlock!=0&&block.number<lastMintBlock+INTERVAL)return processed;
   uint256 id=n.winner;Fish memory f=_fish(id,uint256(n.entropy));Species memory sp=species[f.speciesId];
   for(uint8 w;w<3;w++)if(sp.waters&(uint8(1)<<w)!=0)remainingPool[uint256(w)*5+f.tier]--;
   speciesMinted[f.speciesId]++;tierMinted[f.tier]++;uint256 token=nextTokenId++;n.tokenId=token;fish[token]=f;lastMintBlock=block.number;
   Ticket storage t=tickets[id];t.state=TicketState.Caught;t.tokenId=token;_remove(id);
   // No recipient callback: a hostile recipient must not block everyone else's progress.
   _mint(t.player,token);emit CatchSettled(id,t.player,token,f.speciesId);
  }
  n.state=NodeState.Completed;nextTarget=target+INTERVAL;emit NodeCompleted(target,n.winner,n.tokenId,n.eligible);
 }
 function poolRemaining(uint8 water,uint8 tier) public view returns(uint256){if(water>2||tier>4)revert InvalidConfig();return remainingPool[uint256(water)*5+tier];}
 function waterRemaining(uint8 water) public view returns(uint256 total){for(uint8 t;t<5;t++)total+=poolRemaining(water,t);}
 function _fish(uint256 id,uint256 word) private view returns(Fish memory f){
  Ticket storage c=tickets[id];uint256[5] memory available;uint256 total;
  for(uint8 t;t<5;t++){available[t]=poolRemaining(c.water,t);if(available[t]>0)total+=tierCaps[t]-tierMinted[t];}
  uint256 r=roll(word,1,total);uint8 tier;
  for(uint8 t;t<5;t++){if(available[t]==0)continue;uint256 remaining=tierCaps[t]-tierMinted[t];if(r<remaining){tier=t;break;}r-=remaining;}
  uint256 k=uint256(c.water)*5+tier;uint256 choice=roll(word,2,available[tier]);uint16 selected;
  for(uint256 i;i<pools[k].length;i++){uint16 id2=pools[k][i];uint256 remaining=speciesCaps[id2]-speciesMinted[id2];if(choice<remaining){selected=id2;break;}choice-=remaining;}
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
