import test from 'node:test';import assert from 'node:assert/strict';
import {createClaim200UI} from '../web/claim200-ui.js';
test('confirmed claim gives persistent feedback even when receipt endpoint lags',async t=>{
 const elements=new Map(),events=[],appended=[];const el=()=>({isConnected:true,classList:{add(){}},insertAdjacentHTML(){},setAttribute(){},remove(){},textContent:'',disabled:false});const $=s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s);};
 const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
 globalThis.FishGuide={species:[{id:1001,name:'泥鳅',rarity:'common'}],tiers:[{id:'common',name:'普通',color:'#fff'}]};
 globalThis.document={querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(),body:{appendChild:x=>appended.push(x)}};globalThis.window={dispatchEvent:e=>events.push(e)};
 t.mock.method(globalThis,'setTimeout',()=>0);
 let claimed=false,receiptReads=0;const address='0x'+'1'.repeat(40),hash='0x'+'a'.repeat(64);
 const client={address,config:{explorer:'https://bscscan.com'},reader:{getTransactionReceipt:async()=>{receiptReads++;return null;}},contract:{entries:async()=>({player:address,state:claimed?2n:1n,tokenId:claimed?1n:0n}),entryOutcome:async()=>({outcome:claimed?4n:2n}),awardFish:async()=>({speciesId:1001n,lengthMm:300n,massGrams:100n})},prepareClaim:async()=>({gasCost:100n}),claimCatch:async()=>({hash})};
 const ui=createClaim200UI({client,$,esc:String,sheet(){},close(){},showPage(){},notice:e=>{throw e;},error:e=>e.message,receipt:async()=>{claimed=true;return {status:1,hash};},saveTx:()=> 'tx',markTx(){},key:()=> 'scope'});
 await ui.popup('1');await $('#claim-now').onclick();await $('#claim-now').onclick();
 assert.equal(receiptReads,0);assert.equal($('#claim-now').textContent,'已领取 ✓');assert.equal($('#claim-gas').textContent,'NFT #1');assert.equal(appended.length,1);assert.equal(events[0].type,'bnbfish:claimed');assert.equal(events[0].detail.tokenId,'1');assert.equal(saved.size,0);
 for(const k of ['localStorage','FishGuide','document','window'])delete globalThis[k];
});

