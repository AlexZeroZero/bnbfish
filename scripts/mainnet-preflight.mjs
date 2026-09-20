// Read-only BNB mainnet deployment/readiness report. Never loads signing keys.
import fs from 'node:fs';
import {JsonRpcProvider,FetchRequest,Contract,isAddress,ZeroAddress,parseEther} from 'ethers';
import {rulesHash,artifact,catalog,manifest} from './shared.mjs';
const c=JSON.parse(fs.readFileSync(process.env.Bnbfish_CONFIG||'config/production.json','utf8'));
const checks=[];const add=(name,ok,detail)=>checks.push({name,ok,detail});
const transport=new FetchRequest(process.env.BNB_RPC_URL||c.rpcUrl);transport.timeout=15000;
const provider=new JsonRpcProvider(transport);
const report={checkedAt:new Date().toISOString(),chainId:56,readOnly:true,rulesHash,contract:c.contract||null,checks};
try{
 add('deployment-hold',!c.deploymentHold,c.deploymentHold||'Release prepared');add('round-rules',manifest.version===4&&manifest.roundBlocks===10,'20% ticket disqualification; one prize per round; minimum ten blocks between mints');add('configured-chain',c.chainId===56,'Must use BNB Smart Chain 56');
 add('supply-rules',manifest.maxSupply===2000000&&manifest.emptyWeight===200000&&catalog.length===100&&manifest.species.reduce((sum,s)=>sum+s.maxSupply,0)===2000000,'100 species; cap 2000000; empty 20%; FIFO settlement');
 add('gas-only',c.baitFeeBnb==='0','Bait payment must be zero; network Gas only');
 for(const key of ['adminAddress','vrfCoordinator'])add(key,!!c[key]&&isAddress(c[key])&&c[key]!==ZeroAddress,c[key]||'Missing public address');
 add('vrf-key-hash',/^0x[0-9a-fA-F]{64}$/.test(c.vrfKeyHash||''),'Verify against Chainlink official BNB VRF v2.5 registry');
 add('vrf-subscription',/^[1-9][0-9]*$/.test(String(c.vrfSubscriptionId||'')),c.vrfSubscriptionId||'Missing funded subscription ID');
 add('vrf-confirmations',Number.isInteger(c.vrfConfirmations)&&c.vrfConfirmations>=3&&c.vrfConfirmations<=200,String(c.vrfConfirmations));
 add('nft-image-base',/^(https:\/\/|ipfs:\/\/)[^"\\\s]+\/$/.test(c.imageBase||''),c.imageBase||'Publish the 100 species images at a durable location');
 add('contract-size',artifact('Bnbfish').runtimeBytes<24576,artifact('Bnbfish').runtimeBytes+' bytes');
 try{const [network,height,block,gas]=await Promise.all([provider.getNetwork(),provider.getBlockNumber(),provider.getBlock('latest'),provider.getFeeData()]);report.latestBlock=height;report.blockTimestamp=block.timestamp;report.gasPriceWei=gas.gasPrice?.toString();add('live-chain',Number(network.chainId)===56,'RPC chain '+network.chainId);add('live-block',Date.now()/1000-block.timestamp<120,'Head age '+Math.round(Date.now()/1000-block.timestamp)+' seconds');
 if(c.adminAddress&&isAddress(c.adminAddress)){const balance=await provider.getBalance(c.adminAddress);report.adminBalanceWei=balance.toString();add('deployment-gas-balance',balance>0n,'Requires funded BNB deployment account; exact deployment estimate follows complete configuration');}
 if(c.vrfCoordinator&&isAddress(c.vrfCoordinator)){add('vrf-code',(await provider.getCode(c.vrfCoordinator))!=='0x','Coordinator must have on-chain code');if(c.vrfSubscriptionId){try{const vrf=new Contract(c.vrfCoordinator,['function getSubscription(uint256) view returns(uint96 balance,uint96 nativeBalance,uint64 reqCount,address owner,address[] consumers)'],provider);const sub=await vrf.getSubscription(c.vrfSubscriptionId);report.subscription={owner:sub.owner,linkBalance:sub.balance.toString(),nativeBalance:sub.nativeBalance.toString(),consumers:[...sub.consumers]};add('vrf-owner',sub.owner.toLowerCase()===c.adminAddress.toLowerCase(),sub.owner);add('vrf-funded',sub.nativeBalance>0n,'Current protocol requests native BNB payment; balance alone is not a per-cast sufficiency estimate');if(c.contract)add('vrf-consumer',sub.consumers.some(a=>a.toLowerCase()===c.contract.toLowerCase()),'Deployed NFT contract must be registered');}catch(e){add('vrf-subscription-read',false,e.shortMessage||e.message);}}}
 if(c.contract){const nft=new Contract(c.contract,artifact('Bnbfish').abi,provider);add('nft-code',(await provider.getCode(c.contract))!=='0x','Deployed bytecode');const [hash,fee,paused,owner]=await Promise.all([nft.rulesHash(),nft.baitFee(),nft.paused(),nft.owner()]);add('rules-match',hash===rulesHash,hash);add('onchain-gas-only',fee===0n,fee.toString());add('admin-match',owner.toLowerCase()===c.adminAddress?.toLowerCase(),owner);report.paused=paused;}
 }catch(e){add('rpc-read',false,e.shortMessage||e.message);}
 report.deploymentPrepared=checks.every(x=>x.ok);report.releaseStage=c.releaseStage||'unspecified';report.contractEnabled=!!c.contract&&report.paused===false;report.endToEndVerified=false;report.note='Read-only configuration report. HTTPS, image integrity and end-to-end VRF callback still require release verification. No transaction was broadcast.';
 fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/MAINNET-PREFLIGHT.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{provider.destroy();}
