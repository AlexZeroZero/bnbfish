import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ganache from 'ganache';import {BrowserProvider,ContractFactory} from 'ethers';import {catalog} from '../scripts/shared.mjs';
const art=JSON.parse(fs.readFileSync('artifacts/claim200/BnbfishClaim200.json')),rules=JSON.parse(fs.readFileSync('artifacts/claim200/rules.json')),fee=10000000000000n;
test('Unclaimed fish stay identical across later batches, claims, pause and 8300 blocks; no double reservation',async()=>{
 const rpc=ganache.provider({chain:{chainId:1337},miner:{blockGasLimit:40000000},logging:{quiet:true}}),p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 try{
 const a=await p.getSigner(0),b=await p.getSigner(1),r=await p.getSigner(2);
 const n=await new ContractFactory(art.abi,art.bytecode,a).deploy(await a.getAddress(),await r.getAddress(),rules.hash,'https://bnbfish.trade/nft-images/',catalog);await n.waitForDeployment();await(await n.setPaused(false)).wait();
 const mine=async t=>{while(BigInt(await rpc.request({method:'eth_blockNumber',params:[]}))<t)await rpc.request({method:'evm_mine',params:[]});};
 await(await n.cast(0,{value:fee})).wait();await(await n.connect(b).cast(0,{value:fee})).wait();
 await mine(await n.targetBlock(1));await(await n.cast(0,{value:fee})).wait();
 await mine((await n.targetBlock(2))+3n);
 assert.equal((await n.entryOutcome(1)).outcome,7n);await assert.rejects(()=>n.awardFish(1));await assert.rejects(()=>n.claim(1));
 await assert.rejects(()=>n.settleRound(2));assert.equal(await n.nextSettlementRound(),1n);
 await(await n.connect(r).settleRound(1)).wait();assert.equal(await n.totalAllocated(),2n);assert.equal(await n.totalSupply(),0n);
 const f=Array.from(await n.awardFish(1));assert.equal((await n.entryOutcome(1)).outcome,2n);
 await assert.rejects(()=>n.settleRound(1));await(await n.settleRound(2)).wait();assert.equal(await n.totalAllocated(),3n);assert.equal(await n.nextSettlementRound(),0n);
 await(await n.connect(b).claim(2)).wait();assert.deepEqual(Array.from(await n.awardFish(1)),f);
 // A failed multi-claim must leave the earlier valid claim untouched.
 await assert.rejects(()=>n.claimMany([1,1]));assert.equal((await n.entryOutcome(1)).outcome,2n);assert.equal(await n.totalSupply(),1n);
 await(await n.setPaused(true)).wait();await mine((await n.targetBlock(2))+8300n);
 assert.equal((await n.entryOutcome(1)).outcome,2n);assert.deepEqual(Array.from(await n.awardFish(1)),f);
 await(await n.claimMany([1,3])).wait();assert.equal(await n.totalSupply(),3n);assert.equal(await n.totalAllocated(),3n);assert.equal((await n.entryOutcome(1)).outcome,4n);
 assert.deepEqual(Array.from(await n.fish((await n.entries(1)).tokenId)),f);
 let allocated=0n,minted=0n;for(const s of catalog){const x=await n.speciesAllocated(s.id),y=await n.speciesMinted(s.id);assert.ok(y<=x&&x<=await n.speciesCaps(s.id));allocated+=x;minted+=y;}assert.equal(allocated,3n);assert.equal(minted,3n);
 }finally{p.destroy();await rpc.disconnect();}
});
