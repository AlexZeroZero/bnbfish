import {encodeRlp,keccak256,toBeHex,toQuantity} from 'ethers';
// Supports full Ethereum/BNB RPC headers, including optional post-fork fields.
export function encodeHeader(block){
 const q=value=>BigInt(value)===0n?'0x':toBeHex(BigInt(value));
 const fields=[block.parentHash,block.sha3Uncles,block.miner,block.stateRoot,block.transactionsRoot,block.receiptsRoot,block.logsBloom,q(block.difficulty),q(block.number),q(block.gasLimit),q(block.gasUsed),q(block.timestamp),block.extraData,block.mixHash,block.nonce];
 for(const [key,isQuantity] of [['baseFeePerGas',true],['withdrawalsRoot',false],['blobGasUsed',true],['excessBlobGas',true],['parentBeaconBlockRoot',false],['requestsHash',false]])if(block[key]!=null)fields.push(isQuantity?q(block[key]):block[key]);
 const rlp=encodeRlp(fields);if(keccak256(rlp).toLowerCase()!==block.hash.toLowerCase())throw Error('HEADER_HASH_MISMATCH: unsupported header format or invalid RPC response');return rlp;
}
export async function buildAncestorProof(provider,anchor,count){
 if(!Number.isSafeInteger(anchor)||!Number.isSafeInteger(count)||count<1||count>32||anchor<count)throw Error('INVALID_PROOF_RANGE');
 const headers=[];let anchorHash=null,expected=null;
 for(let i=0;i<count;i++){const block=await provider.send('eth_getBlockByNumber',[toQuantity(anchor-i),false]);if(!block)throw Error('HEADER_UNAVAILABLE');if(expected&&block.hash.toLowerCase()!==expected.toLowerCase())throw Error('BROKEN_PARENT_LINK');const encoded=encodeHeader(block);if(!anchorHash)anchorHash=block.hash;headers.push(encoded);expected=block.parentHash;}
 return {anchor,anchorHash,headers,provenHeight:anchor-count,provenHash:expected};
}

