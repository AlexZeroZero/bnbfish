// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Candidate component, not deployed. No oracle/admin setters or paid operator.
/// Recent hashes come from the EVM or BNB's EIP-2935 system contract. Older hashes
/// require a parent-header chain anchored to one of these hashes or a verified checkpoint.
abstract contract HistoricalBlockhashStore {
 address public constant HISTORY_ADDRESS=0x0000F90827F1C53a10cb7A02335B175320002935;
 bytes32 public constant HISTORY_CODE_HASH=0x6e49e66782037c0555897870e29fa5e552daf4719552131a0abce779daec0a5d;
 uint256 public constant HISTORY_WINDOW=8191;
 uint256 public constant PROOF_BATCH=32;
 mapping(uint256=>bytes32) public verifiedBlockHashes;
 error HashNotAvailable();error InvalidHeaderProof();error TooEarly();
 event HistoricalHashVerified(uint256 indexed height,bytes32 blockHash);
 function historicalHash(uint256 height) public view returns(bytes32 h){
  if(height>=block.number||block.number-height<3)return bytes32(0);
  h=verifiedBlockHashes[height];if(h!=0)return h;
  uint256 age=block.number-height;
  if(age<=256)return blockhash(height);
  if(age>HISTORY_WINDOW||HISTORY_ADDRESS.codehash!=HISTORY_CODE_HASH)return bytes32(0);
  (bool ok,bytes memory data)=HISTORY_ADDRESS.staticcall(abi.encode(height));
  if(ok&&data.length==32)h=abi.decode(data,(bytes32));
 }
 function saveHistoricalHash(uint256 height) public returns(bytes32 h){
  h=historicalHash(height);if(h==0)revert HashNotAvailable();_save(height,h);
 }
 function _save(uint256 height,bytes32 h) private {
  bytes32 previous=verifiedBlockHashes[height];if(previous!=0&&previous!=h)revert InvalidHeaderProof();
  if(previous==0){verifiedBlockHashes[height]=h;emit HistoricalHashVerified(height,h);}
 }
 /// First header is the anchor itself. N descending headers prove anchor-N.
 /// Large gaps can be bridged in multiple transactions using the saved endpoint.
 function proveAncestors(uint256 anchor,bytes[] calldata headers) external returns(uint256 height,bytes32 h){
  uint256 count=headers.length;if(count==0||count>PROOF_BATCH||anchor<count)revert InvalidHeaderProof();
  h=historicalHash(anchor);if(h==0)revert HashNotAvailable();height=anchor;
  for(uint256 i;i<count;i++){
   bytes calldata header=headers[i];if(header.length>8192||keccak256(header)!=h)revert InvalidHeaderProof();
   h=_parentHash(header);height--;
  }
  _save(height,h);
 }
 function _parentHash(bytes calldata header) private pure returns(bytes32 parent){
  if(header.length<35)revert InvalidHeaderProof();uint256 lead=uint8(header[0]);
  // Canonical full Ethereum/BNB headers are long RLP lists, with parentHash first.
  if(lead<0xf8||lead>0xf9)revert InvalidHeaderProof();uint256 lengthBytes=lead-0xf7;
  if(header[1]==0)revert InvalidHeaderProof();uint256 payload;
  for(uint256 i=1;i<=lengthBytes;i++)payload=(payload<<8)|uint8(header[i]);
  if(payload<56||(lengthBytes==2&&payload<=255)||payload+1+lengthBytes!=header.length)revert InvalidHeaderProof();
  uint256 offset=1+lengthBytes;if(uint8(header[offset])!=0xa0)revert InvalidHeaderProof();
  assembly {parent:=calldataload(add(add(header.offset,offset),1))}
  if(parent==0)revert InvalidHeaderProof();
 }
}
