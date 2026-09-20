import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ganache from 'ganache';
import solc from 'solc';
import {BrowserProvider,ContractFactory,AbiCoder,keccak256} from 'ethers';
import {catalog} from '../scripts/shared.mjs';
const art=JSON.parse(fs.readFileSync('artifacts/blockhash/BnbfishBlockhash.json','utf8'));
const {hash:rulesHash}=JSON.parse(fs.readFileSync('artifacts/blockhash/rules.json','utf8'));
async function fixture(){
 const rpc=ganache.provider({chain:{chainId:1337},logging:{quiet:true}});
 const p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 const a=await p.getSigner(0),b=await p.getSigner(1);
 const n=await new ContractFactory(art.abi,art.bytecode,a).deploy(await a.getAddress(),rulesHash,'ipfs://candidate/',catalog);await n.waitForDeployment();
 const tx=async promise=>(await promise).wait();
 const height=async()=>BigInt(await rpc.request({method:'eth_blockNumber',params:[]}));
 const mine=async target=>{while(await height()<target)await rpc.request({method:'evm_mine',params:[]});};
 await tx(n.setPaused(false));
 const advance=async target=>{await mine(target+2n);await tx(n.advance(20,{gasLimit:2000000}));};
 return {rpc,p,a,b,n,tx,height,mine,advance};
}
test('blockhash: persistent participation, exact source hash, immutable caps, permissionless processing and NFT transfer',async()=>{
 const {rpc,a,b,n,tx,mine,advance}=await fixture();try{
  let sum=0n;for(const s of catalog)sum+=await n.speciesCaps(s.id);assert.equal(sum,2000000n);
  for(const f of ['mint','setSpecies','setTierCaps','setRandomness','upgradeTo','requestRound','rawFulfillRandomWords'])assert.equal(n.interface.hasFunction(f),false);
  await assert.rejects(()=>n.connect(b).setPaused(true));await assert.rejects(()=>n.cast(0,{value:1}));
  await tx(n.cast(0));await tx(n.connect(b).cast(1));
  const first=await n.nextTarget();const eligible=await n.eligibleFrom(1);assert.equal(eligible,first+10n);
  await advance(first);assert.equal(await n.totalSupply(),0n);assert.equal(await n.activeCount(),2n);
  await mine(eligible);await assert.rejects(()=>n.withdrawRod(1));await assert.rejects(()=>n.cast(0));
  await mine(eligible+2n);await tx(n.connect(b).advance(1,{gasLimit:2000000}));
  const partial=await n.nodes(eligible);assert.equal(partial.cursor,1n);assert.equal(await n.totalSupply(),0n);
  const block=await rpc.request({method:'eth_getBlockByNumber',params:['0x'+eligible.toString(16),false]});assert.equal(await n.savedHashes(eligible),block.hash);
  const entropy=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','bytes32','uint256','bytes32'],[1337,await n.getAddress(),rulesHash,eligible,block.hash]));assert.equal(partial.entropy,entropy);
  await tx(n.advance(20,{gasLimit:2000000}));const done=await n.nodes(eligible);assert.equal(done.eligible,2n);assert.equal(done.tokenId,1n);assert.equal(await n.activeCount(),1n);
  const index=BigInt(keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','uint256','bytes32'],[BigInt(entropy),100,rulesHash])))%2n;
  assert.equal(done.winner,index+1n);
  const winner=await n.tickets(done.winner);assert.equal(winner.state,2n);const loser=done.winner===1n?2n:1n;assert.equal((await n.tickets(loser)).state,1n);
  await assert.rejects(()=>n.connect(done.winner===1n?a:b).withdrawRod(done.winner));
  const owner=await n.ownerOf(1);await tx(n.connect(owner==await a.getAddress()?a:b)['safeTransferFrom(address,address,uint256)'](owner,await b.getAddress(),1));assert.equal(await n.ownerOf(1),await b.getAddress());
  const second=await n.nextTarget();await advance(second);if(await n.totalSupply()===1n){await mine((await n.lastMintBlock())+9n);await tx(n.advance(20,{gasLimit:2000000}));}
  assert.equal(await n.totalSupply(),2n);assert.equal((await n.tickets(loser)).state,2n);assert.equal(await n.activeCount(),0n);
  await tx(n.advance(20));assert.equal(await n.totalSupply(),2n);
 }finally{await rpc.disconnect();}
});
test('blockhash: expiry never redraws, saved hashes survive downtime, pause preserves recovery',async()=>{
 const {rpc,b,n,tx,mine,advance}=await fixture();try{
  await tx(n.cast(0));const first=await n.nextTarget();await advance(first);const target=await n.nextTarget();
  await mine(target+2n);await tx(n.connect(b).captureHash(target));const hash=await n.savedHashes(target);
  await tx(n.setPaused(true));await mine(target+300n);await tx(n.connect(b).advance(20,{gasLimit:2000000}));assert.equal(await n.totalSupply(),1n);assert.equal(await n.savedHashes(target),hash);
  const start=await n.startBlock();await tx(n.setPaused(false));assert.equal(await n.startBlock(),start);
  await tx(n.cast(0));const expired=await n.nextTarget();await mine(expired+257n);
  await assert.rejects(()=>n.captureHash(expired));await tx(n.connect(b).advance(20));assert.equal((await n.nodes(expired)).state,3n);assert.equal((await n.tickets(2)).state,1n);assert.equal(await n.totalSupply(),1n);
  assert.equal(await n.nextTarget(),expired+10n);await assert.rejects(()=>n.captureHash(expired));
 }finally{await rpc.disconnect();}
});
test('blockhash: early withdrawal and idle skipping cannot grant retrospective eligibility',async()=>{
 const {rpc,b,n,tx,mine}=await fixture();try{
  await tx(n.cast(0));await assert.rejects(()=>n.connect(b).withdrawRod(1));await tx(n.withdrawRod(1));assert.equal(await n.activeCount(),0n);
  await mine((await n.nextTarget())+1000n);await tx(n.connect(b).cast(2));const t=await n.tickets(2);assert.ok(await n.eligibleFrom(2)>=t.castBlock+10n);assert.ok(await n.nextTarget()>t.castBlock);assert.equal(await n.totalSupply(),0n);
 }finally{await rpc.disconnect();}
});
test('blockhash: 45 repeated casts, hostile NFT receiver, batch invariance and bounded gas',async()=>{
 const {rpc,a,n,tx,mine,advance}=await fixture();try{
  const src='pragma solidity ^0.8.24; interface I {function cast(uint8) external returns(uint);} contract Many {function enter(address n,uint count) external {for(uint i;i<count;i++)I(n).cast(0);} function onERC721Received(address,address,uint,bytes calldata) external pure returns(bytes4){revert();}}';
  const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'Many.sol':{content:src}},settings:{evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
  const c=out.contracts['Many.sol'].Many;const many=await new ContractFactory(c.abi,'0x'+c.evm.bytecode.object,a).deploy();await many.waitForDeployment();
  await tx(many.enter(await n.getAddress(),45,{gasLimit:16000000}));assert.equal(await n.activeCount(),45n);assert.equal(await n.playerTicketCount(await many.getAddress()),45n);
  await advance(await n.nextTarget());const target=await n.nextTarget();await mine(target+2n);await tx(n.captureHash(target));
  const snapshot=await rpc.request({method:'evm_snapshot',params:[]});let maxGas=0n;
  while((await n.nodes(target)).state!==2n){const r=await tx(n.advance(20,{gasLimit:3000000}));if(r.gasUsed>maxGas)maxGas=r.gasUsed;}
  const winner=(await n.nodes(target)).winner;assert.ok(maxGas<3000000n);assert.equal(await n.ownerOf(1),await many.getAddress());
  await rpc.request({method:'evm_revert',params:[snapshot]});
  while((await n.nodes(target)).state!==2n)await tx(n.advance(7,{gasLimit:3000000}));
  assert.equal((await n.nodes(target)).winner,winner);assert.equal(await n.activeCount(),44n);assert.equal(await n.totalSupply(),1n);
  const next=await n.nextTarget();await mine(next+2n);
  while((await n.nodes(next)).state!==2n)await tx(n.advance(20,{gasLimit:3000000}));
  assert.equal((await n.nodes(next)).cursor,0n);assert.equal((await n.nodes(next)).eligible,44n);assert.equal(await n.totalSupply(),2n);
  console.log('Blockhash candidate: largest 20-promotion transaction Gas =',maxGas.toString());
 }finally{await rpc.disconnect();}
});
