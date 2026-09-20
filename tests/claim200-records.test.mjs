import test from 'node:test';import assert from 'node:assert/strict';
import {loadClaim200Records,claim200RecordStatus,CLAIM200_RECORD_LABELS} from '../web/claim200-records.js';
test('Record adapter separates pending verification from permanent unclaimed catches and paginates newest first',async()=>{
 const outcomes=[2n,7n,4n],fishReads=[];
 const contract={playerEntryCount:async()=>3n,playerEntryAt:async(_,i)=>BigInt(i+1),entries:async id=>({player:'0xabc',roundId:id,castAt:100n+id,water:0n,tokenId:id===3n?9n:0n}),entryOutcome:async id=>({outcome:outcomes[Number(id)-1]}),awardFish:async id=>{fishReads.push(id);return {speciesId:1n,tier:0n,lengthMm:120n,massGrams:30n,qualityBps:7000n,caughtAt:300n};}};
 const first=await loadClaim200Records(contract,'0xabc',{limit:2,blockTag:1000});assert.deepEqual(first.rows.map(r=>r.id),['3','2']);assert.equal(first.rows[1].fish,null);assert.equal(first.rows[1].status,'verifying');assert.equal(first.hasMore,true);assert.deepEqual(fishReads,[3n]);
 const next=await loadClaim200Records(contract,'0xabc',{offset:first.nextOffset,blockTag:1000});assert.equal(next.rows[0].status,'unclaimed');assert.equal(next.rows[0].claimable,true);assert.equal(next.rows[0].tokenId,null);assert.equal(next.hasMore,false);
 assert.throws(()=>claim200RecordStatus(6));await assert.rejects(()=>loadClaim200Records(contract,'0xwrong',{blockTag:1000}));
 for(const lang of ['zh','en','ru','ja'])assert.ok(CLAIM200_RECORD_LABELS[lang].unclaimed);
});
