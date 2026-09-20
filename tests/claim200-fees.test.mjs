import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ganache from 'ganache';import solc from 'solc';import {BrowserProvider,ContractFactory} from 'ethers';import {catalog} from '../scripts/shared.mjs';
const art=JSON.parse(fs.readFileSync('artifacts/claim200/BnbfishClaim200.json')),rules=JSON.parse(fs.readFileSync('artifacts/claim200/rules.json')),fee=10000000000000n;
test('Rejecting recipient cannot stop casts; retained fees go only to fixed recipient; reentry is blocked',async()=>{
 const source='pragma solidity ^0.8.24; contract Recipient { bool public reject=true; address public target; bool public reentered; function configure(address t,bool r) external {target=t;reject=r;} receive() external payable {require(!reject);(bool ok,)=target.call(abi.encodeWithSignature("forwardFees()"));reentered=ok;} }';
 const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'R.sol':{content:source}},settings:{evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));const ra=out.contracts['R.sol'].Recipient;
 const rpc=ganache.provider({chain:{chainId:1337},miner:{blockGasLimit:40000000},logging:{quiet:true}}),p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});p.pollingInterval=10;
 try{
  const a=await p.getSigner(0),b=await p.getSigner(1),r=await new ContractFactory(ra.abi,'0x'+ra.evm.bytecode.object,a).deploy();await r.waitForDeployment();
  const n=await new ContractFactory(art.abi,art.bytecode,a).deploy(await a.getAddress(),await r.getAddress(),rules.hash,'https://bnbfish.trade/nft-images/',catalog);await n.waitForDeployment();await(await n.setPaused(false)).wait();
  await(await n.cast(0,{value:fee})).wait();assert.equal(await n.issuedCasts(),1n);assert.equal(await n.protocolFeesCollected(),fee);assert.equal(await n.protocolFeesForwarded(),0n);assert.equal(await p.getBalance(await n.getAddress()),fee);
  await assert.rejects(()=>n.connect(b).forwardFees());assert.equal(await n.protocolFeesForwarded(),0n);
  await(await r.configure(await n.getAddress(),false)).wait();await(await n.connect(b).forwardFees({gasLimit:200000})).wait();assert.equal(await n.protocolFeesForwarded(),fee);assert.equal(await p.getBalance(await r.getAddress()),fee);assert.equal(await p.getBalance(await n.getAddress()),0n);assert.equal(await r.reentered(),false);
  await(await n.connect(b).forwardFees()).wait();assert.equal(await p.getBalance(await r.getAddress()),fee);
  await assert.rejects(()=>n.connect(b).setPaused(true));
 }finally{p.destroy();await rpc.disconnect();}
});
