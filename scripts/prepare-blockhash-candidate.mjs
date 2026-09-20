// Unsigned, separate candidate plan. Does not change production configuration.
import fs from 'node:fs';
import {ContractFactory,JsonRpcProvider,keccak256,formatEther} from 'ethers';
import {catalog} from './shared.mjs';
const cfg=JSON.parse(fs.readFileSync('config/production.json','utf8'));
if(cfg.protocol==='blockhash-continuous-v1')throw Error('Blockhash deployment already configured; refusing duplicate preparation');
const art=JSON.parse(fs.readFileSync('artifacts/blockhash/BnbfishBlockhash.json','utf8'));
const {rules,hash}=JSON.parse(fs.readFileSync('artifacts/blockhash/rules.json','utf8'));
if(cfg.chainId!==56||!cfg.adminAddress||!cfg.imageBase)throw Error('Explicit mainnet settings required');
const tx=await new ContractFactory(art.abi,art.bytecode).getDeployTransaction(cfg.adminAddress,hash,cfg.imageBase,catalog);
const plan={stage:'candidate-not-deployed',chainId:56,admin:cfg.adminAddress,legacyContract:cfg.contract,rulesHash:hash,rules,imageBase:cfg.imageBase,initiallyPaused:true,data:tx.data,dataHash:keccak256(tx.data),runtimeTemplateHash:keccak256(art.runtimeBytecode),createdAt:new Date().toISOString(),releaseHold:['Website and operator must use the new ABI before activation','Legacy VRF requests retain independent on-chain status','A wallet signature is required for deployment; none has been sent']};
const p=new JsonRpcProvider(cfg.rpcUrl,undefined,{batchMaxCount:1});
try{
 const read=async()=>{if((await p.getNetwork()).chainId!==56n)throw Error('Wrong chain');const gas=await p.estimateGas({...tx,from:cfg.adminAddress});const fee=await p.getFeeData();return {estimatedGas:gas.toString(),gasPriceWei:fee.gasPrice?.toString(),estimatedCostBnb:fee.gasPrice?formatEther(gas*fee.gasPrice):null};};
 let timer;try{Object.assign(plan,await Promise.race([read(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('RPC estimate timed out')),15000);})]));}finally{clearTimeout(timer);}
}catch{plan.estimation='unavailable; re-estimate before signing';}finally{p.destroy();}
fs.writeFileSync('artifacts/blockhash/deployment-candidate.json',JSON.stringify(plan,null,2));
console.log(JSON.stringify({stage:plan.stage,dataHash:plan.dataHash,estimatedGas:plan.estimatedGas,estimatedCostBnb:plan.estimatedCostBnb,estimation:plan.estimation}));

fs.writeFileSync('web/blockhash-deployment-plan.json',JSON.stringify({...plan,disabled:false},null,2));
fs.writeFileSync('web/blockhash-integrity.js',`export const EXPECTED_DATA_HASH='${plan.dataHash}';\n`);
