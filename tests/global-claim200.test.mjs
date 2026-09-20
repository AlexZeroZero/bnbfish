import test from 'node:test';import assert from 'node:assert/strict';import {createGlobalCatches} from '../service/global-catches.mjs';
test('reserved fish count before claiming; claiming moves counters without increasing catches',async()=>{
 let time=100,claimed=0;const at=[];
 const provider={getNetwork:async()=>({chainId:56}),send:async()=> '0x67',getBlock:async n=>({hash:'block'+n})};
 const contract={rulesHash:async()=> 'rules',totalSupply:async()=>BigInt(claimed),totalAllocated:async o=>{at.push(o.blockTag);return 2n;},speciesAllocated:async id=>1n,fish:async id=>({speciesId:1n,requestId:1n,caughtAt:1000n,water:0n}),entries:async()=>({tokenId:1n,state:2n,player:'0x'+'1'.repeat(40)})};
 const feed=createGlobalCatches({provider,contract,chainId:56,address:'0x'+'a'.repeat(40),rulesHash:'rules',speciesIds:[1,2],claim200:true,ttlMs:10,now:()=>time});
 const before=await feed.get();assert.equal(before.total,2);assert.equal(before.unclaimed,2);assert.equal(before.claimed,0);assert.equal(before.speciesCount,2);assert.deepEqual(before.latest,[]);
 claimed=1;time+=20;const after=await feed.get();assert.equal(after.total,2);assert.equal(after.unclaimed,1);assert.equal(after.claimed,1);assert.equal(after.latest[0].tokenId,'1');assert.ok(at.every(x=>x===100));
 claimed=3;time+=20;assert.equal((await feed.get()).stale,true);
});
