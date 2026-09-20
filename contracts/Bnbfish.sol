// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

// Chainlink VRF v2.5 ABI. The coordinator address/keyHash/subscription must be
// supplied from the official deployment registry for the selected chain.
interface IVRFCoordinatorV2Plus {
 struct Request {bytes32 keyHash;uint256 subId;uint16 requestConfirmations;uint32 callbackGasLimit;uint32 numWords;bytes extraArgs;}
 function requestRandomWords(Request calldata request) external returns(uint256);
}

contract Bnbfish is ERC721Enumerable, Ownable2Step, ReentrancyGuard {
 using Strings for uint256;
 struct Species {uint16 id;uint8 tier;uint8 waters;uint16 weight;uint16 minLength;uint16 maxLength;uint16 referenceLength;uint32 referenceMass;}
 struct Fish {uint16 speciesId;uint8 tier;uint8 water;uint16 lengthMm;uint64 massGrams;uint16 qualityBps;uint64 caughtAt;uint64 castBlock;uint256 requestId;}
 enum State {None, Waiting, RandomReady, Settled}
 struct Cast {address player;uint8 water;State state;uint64 castBlock;uint64 castAt;uint256 randomWord;uint256 tokenId;}
 bytes32 public immutable rulesHash;
 address public immutable coordinator;
 bytes32 public immutable keyHash;
 uint256 public immutable subscriptionId;
 uint16 public immutable requestConfirmations;
 uint32 public constant CALLBACK_GAS_LIMIT=1500000;
 uint256 public constant AUTO_SETTLE_GAS=1100000;
 uint256 public constant baitFee=0;
 bool public paused=true;
 uint256 public nextTokenId=1;
 uint256 public constant MAX_SUPPLY=2000000;
 uint256 public constant EMPTY_BPS=2000;
 uint256[5] public tierCaps=[uint256(1200000),500000,150000,100000,50000];
 uint256[5] public tierMinted;
 mapping(uint16=>uint256) public speciesCaps;
 mapping(uint16=>uint256) public speciesMinted;
 uint256 public issuedCasts;
 string public imageBase;
 mapping(address=>uint256) public nonces;
 mapping(address=>uint256) private latestTicket;
 mapping(uint256=>Cast) private tickets;
 mapping(uint256=>uint256) public ticketRound;
 mapping(address=>uint256[]) private playerTickets;
 uint256 public constant ROUND_BLOCKS=10;
 uint256 public constant MAX_BATCH=20;
 uint256 public startBlock;
 uint256 public lastMintBlock;
 struct Round {uint256 first;uint256 count;uint256 requestId;uint256 word;uint256 processed;uint256 eligible;uint256 winner;uint256 tokenId;State state;}
 mapping(uint256=>Round) public rounds;
 mapping(uint256=>uint256) public vrfRound;
 uint256[] public activeRounds;
 uint256 public roundCursor;
 event RoundRequested(uint256 indexed roundId,uint256 indexed vrfRequestId);
 event RoundSettled(uint256 indexed roundId,uint256 winnerTicket,uint256 tokenId,uint256 eligible);
 mapping(uint256=>Fish) public fish;
 mapping(uint16=>Species) public species;
 mapping(uint16=>bool) private exists;
 mapping(uint256=>uint16[]) private pools;
 mapping(uint256=>uint256) public poolWeights;
 mapping(uint256=>uint256) internal remainingPool;
 event CastRequested(uint256 indexed requestId,address indexed player,uint8 water,uint256 fee,uint256 nonce);
 event RandomnessReady(uint256 indexed requestId);
 event CatchSettled(uint256 indexed requestId,address indexed player,uint256 indexed tokenId,uint16 speciesId,bool caught);
 event PauseChanged(bool paused);
 event AutoSettlementDeferred(uint256 indexed requestId);
 error InvalidConfig();error NotReady();error WrongFee();error PendingCast();error WrongCoordinator();error WrongState();error SettlementOrder();error SoldOut();

 constructor(address admin,address vrf,bytes32 lane,uint256 sub,uint16 confirmations,bytes32 catalogHash,string memory images,Species[] memory catalog)
 ERC721("Bnbfish BNB","BNBFISH") Ownable(admin) {
  if(vrf.code.length==0||sub==0||confirmations<3||confirmations>200||catalogHash==0||bytes(images).length==0||catalog.length!=100)revert InvalidConfig();
  coordinator=vrf;keyHash=lane;subscriptionId=sub;requestConfirmations=confirmations;rulesHash=catalogHash;imageBase=images;
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
 // Rules and quotas have no setters. Pausing only stops new entries.
 function setPaused(bool pause) external onlyOwner {if(!pause&&startBlock==0)startBlock=block.number;paused=pause;emit PauseChanged(pause);}
 function pendingRequest(address player) external view returns(uint256){uint256 id=latestTicket[player];return rounds[ticketRound[id]].state==State.Settled?0:id;}
 function currentRound() public view returns(uint256){return startBlock==0?0:(block.number-startBlock)/ROUND_BLOCKS+1;}
 function roundEnd(uint256 id) public view returns(uint256){if(startBlock==0||id==0)revert InvalidConfig();return startBlock+id*ROUND_BLOCKS;}
 function playerTicketCount(address player) external view returns(uint256){return playerTickets[player].length;}
 function playerTicketAt(address player,uint256 index) external view returns(uint256){return playerTickets[player][index];}
 function cast(uint8 water) external payable nonReentrant returns(uint256 ticketId){
  if(paused||water>2)revert NotReady();if(msg.value!=0)revert WrongFee();
  if(nextTokenId>MAX_SUPPLY||waterRemaining(water)==0)revert SoldOut();
  uint256 rid=currentRound();Round storage r=rounds[rid];ticketId=++issuedCasts;
  if(r.count==0){r.first=ticketId;r.state=State.Waiting;activeRounds.push(rid);}r.count++;
  tickets[ticketId]=Cast(msg.sender,water,State.Waiting,uint64(block.number),uint64(block.timestamp),0,0);
  ticketRound[ticketId]=rid;playerTickets[msg.sender].push(ticketId);latestTicket[msg.sender]=ticketId;
  emit CastRequested(ticketId,msg.sender,water,0,nonces[msg.sender]++);
 }
 // A transaction must trigger the VRF request AFTER the round closes. No late entry or redraw.
 function requestRound(uint256 rid) external nonReentrant returns(uint256 id){
  Round storage r=rounds[rid];if(r.count==0||block.number<roundEnd(rid)||r.requestId!=0||r.state!=State.Waiting)revert WrongState();
  id=IVRFCoordinatorV2Plus(coordinator).requestRandomWords(IVRFCoordinatorV2Plus.Request(keyHash,subscriptionId,requestConfirmations,CALLBACK_GAS_LIMIT,1,abi.encodeWithSelector(bytes4(keccak256("VRF ExtraArgsV1")),true)));
  if(id==0||vrfRound[id]!=0)revert InvalidConfig();r.requestId=id;vrfRound[id]=rid;emit RoundRequested(rid,id);
 }
 function rawFulfillRandomWords(uint256 id,uint256[] calldata words) external {
  if(msg.sender!=coordinator)revert WrongCoordinator();uint256 rid=vrfRound[id];Round storage r=rounds[rid];
  if(rid==0||r.state!=State.Waiting||words.length!=1)return;r.word=words[0];r.state=State.RandomReady;emit RandomnessReady(id);
  if(gasleft()>AUTO_SETTLE_GAS+100000){try this.processQueue{gas:AUTO_SETTLE_GAS}(MAX_BATCH) returns(uint256) {}catch{emit AutoSettlementDeferred(id);}}
  else emit AutoSettlementDeferred(id);
 }
 function poolRemaining(uint8 water,uint8 tier) public view returns(uint256){if(water>2||tier>4)revert InvalidConfig();return remainingPool[uint256(water)*5+tier];}
 function waterRemaining(uint8 water) public view returns(uint256 total){for(uint8 t;t<5;t++)total+=poolRemaining(water,t);}
 function nextSettlementRound() public view returns(uint256){return roundCursor<activeRounds.length?activeRounds[roundCursor]:0;}
 function nextSettlementRequest() public view returns(uint256){return rounds[nextSettlementRound()].first;}
 function casts(uint256 id) external view returns(Cast memory c){c=tickets[id];Round storage r=rounds[ticketRound[id]];c.state=r.state;c.tokenId=r.state==State.Settled&&r.winner==id?r.tokenId:0;}
 function roll(uint256 word,uint256 scope,uint256 bound) private view returns(uint256){return uint256(keccak256(abi.encode(word,scope,rulesHash)))%bound;}
 function ticketEligible(uint256 id) public view returns(bool){Round storage r=rounds[ticketRound[id]];if(r.state<State.RandomReady)revert WrongState();return roll(r.word,100+id*2,10000)>=EMPTY_BPS;}
 function outcome(uint256 id) external view returns(Fish memory f,bool caught){Round storage r=rounds[ticketRound[id]];if(r.state!=State.Settled)revert WrongState();if(r.winner!=id||r.tokenId==0)return(f,false);return(fish[r.tokenId],true);}
 function _fish(uint256 id,uint256 word) private view returns(Fish memory f){
  Cast storage c=tickets[id];uint256[5] memory available;uint256 total;
  for(uint8 t;t<5;t++){available[t]=poolRemaining(c.water,t);if(available[t]>0)total+=tierCaps[t]-tierMinted[t];}
  uint256 r=roll(word,1,total);uint8 tier;
  for(uint8 t;t<5;t++){if(available[t]==0)continue;uint256 remaining=tierCaps[t]-tierMinted[t];if(r<remaining){tier=t;break;}r-=remaining;}
  uint256 k=uint256(c.water)*5+tier;uint256 choice=roll(word,2,available[tier]);uint16 selected;
  for(uint256 i;i<pools[k].length;i++){uint16 id2=pools[k][i];uint256 remaining=speciesCaps[id2]-speciesMinted[id2];if(choice<remaining){selected=id2;break;}choice-=remaining;}
  Species memory sp=species[selected];uint256 length=sp.minLength+roll(word,3,sp.maxLength-sp.minLength+1);
  uint256 denominator=uint256(sp.referenceLength)**3;uint256 mass=(uint256(sp.referenceMass)*length**3+denominator/2)/denominator;
  return Fish(sp.id,tier,c.water,uint16(length),uint64(mass==0?1:mass),uint16(6000+roll(word,4,4001)),c.castAt,c.castBlock,id);
 }
 function settle(uint256 id) external nonReentrant {if(ticketRound[id]!=nextSettlementRound()||ticketRound[id]==0)revert SettlementOrder();_process(MAX_BATCH);}
 function processQueue(uint256 limit) external nonReentrant returns(uint256){return _process(limit);}
 // Bounded reservoir sampling: batches and callers cannot alter eligibility, winner or inventory order.
 function _process(uint256 limit) private returns(uint256 processed){
  if(limit==0||limit>MAX_BATCH)revert InvalidConfig();uint256 rid=nextSettlementRound();if(rid==0)return 0;Round storage r=rounds[rid];if(r.state!=State.RandomReady)return 0;
  while(r.processed<r.count&&processed<limit){uint256 id=r.first+r.processed;r.processed++;processed++;
   if(ticketEligible(id)&&waterRemaining(tickets[id].water)>0){r.eligible++;if(roll(r.word,101+id*2,r.eligible)==0)r.winner=id;}
  }
  if(r.processed<r.count)return processed;
  // In addition to one prize per round, successful mints are spaced by at least ten blocks.
  if(r.winner!=0&&nextTokenId<=MAX_SUPPLY){if(lastMintBlock!=0&&block.number<lastMintBlock+ROUND_BLOCKS)return processed;
   uint256 id=r.winner;Fish memory f=_fish(id,r.word);Species memory sp=species[f.speciesId];
   for(uint8 w;w<3;w++)if(sp.waters&(uint8(1)<<w)!=0)remainingPool[uint256(w)*5+f.tier]--;
   speciesMinted[f.speciesId]++;tierMinted[f.tier]++;uint256 tokenId=nextTokenId++;r.tokenId=tokenId;fish[tokenId]=f;lastMintBlock=block.number;
   _mint(tickets[id].player,tokenId);emit CatchSettled(id,tickets[id].player,tokenId,f.speciesId,true);
  }
  r.state=State.Settled;roundCursor++;emit RoundSettled(rid,r.winner,r.tokenId,r.eligible);
 }
 function tokenURI(uint256 id) public view override returns(string memory){
  _requireOwned(id);Fish memory f=fish[id];
  bytes memory json=abi.encodePacked('{"name":"Bnbfish #',id.toString(),'","description":"BNB Chain verifiable aquatic collectible","image":"',imageBase,uint256(f.speciesId).toString(),'.png","attributes":[{"trait_type":"Species ID","value":',uint256(f.speciesId).toString(),'}, {"trait_type":"Rarity","value":',uint256(f.tier).toString(),'}, {"trait_type":"Length mm","value":',uint256(f.lengthMm).toString(),'}, {"trait_type":"Mass grams","value":',uint256(f.massGrams).toString(),'}, {"trait_type":"Quality bps","value":',uint256(f.qualityBps).toString(),'}, {"trait_type":"Water","value":',uint256(f.water).toString(),'}, {"display_type":"date","trait_type":"Caught at","value":',uint256(f.caughtAt).toString(),'}]}');
  return string.concat('data:application/json;base64,',Base64.encode(json));
 }
}
