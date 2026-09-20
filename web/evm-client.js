import {claim200Abi,installClaim200Client} from './claim200-client.js';
import {MAINNET,validateConfig,sameTransaction} from './transaction-security.js';
import {currentAbi} from './current-abi.js';
import {continuousMethods} from './continuous-client.js';
import {BrowserProvider,JsonRpcProvider,Contract,formatEther,parseEther,getAddress,keccak256} from 'ethers';
export async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Error(d.error||'服务暂不可用');return d;}
export class EvmClient {
 async init(){this.scope='';if(typeof location!=='undefined'){const url=new URL(location.href);if(url.searchParams.has('collection')){url.searchParams.delete('collection');history.replaceState(null,'',url);}}this.config=await api('/api/config'+this.scope);validateConfig(this.config);this.abi=this.config.protocol==='claim200-reserved-v2'?claim200Abi:this.config.chainId===56?currentAbi:(await api('/api/contract-abi'+this.scope)).abi;this.reader=new JsonRpcProvider(this.config.rpcUrl,undefined,{batchMaxCount:1,cacheTimeout:-1});if(this.config.contract)this.contract=new Contract(this.config.contract,this.abi,this.reader);}
 async connect(injected=window.ethereum){if(!injected)throw Error('请在 MetaMask / Trust Wallet 的浏览器中打开，或安装浏览器钱包扩展。');this.injected=injected;this.wallet=new BrowserProvider(injected);await this.wallet.send('eth_requestAccounts',[]);if(Number(await this.wallet.send('eth_chainId',[]))!==this.config.chainId){await injected.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x'+this.config.chainId.toString(16)}]});this.wallet=new BrowserProvider(injected);}this.signer=await this.wallet.getSigner();this.address=await this.signer.getAddress();return this.address;}
 async guard(){validateConfig(this.config);if(!this.contract)throw Error('BNB 合约尚未部署，真实交易暂未开放');if(!this.signer)throw Error('请连接钱包');if(Number(await this.injected.request({method:'eth_chainId'}))!==this.config.chainId)throw Error('钱包网络已改变，请重新连接 BNB Chain');const addresses=await this.injected.request({method:'eth_accounts'});if(!addresses.length||getAddress(addresses[0])!==this.address)throw Error('钱包账户已改变，请重新连接');if(this.config.chainId===56){const [readCode,walletCode]=await Promise.all([this.reader.getCode(MAINNET.contract),this.injected.request({method:'eth_getCode',params:[MAINNET.contract,'latest']})]);if(keccak256(readCode)!==MAINNET.runtimeCodeHash||keccak256(walletCode)!==MAINNET.runtimeCodeHash)throw Error('合约代码核验失败，已阻止交易');}if(await this.contract.rulesHash()!==this.config.rulesHash)throw Error('合约物种规则与本客户端不匹配');}
 async prepareCast(water,onWait){await this.guard();await this.waitMembership(onWait);if(!Number.isInteger(water)||water<0||water>2)throw Error('无效水域');const address=this.address;const fee=await this.contract.baitFee();if(fee!==0n||parseEther(this.config.baitFeeBnb)!==0n)throw Error('本游戏仅允许零饵料费');const gas=await this.contract.connect(this.signer).cast.estimateGas(water,{value:0});return {water,gas,gasCost:await this.gasCost(gas),address};}
 async gasCost(gas){const fees=await this.reader.getFeeData();const price=fees.maxFeePerGas??fees.gasPrice;if(price==null)throw Error('无法估算 Gas 价格');return gas*price;}
 async sendCast(q,onWait){await this.guard();await this.waitMembership(onWait);await this.guard();if(this.address!==q.address)throw Error('账户已改变');return this.contract.connect(this.signer).cast(q.water,{value:0});}
 async holdings(){await this.guard();const address=this.address,total=Number(await this.contract.balanceOf(address));if(total>2000)throw Error('当前收藏超过 2000 枚，请使用区块浏览器查看完整持仓');const result=[];
  // Bounded batches; ownership is read from ERC-721, never inferred from a local list.
  for(let offset=0;offset<total;offset+=8){const rows=await Promise.all(Array.from({length:Math.min(8,total-offset)},async(_,i)=>{const id=await this.contract.tokenOfOwnerByIndex(address,offset+i),f=await this.contract.fish(id);return {id:id.toString(),speciesId:Number(f.speciesId),tier:Number(f.tier),water:Number(f.water),lengthMm:Number(f.lengthMm),massGrams:Number(f.massGrams),qualityBps:Number(f.qualityBps),caughtAt:Number(f.caughtAt),castBlock:Number(f.castBlock),requestId:f.requestId.toString()};}));result.push(...rows);}
  return result.sort((a,b)=>b.castBlock-a.castBlock||(BigInt(a.id)>BigInt(b.id)?-1:1));
 }
 async nftActivity(before=null,onProgress=()=>{}){
  if(!this.contract||!this.address)throw Error('请先连接钱包并配置 NFT 合约');
  if(!Number.isSafeInteger(this.config.deploymentBlock)||this.config.deploymentBlock<0)throw Error('缺少合约部署区块，无法确定历史范围');
  const address=this.address,head=Number(await this.reader.send("eth_blockNumber",[])),toBlock=before==null?head:Math.min(before,head);
  let fromBlock=toBlock+1;const events=[];
  // Dedicated log node: the default BNB endpoint limits eth_getLogs heavily.
  if(!this.logReader)this.logReader=this.config.chainId===56?new JsonRpcProvider('https://bsc-rpc.publicnode.com',undefined,{batchMaxCount:1}):this.reader;
  if(Number((await this.logReader.getNetwork()).chainId)!==this.config.chainId)throw Error('日志节点网络不匹配');
  const logContract=new Contract(this.config.contract,this.abi,this.logReader);
  const fallbackReader=this.reader;
  async function query(filter,start,end){try{return await logContract.queryFilter(filter,start,end);}catch(e){if(end-start>499){const mid=Math.floor((start+end)/2);return [...await query(filter,start,mid),...await query(filter,mid+1,end)];}return await logContract.connect(fallbackReader).queryFilter(filter,start,end);}}
  const read=query.bind(this);
  // Search backwards until real events are found; empty recent blocks are not an empty wallet.
  for(let end=toBlock;end>=this.config.deploymentBlock;){
   const start=Math.max(this.config.deploymentBlock,end-9999);
   const received=await read(logContract.filters.Transfer(null,address),start,end);
   const sent=await read(logContract.filters.Transfer(address,null),start,end);
   events.push(...received,...sent);fromBlock=start;onProgress({fromBlock,toBlock});
   if(events.length||toBlock-start>=199999)break;end=start-1;
  }
  if(toBlock<this.config.deploymentBlock)return {rows:[],fromBlock:this.config.deploymentBlock,toBlock,more:false};
  const unique=[...new Map(events.map(e=>[e.transactionHash+':'+e.index,e])).values()],rows=[],blocks=new Map(),fish=new Map();
  for(let offset=0;offset<unique.length;offset+=6){rows.push(...await Promise.all(unique.slice(offset,offset+6).map(async e=>{if(!blocks.has(e.blockNumber))blocks.set(e.blockNumber,this.reader.getBlock(e.blockNumber));const id=e.args.tokenId.toString();if(!fish.has(id))fish.set(id,this.contract.fish(id));const [block,f]=await Promise.all([blocks.get(e.blockNumber),fish.get(id)]);return {id,from:e.args.from,to:e.args.to,kind:e.args.from==='0x0000000000000000000000000000000000000000'?'mint':e.args.to.toLowerCase()===address.toLowerCase()?'in':'out',at:block.timestamp,block:e.blockNumber,hash:e.transactionHash,index:e.index,speciesId:Number(f.speciesId),requestId:f.requestId.toString(),lengthMm:Number(f.lengthMm),massGrams:Number(f.massGrams)};})));}
  return {rows:rows.sort((a,b)=>b.block-a.block||b.index-a.index),fromBlock,toBlock,more:fromBlock>this.config.deploymentBlock};
 }
 async prepareTransfer(id,recipient){await this.guard();const to=getAddress(recipient);if(to===this.address)throw Error('收款地址不能是当前账户');if(await this.contract.ownerOf(id)!==this.address)throw Error('当前地址不持有该 NFT');const gas=await this.contract.connect(this.signer)['safeTransferFrom(address,address,uint256)'].estimateGas(this.address,to,id);return {id,to,from:this.address,gasCost:await this.gasCost(gas)};}
 async transfer(q){await this.guard();if(q.from!==this.address)throw Error('账户已改变');return this.contract.connect(this.signer)['safeTransferFrom(address,address,uint256)'](q.from,q.to,q.id);}
 async preparePayment(to,amount){await this.guard();to=getAddress(to);const value=parseEther(amount);if(value<=0n)throw Error('金额必须大于 0');const gas=await this.signer.estimateGas({to,value});return {to,value,from:this.address,gasCost:await this.gasCost(gas)};}
 async pay(q){await this.guard();if(q.from!==this.address)throw Error('账户已改变');return this.signer.sendTransaction({to:q.to,value:q.value});}
}
Object.defineProperties(EvmClient.prototype,Object.getOwnPropertyDescriptors(continuousMethods));
installClaim200Client(EvmClient);
export async function receipt(tx){try{return await tx.wait(1);}catch(e){if(e.code==='TRANSACTION_REPLACED'&&!e.cancelled&&e.receipt?.status===1&&sameTransaction(tx,e.replacement))return e.receipt;throw e;}}
export {formatEther,parseEther};
