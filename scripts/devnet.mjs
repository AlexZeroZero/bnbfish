// Explicit local development only. Keys are ephemeral and never returned by the web API.
import ganache from 'ganache';import fs from 'node:fs';import {ContractFactory,JsonRpcProvider,Wallet,parseEther,ZeroHash,NonceManager} from 'ethers';import {artifact,catalog,rulesHash} from './shared.mjs';
const server=ganache.server({chain:{chainId:1337},wallet:{totalAccounts:3},logging:{quiet:true}});await server.listen(8547,'127.0.0.1');
const accounts=Object.values(server.provider.getInitialAccounts());const provider=new JsonRpcProvider('http://127.0.0.1:8547',1337);const admin=new NonceManager(new Wallet(accounts[0].secretKey,provider));
const mock=await new ContractFactory(artifact('MockVRF').abi,artifact('MockVRF').bytecode,admin).deploy();await mock.waitForDeployment();
const nft=await new ContractFactory(artifact('Bnbfish').abi,artifact('Bnbfish').bytecode,admin).deploy(await admin.getAddress(),await mock.getAddress(),ZeroHash,1,3,rulesHash,'http://127.0.0.1:4188/nft-images/',catalog);await nft.waitForDeployment();await (await nft.setPaused(false)).wait();
const receipt=await nft.deploymentTransaction().wait();fs.writeFileSync('config/local.json',JSON.stringify({chainId:1337,name:'LOCAL DEVNET — 非主网',rpcUrl:'http://127.0.0.1:8547',explorer:'',contract:await nft.getAddress(),deploymentBlock:receipt.blockNumber,baitFeeBnb:'0',rulesHash,local:true},null,2));
process.env.Bnbfish_CONFIG='config/local.json';process.env.PORT='4188';
await import('../service/server.mjs');
// This is a deliberate mock oracle, enabled only by this local process.
let checking=false;setInterval(async()=>{if(checking)return;checking=true;try{await server.provider.request({method:'evm_mine',params:[]});const id=await nft.nextSettlementRound();if(id===0n)return;const r=await nft.rounds(id);if(r.requestId===0n){if(BigInt(await provider.getBlockNumber())>=await nft.roundEnd(id))await(await nft.requestRound(id)).wait();}else if(r.state===1n)await(await mock.fulfill(r.requestId,BigInt('0x'+(await import('node:crypto')).randomBytes(32).toString('hex')),{gasLimit:1700000})).wait();else if(r.state===2n)await(await nft.processQueue(20)).wait();}catch(e){console.error('Local settlement:',e.shortMessage||e.message);}finally{checking=false;}},2000);
console.log('Local contract deployed; mock randomness, no BNB mainnet funds. Web: http://127.0.0.1:4188');
