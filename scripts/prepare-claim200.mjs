// Generates an UNSIGNED candidate only. Never changes live configuration.
import fs from 'node:fs';
import {ContractFactory,Contract,JsonRpcProvider,keccak256,getAddress,formatEther} from 'ethers';
import {catalog} from './shared.mjs';
const cfg=JSON.parse(fs.readFileSync('config/production.json'));
if(cfg.protocol==='claim200-reserved-v2'||fs.existsSync('artifacts/claim200/verified-deployment.json'))throw Error('Claim200 already deployed; use activation, never prepare a duplicate');
const art=JSON.parse(fs.readFileSync('artifacts/claim200/BnbfishClaim200.json'));
const definition=JSON.parse(fs.readFileSync('artifacts/claim200/rules.json'));
const recipient=getAddress('0x1bb935eeedd1338ebbb4faa79c1009314b8c520e');
const p=new JsonRpcProvider(cfg.rpcUrl,56,{staticNetwork:true,batchMaxCount:1});
try {
 if(BigInt(await p.send('eth_chainId',[]))!==56n)throw Error('Wrong chain');
 const admin=getAddress(await new Contract(cfg.contract,['function owner() view returns(address)'],p).owner());
 if(admin!==getAddress(cfg.adminAddress))throw Error('Configured admin differs from current owner');
 const tx=await new ContractFactory(art.abi,art.bytecode).getDeployTransaction(admin,recipient,definition.hash,cfg.imageBase,catalog);
 const gas=await p.estimateGas({...tx,from:admin}),fees=await p.getFeeData();
 const plan={stage:'unsigned-candidate-not-approved-for-release',disabled:true,chainId:56,admin,feeRecipient:recipient,protocolFeeWei:'10000000000000',independentTestCollection:true,previousCollection:cfg.contract,imageBase:cfg.imageBase,rulesHash:definition.hash,rules:definition.rules,initiallyPaused:true,data:tx.data,dataHash:keccak256(tx.data),runtimeTemplateHash:keccak256(art.runtimeBytecode),estimatedGas:gas.toString(),gasPriceWei:fees.gasPrice?.toString(),estimatedDeploymentCostBnb:fees.gasPrice?formatEther(gas*fees.gasPrice):null,createdAt:new Date().toISOString(),releaseHold:['Permanent reservations: settlement gas budget and execution service must be reviewed','Security and fee failure tests must pass','Compatible cast/claim/history UI required before activation','User wallet must sign deployment; never use operator key']};
 fs.writeFileSync('artifacts/claim200/deployment-candidate.json',JSON.stringify(plan,null,2));
 console.log(JSON.stringify({admin,feeRecipient:recipient,estimatedGas:plan.estimatedGas,estimatedDeploymentCostBnb:plan.estimatedDeploymentCostBnb,dataHash:plan.dataHash,stage:plan.stage}));
}finally{p.destroy();}
