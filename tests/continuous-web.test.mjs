import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawn} from 'node:child_process';import ganache from 'ganache';import {BrowserProvider,ContractFactory} from 'ethers';
import {catalog} from '../scripts/shared.mjs';import {EvmClient,api,receipt} from '../web/evm-client.js';import {continuousProgress} from '../web/continuous-client.js';import {planBlockhashAction} from '../scripts/blockhash-actions.mjs';
test('continuous adapter + HTTP + permissionless keeper action: multiple casts, persistent loss, withdrawal, mint and transfer',async()=>{
 const server=ganache.server({chain:{chainId:1337},logging:{quiet:true}});await server.listen(8549,'127.0.0.1');
 const p=new BrowserProvider(server.provider,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 let child,client;const originalFetch=global.fetch;
 try{
  const a=await p.getSigner(0),b=await p.getSigner(1),address=await a.getAddress();const art=JSON.parse(fs.readFileSync('artifacts/blockhash/BnbfishBlockhash.json','utf8')),definition=JSON.parse(fs.readFileSync('artifacts/blockhash/rules.json','utf8'));
  const n=await new ContractFactory(art.abi,art.bytecode,a).deploy(address,definition.hash,'ipfs://test/',catalog);await n.waitForDeployment();await(await n.setPaused(false)).wait();
  fs.writeFileSync('.runtime/continuous-api-test.json',JSON.stringify({chainId:1337,local:true,rpcUrl:'http://127.0.0.1:8549',protocol:'blockhash-continuous-v1',contract:await n.getAddress(),deploymentBlock:1,baitFeeBnb:'0',name:'LOCAL TEST ONLY',legacy:{contract:'0x0000000000000000000000000000000000000001'}}));
  child=spawn(process.execPath,['service/server.mjs'],{env:{...process.env,PORT:'4195',Bnbfish_CONFIG:'.runtime/continuous-api-test.json'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('HTTP startup timeout')),10000);child.stdout.on('data',d=>{if(d.toString().includes('Bnbfish BNB web')){clearTimeout(timer);resolve();}});child.once('exit',()=>{clearTimeout(timer);reject(Error('HTTP exited'));});});
  global.fetch=(url,options)=>originalFetch(new URL(url,'http://127.0.0.1:4195/'),options);
  client=new EvmClient();await client.init();assert.equal(client.continuous,true);assert.equal(client.contract.interface.hasFunction('requestRound'),false);assert.equal((await api('/api/status')).ready,true);
  const oldLinkConfig=await api('/api/config?collection=legacy');assert.equal(oldLinkConfig.contract,await n.getAddress());assert.equal(oldLinkConfig.legacy,false);assert.equal((await api('/api/status?collection=legacy')).ready,true);
  const injected={request:({method,params=[]})=>method==='eth_requestAccounts'||method==='eth_accounts'?Promise.resolve([address]):server.provider.request({method,params})};
  await client.connect(injected);client.wallet.pollingInterval=10;
  const r=await receipt(await client.sendCast(await client.prepareCast(0)));const log=r.logs.map(x=>{try{return n.interface.parseLog(x);}catch{return null;}}).find(x=>x?.name==='CastRequested');assert.equal(client.castTicketId(log),'1');
  await receipt(await client.sendCast(await client.prepareCast(1)));assert.equal(await client.pendingTicket(),2n);
  const mine=async target=>{while(BigInt(await server.provider.request({method:'eth_blockNumber',params:[]}))<target)await server.provider.request({method:'evm_mine',params:[]});};
  let target=await n.nextTarget();await mine(target);await assert.rejects(()=>client.waitMembership(()=>{},5));
  await mine(target+3n);let action=await planBlockhashAction(n,target+3n);assert.equal(action.method,'advanceFor');await(await n.connect(b)[action.method](...action.args,{gasLimit:2500000})).wait();
  assert.equal((await client.fishingState(1)).ticket.state,1n);assert.equal((await client.fishingEntries()).rows.length,2);
  target=await n.nextTarget();await mine(target+3n);action=await planBlockhashAction(n,target+3n);await(await n.connect(b)[action.method](...action.args,{gasLimit:2500000})).wait();
  await assert.rejects(()=>n.advanceFor(target,20));
  const rows=(await client.fishingEntries()).rows;const loser=rows.find(x=>Number(x.ticket.state)===1),winner=rows.find(x=>Number(x.ticket.state)===2);assert.ok(loser&&winner);assert.equal(await client.pendingTicket(),loser.id);
  await receipt(await client.withdraw(await client.prepareWithdraw(loser.id)));assert.equal(await client.pendingTicket(),0n);
  const holdings=await client.holdings();assert.equal(holdings.length,1);await receipt(await client.transfer(await client.prepareTransfer(holdings[0].id,await b.getAddress())));assert.equal(await n.ownerOf(1),await b.getAddress());
  const activity=await client.nftActivity();assert.equal(activity.rows.length,2);assert.ok(activity.rows.every(r=>r.requestId===String(winner.id))); 
 }finally{global.fetch=originalFetch;client?.reader.destroy();child?.kill();await server.close();}
});
test('continuous progress never reports missing fish as empty; outage and expiry stay explicit',()=>{
 const s={id:'1',head:12n,target:20n,next:20n,last:0n,remaining:100n,node:{state:0n},previousExpired:false};
 assert.match(continuousProgress(s,{ready:true}).detail,/继续垂钓/);assert.match(continuousProgress(s,{ready:false}).title,/暂缓/);
 assert.match(continuousProgress({...s,head:400n},{ready:true}).detail,/过期/);assert.match(continuousProgress({...s,remaining:0n},{ready:true}).title,/全部收藏/);
});
