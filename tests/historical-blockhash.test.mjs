import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ganache from 'ganache';import {BrowserProvider,ContractFactory,toBeHex,zeroPadValue,toQuantity} from 'ethers';import {catalog} from '../scripts/shared.mjs';import {buildAncestorProof} from '../scripts/historical-header-proof.mjs';
const art=JSON.parse(fs.readFileSync('artifacts/claim200/BnbfishClaim200.json')),rules=JSON.parse(fs.readFileSync('artifacts/claim200/rules.json')),probe=JSON.parse(fs.readFileSync('docs/HISTORY-HASH-BOUNDARY-PROBE.json'));
test('BNB history bytecode and canonical parent proofs recover an expired window without redraw or operator',async()=>{
 const rpc=ganache.provider({chain:{chainId:1337},miner:{blockGasLimit:40000000},logging:{quiet:true}}),p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;const gas={};
 try{const a=await p.getSigner(0),b=await p.getSigner(1),n=await new ContractFactory(art.abi,art.bytecode,a).deploy(await a.getAddress(),await b.getAddress(),rules.hash,'https://bnbfish.trade/nft-images/',catalog);await n.waitForDeployment();await(await n.setPaused(false)).wait();await(await n.cast(0,{value:10000000000000n})).wait();const target=Number(await n.targetBlock(1));
 const mine=async height=>{while(Number(await rpc.request({method:'eth_blockNumber',params:[]}))<height)await rpc.request({method:'evm_mine',params:[]});};
 await mine(target+300);const targetBlock=await p.send('eth_getBlockByNumber',[toQuantity(target),false]);
 assert.equal(await n.historicalHash(target),'0x'+'0'.repeat(64));
 await rpc.request({method:'evm_setAccountCode',params:[probe.address,probe.code]});
 const store=async height=>{const block=await p.send('eth_getBlockByNumber',[toQuantity(height),false]);await rpc.request({method:'evm_setAccountStorageAt',params:[probe.address,zeroPadValue(toBeHex(height%8191),32),block.hash]});return block.hash;};
 await store(target);assert.equal(await n.historicalHash(target),targetBlock.hash);
 const snap=await rpc.request({method:'evm_snapshot',params:[]});gas.historySave=Number((await(await n.captureHash(1)).wait()).gasUsed);assert.equal(await n.savedHashes(1),targetBlock.hash);await rpc.request({method:'evm_revert',params:[snap]});
 await mine(target+8300);await assert.rejects(()=>n.captureHash(1));assert.equal((await n.entryOutcome(1)).outcome,5n);assert.equal(await n.totalSupply(),0n);
 // New participation remains possible while the old round needs a proof.
 await(await n.connect(b).cast(1,{value:10000000000000n})).wait();
 let anchor=target+128;await store(anchor);const proof=await buildAncestorProof(p,anchor,32);
 await assert.rejects(()=>n.proveAncestors(anchor,[]));await assert.rejects(()=>n.proveAncestors(anchor,Array(33).fill(proof.headers[0])));
 await assert.rejects(()=>n.proveAncestors(anchor,[proof.headers[0].slice(0,-2)+'ff']));await assert.rejects(()=>n.proveAncestors(anchor,[proof.headers[1],proof.headers[0]]));await assert.rejects(()=>n.proveAncestors(anchor+1,proof.headers));
 gas.proofBatches=[];
 while(anchor>target){const batch=await buildAncestorProof(p,anchor,Math.min(32,anchor-target));const receipt=await(await n.connect(b).proveAncestors(anchor,batch.headers)).wait();gas.proofBatches.push(Number(receipt.gasUsed));anchor=batch.provenHeight;assert.equal(await n.verifiedBlockHashes(anchor),batch.provenHash);}
 assert.equal(await n.historicalHash(target),targetBlock.hash);
 await(await n.settleRound(1)).wait();assert.equal((await n.entryOutcome(1)).outcome,2n);await(await n.claim(1)).wait();assert.equal(await n.ownerOf(1),await a.getAddress());await assert.rejects(()=>n.claim(1));assert.equal(await n.savedHashes(1),targetBlock.hash);
 gas.label='Local test only: BNB system bytecode installed and ring slots seeded by test harness; no mainnet transactions';gas.headersRecovered=128;gas.gasPriceGweiAssumption=0.05;fs.writeFileSync('docs/HISTORICAL-HASH-TEST-GAS.json',JSON.stringify(gas,null,2));console.log(JSON.stringify(gas));
 }finally{p.destroy();await rpc.disconnect();}
});
