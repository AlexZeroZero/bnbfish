// Read-only test against the explicitly verified deployment; sends no transactions.
import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {validateConfig} from '../web/transaction-security.js';
test('verified mainnet HTTP config, status, and retired selector resolves only to current collection',async()=>{
 const child=spawn(process.execPath,['service/server.mjs'],{env:{...process.env,PORT:'4218',Bnbfish_CONFIG:'config/claim200-mainnet.json'},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('HTTP startup timeout')),10000);child.stdout.on('data',d=>{if(d.toString().includes('Bnbfish BNB web')){clearTimeout(timer);resolve();}});child.once('exit',()=>{clearTimeout(timer);reject(Error('HTTP exited'));});});
  const read=async route=>{const r=await fetch('http://127.0.0.1:4218'+route,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);return r.json();};
  const c=await read('/api/config');validateConfig(c,'bnbfish.trade');assert.equal(c.contract,'0x60011EaC38503af422d0B9AFeC214a18aD99c11f');assert.equal(c.protocolFeeWei,'10000000000000');
  const old=await read('/api/config?collection=previous');assert.equal(old.archived,false);assert.equal(old.contract,c.contract);validateConfig(old,'bnbfish.trade');
  const status=await read('/api/status');assert.equal(status.fee,'10000000000000');
  assert.equal((await read('/api/status?collection=previous')).fee,status.fee);
 }finally{child.kill();}
});
