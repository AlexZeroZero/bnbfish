import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ganache from 'ganache';
import {BrowserProvider,ContractFactory,AbiCoder,keccak256,toQuantity} from 'ethers';
import {catalog} from '../scripts/shared.mjs';
const art=JSON.parse(fs.readFileSync('artifacts/claim200/BnbfishClaim200.json'));
const rules=JSON.parse(fs.readFileSync('artifacts/claim200/rules.json'));
const fee=10000000000000n, coder=AbiCoder.defaultAbiCoder();
const report={network:'local simulation only',gasPriceGweiAssumption:0.05,scenarios:[]};
for(const count of [1,50,51])test(`200 block batch: ${count} players, exact fee, selection and claims`,async()=>{
 const rpc=ganache.provider({wallet:{totalAccounts:count+2},chain:{chainId:1337},miner:{blockGasLimit:40000000},logging:{quiet:true}});
 const p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 try{
 const a=await p.getSigner(0),recipient=await p.getSigner(count+1),recipientAddress=await recipient.getAddress();
 const initial=await p.getBalance(recipientAddress);
 const n=await new ContractFactory(art.abi,art.bytecode,a).deploy(await a.getAddress(),recipientAddress,rules.hash,'https://bnbfish.trade/nft-images/',catalog);await n.waitForDeployment();
 await assert.rejects(()=>n.cast(0,{value:fee}));await(await n.setPaused(false)).wait();
 await assert.rejects(()=>n.cast(0));await assert.rejects(()=>n.cast(0,{value:fee+1n}));await assert.rejects(()=>n.cast(3,{value:fee}));
 const casts=[];
 for(let i=0;i<count;i++){const s=await p.getSigner(i);casts.push(Number((await(await n.connect(s).cast(i%3,{value:fee})).wait()).gasUsed));}
 await assert.rejects(()=>n.cast(0,{value:fee}));assert.equal(await n.protocolFeesCollected(),fee*BigInt(count));assert.equal(await n.protocolFeesForwarded(),fee*BigInt(count));assert.equal(await p.getBalance(recipientAddress)-initial,fee*BigInt(count));
 await assert.rejects(()=>n.claim(1));const target=await n.targetBlock(1);
 while(BigInt(await rpc.request({method:'eth_blockNumber',params:[]}))<target+3n)await rpc.request({method:'evm_mine',params:[]});
 // Independent full-array Fisher-Yates reference, not the sparse contract implementation.
 const block=await p.send('eth_getBlockByNumber',[toQuantity(target),false]);
 const entropy=keccak256(coder.encode(['uint256','address','bytes32','uint256','uint256','bytes32'],[1337,await n.getAddress(),rules.hash,1,target,block.hash]));
 const shuffled=Array.from({length:count},(_,i)=>i),expected=new Map();
 for(let i=0;i<Math.min(50,count);i++){
  const j=count<=50?i:i+Number(BigInt(keccak256(coder.encode(['uint256','uint256','bytes32'],[entropy,1000+i,rules.hash])))%BigInt(count-i));
  [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];expected.set(shuffled[i],i);
 }
 const settlementGas=Number((await(await n.settleRound(1,{gasLimit:15000000})).wait()).gasUsed);
 for(let i=0;i<count;i++){const o=await n.entryOutcome(i+1);assert.equal(o.outcome,expected.has(i)?2n:3n);if(expected.has(i))assert.equal(o.rank,BigInt(expected.get(i)));else { const loser=await p.getSigner(i);await assert.rejects(()=>n.connect(loser).claim(i+1)); }}
 assert.equal(await n.totalSupply(),0n);
 // New batch does not wait for anyone to claim the preceding one.
 await(await n.cast(0,{value:fee})).wait();assert.equal(await n.participantCount(2),1n);
 await(await n.setPaused(true)).wait();await assert.rejects(()=>n.connect(recipient).cast(0,{value:fee}));
 const claims=[];
 for(const index of [...expected.keys()].slice(0,3)){
  const s=await p.getSigner(index);await assert.rejects(()=>n.connect(recipient).claim(index+1));
  claims.push(Number((await(await n.connect(s).claim(index+1)).wait()).gasUsed));
  assert.equal((await n.entryOutcome(index+1)).outcome,4n);await assert.rejects(()=>n.connect(s).claim(index+1));
  const e=await n.entries(index+1);assert.equal(await n.ownerOf(e.tokenId),await s.getAddress());
  const metadata=JSON.parse(Buffer.from((await n.tokenURI(e.tokenId)).split(',')[1],'base64'));assert.match(metadata.image,/nft-images\/\d+\.png$/);
 }
 assert.equal(await n.totalSupply(),BigInt(claims.length));assert.equal(await n.MAX_SUPPLY(),2000000n);
 let cap=0n;for(const s of catalog)cap+=await n.speciesCaps(s.id);assert.equal(cap,2000000n);
 report.scenarios.push({participants:count,eligible:expected.size,settlementGas,castGasMin:Math.min(...casts),castGasMax:Math.max(...casts),claimGas:claims});
 fs.writeFileSync('docs/CLAIM200-GAS-MEASUREMENTS.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.scenarios.at(-1)));
 }finally{p.destroy();await rpc.disconnect();}
});

