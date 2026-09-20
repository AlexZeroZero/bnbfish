import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import solc from 'solc';import ganache from 'ganache';import {BrowserProvider,ContractFactory} from 'ethers';import {catalog} from '../scripts/shared.mjs';
const {hash}=JSON.parse(fs.readFileSync('artifacts/blockhash/rules.json','utf8'));
test('blockhash final quota: no extra issuance and depleted water excluded',async()=>{
 const harness='pragma solidity ^0.8.24; import "BnbfishBlockhash.sol"; contract Boundary is BnbfishBlockhash {constructor(address a,bytes32 h,Species[] memory c) BnbfishBlockhash(a,h,"ipfs://test/",c){} function seedLast(uint16 id,uint16[] calldata ids) external {for(uint i;i<ids.length;i++)speciesMinted[ids[i]]=speciesCaps[ids[i]];for(uint i;i<5;i++)tierMinted[i]=tierCaps[i];speciesMinted[id]--;tierMinted[species[id].tier]--;for(uint i;i<15;i++)remainingPool[i]=0;for(uint8 w;w<3;w++)if(species[id].waters&(uint8(1)<<w)!=0)remainingPool[uint(w)*5+species[id].tier]=1;nextTokenId=MAX_SUPPLY;}}';
 // Local-only harness; never writes production artifacts or deployment data.
 const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'BnbfishBlockhash.sol':{content:fs.readFileSync('contracts/BnbfishBlockhash.sol','utf8')},'Boundary.sol':{content:harness}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}),{import:p=>({contents:fs.readFileSync('node_modules/'+p,'utf8')})}));assert.ok(!out.errors?.some(e=>e.severity==='error'),JSON.stringify(out.errors));
 const rpc=ganache.provider({chain:{chainId:1337},logging:{quiet:true}}),p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 try{const a=await p.getSigner(),c=out.contracts['Boundary.sol'].Boundary,n=await new ContractFactory(c.abi,'0x'+c.evm.bytecode.object,a).deploy(await a.getAddress(),hash,catalog);await n.waitForDeployment();const tx=async p=>(await p).wait();await tx(n.setPaused(false));
  const last=catalog.find(s=>s.waters&1);await tx(n.seedLast(last.id,catalog.map(s=>s.id)));await tx(n.cast(0));await tx(n.cast(0));
  const mine=async h=>{while(BigInt(await rpc.request({method:'eth_blockNumber',params:[]}))<h)await rpc.request({method:'evm_mine',params:[]});};
  while(await n.nextTokenId()===2000000n){await mine((await n.nextTarget())+2n);await tx(n.advance(20,{gasLimit:3000000}));}
  assert.equal(await n.nextTokenId(),2000001n);assert.equal((await n.fish(2000000)).speciesId,BigInt(last.id));assert.equal(await n.waterRemaining(0),0n);await assert.rejects(()=>n.cast(0));
  await mine((await n.nextTarget())+2n);await tx(n.advance(20,{gasLimit:3000000}));assert.equal(await n.nextTokenId(),2000001n);assert.equal(await n.activeCount(),1n);
  for(let i=0;i<5;i++)assert.equal(await n.tierMinted(i),await n.tierCaps(i));
  const remaining=await n.activeTicketAt(0);await tx(n.withdrawRod(remaining));assert.equal(await n.activeCount(),0n);
 }finally{await rpc.disconnect();}
});
