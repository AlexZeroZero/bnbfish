import {BrowserProvider,formatEther,keccak256} from 'ethers';
import {EXPECTED_DATA_HASH} from './blockhash-integrity.js';
import {verifyBlockhash} from './blockhash-check.js';
const $=s=>document.querySelector(s),msg=s=>$('#status').textContent=s;
let plan,p,signer,busy=false;const storageKey='bnbfish-blockhash-deploy:'+EXPECTED_DATA_HASH;
async function guard(){
 const latest=await(await fetch('blockhash-deployment-plan.json?check='+Date.now(),{cache:'no-store'})).json();
 if(latest.disabled||latest.dataHash!==EXPECTED_DATA_HASH||keccak256(latest.data)!==EXPECTED_DATA_HASH)throw Error('部署计划已关闭或更改，请刷新');
 if(!p||Number(await window.ethereum.request({method:'eth_chainId'}))!==56)throw Error('请使用 BNB 主网钱包');
 const accounts=await window.ethereum.request({method:'eth_accounts'});if(accounts[0]?.toLowerCase()!==plan.admin.toLowerCase())throw Error('请连接指定管理员钱包');
}
async function resume(hash){
 msg('正在查询已提交的部署交易：'+hash);
 const r=await p.getTransactionReceipt(hash);if(!r){msg('部署交易仍在确认，请勿重复提交：'+hash);return;}
 if(r.status!==1||!r.contractAddress)throw Error('部署交易失败，请保留交易哈希供核查：'+hash);
 const tx=await p.getTransaction(hash);if(!tx||keccak256(tx.data)!==EXPECTED_DATA_HASH||tx.from.toLowerCase()!==plan.admin.toLowerCase())throw Error('部署交易内容不符');
 const result=await verifyBlockhash(p,r.contractAddress,plan.admin,{initial:true,onProgress:(done,total)=>msg('正在核验链上物种与配额 '+done+'/'+total+'\n新合约：'+r.contractAddress)});
 if(result.imageBase!==plan.imageBase)throw Error('图片地址不匹配');
 msg('部署及初始核验完成，合约仍为暂停状态。\n合约地址：'+r.contractAddress+'\n交易哈希：'+hash+'\n请把交易哈希发到当前任务，完成自动服务配置和旧版处理后再开启。');
}
async function quote(){await guard();const gas=await signer.estimateGas({data:plan.data,value:0}),fee=await p.getFeeData();if(!fee.gasPrice)throw Error('Gas价格读取失败');const gasLimit=gas*120n/100n,cost=gasLimit*fee.gasPrice;$('#cost').textContent=formatEther(cost)+' BNB（含20% Gas额度余量，按实际使用扣费）';if(await p.getBalance(plan.admin)<cost)throw Error('管理员BNB余额不足');return {data:plan.data,value:0,gasLimit,gasPrice:fee.gasPrice};}
try{plan=await(await fetch('blockhash-deployment-plan.json',{cache:'no-store'})).json();if(plan.disabled&&plan.contract)throw Error('新合约已部署：'+plan.contract+'。请使用下方“开启已部署的新版”继续，不要重复部署。');if(plan.disabled||plan.chainId!==56||keccak256(plan.data)!==EXPECTED_DATA_HASH||plan.dataHash!==EXPECTED_DATA_HASH)throw Error('部署计划校验失败或尚未开放');$('#admin').textContent=plan.admin;$('#connect').disabled=false;msg('先连接钱包核验；只有点击部署并在钱包确认后才会发送交易。');}catch(e){msg(e.message);}
$('#connect').onclick=async()=>{if(busy)return;busy=true;$('#deploy').disabled=true;try{if(!window.ethereum)throw Error('请在安装EVM钱包的浏览器打开');p=new BrowserProvider(window.ethereum,undefined,{batchMaxCount:1});await p.send('eth_requestAccounts',[]);signer=await p.getSigner();await guard();const saved=localStorage.getItem(storageKey);if(saved){await resume(saved);return;}await quote();$('#deploy').disabled=false;msg('已核验，可以部署。部署不会启用游戏，不会改变旧合约。');}catch(e){msg(e.shortMessage||e.message);}finally{busy=false;}};
$('#deploy').onclick=async()=>{if(busy)return;busy=true;$('#deploy').disabled=true;let hash;try{if(localStorage.getItem(storageKey))throw Error('已有提交记录，请使用连接按钮恢复核验');const txData=await quote();await guard();const tx=await signer.sendTransaction(txData);hash=tx.hash;localStorage.setItem(storageKey,hash);msg('已提交，请勿重复操作：'+hash);await tx.wait(3);await resume(hash);}catch(e){msg((hash?'已提交：'+hash+'\n请勿重复部署。\n':'')+(e.shortMessage||e.message));}finally{busy=false;}};
