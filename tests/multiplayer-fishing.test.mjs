import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ganache from 'ganache';import {BrowserProvider,ContractFactory} from 'ethers';import {catalog} from '../scripts/shared.mjs';import {continuousProgress,continuousMethods} from '../web/continuous-client.js';
test('two different players: concurrent casts, one catch per target, other rod remains and later catches',async()=>{
 const rpc=ganache.provider({chain:{chainId:1337},logging:{quiet:true}}),p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 try{const a=await p.getSigner(0),b=await p.getSigner(1),art=JSON.parse(fs.readFileSync('artifacts/blockhash/BnbfishBlockhash.json')),rules=JSON.parse(fs.readFileSync('artifacts/blockhash/rules.json'));
 const n=await new ContractFactory(art.abi,art.bytecode,a).deploy(await a.getAddress(),rules.hash,'https://example.invalid/',catalog);await n.waitForDeployment();await(await n.setPaused(false)).wait();
 const casts=await Promise.all([n.connect(a).cast(0,{gasLimit:500000}),n.connect(b).cast(1,{gasLimit:500000})]);for(const tx of casts)assert.equal((await tx.wait()).status,1);
 assert.equal(await n.activeCount(),2n);assert.notEqual((await n.tickets(1)).player,(await n.tickets(2)).player);
 const mine=async target=>{while(BigInt(await rpc.request({method:'eth_blockNumber',params:[]}))<target)await rpc.request({method:'evm_mine',params:[]});};
 let sawSingle=false;
 for(let i=0;i<6&&await n.activeCount()>0n;i++){const target=await n.nextTarget();await mine(target+3n);const before=await n.totalSupply();await(await n.advanceFor(target,20,{gasLimit:3000000})).wait();const after=await n.totalSupply();assert.ok(after-before<=1n);if(after===1n){sawSingle=true;const states=[Number((await n.tickets(1)).state),Number((await n.tickets(2)).state)];assert.deepEqual(states.sort(),[1,2]);}}
 assert.ok(sawSingle);assert.equal(await n.totalSupply(),2n);assert.equal(await n.activeCount(),0n);assert.equal(await n.ownerOf((await n.tickets(1)).tokenId),await a.getAddress());assert.equal(await n.ownerOf((await n.tickets(2)).tokenId),await b.getAddress());
 }finally{p.destroy();await rpc.disconnect();}
});
test('operator funding outage is explicit and prevents submitting a new membership action',async()=>{
 const model=continuousProgress({id:'28',head:300n,remaining:100n},{ready:false,code:'needs-funding'});assert.match(model.title,/Gas/);assert.match(model.detail,/无需重复抛竿/);
 const original=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({contract:'0xabc',ready:false,code:'needs-funding'})});
 try{await assert.rejects(()=>continuousMethods.waitMembership.call({continuous:true,address:'player',signer:{},config:{chainId:56,contract:'0xabc'}}),/本次未提交交易/);}finally{global.fetch=original;}
});
