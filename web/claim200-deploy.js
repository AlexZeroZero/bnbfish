import {BrowserProvider,keccak256,formatEther} from 'ethers';
import {verifyClaim200} from './claim200-check.js';
import {EXPECTED_DATA_HASH} from './claim200-integrity.js';
const $=s=>document.querySelector(s),msg=t=>$('#status').textContent=t;
let plan,p,signer,busy=false;const storageKey='bnbfish:claim200:deployment:'+EXPECTED_DATA_HASH;
async function guard(){
 const next=await(await fetch('/claim200-deployment-plan.json?check='+Date.now(),{cache:'no-store'})).json();
 if(next.disabled||next.dataHash!==EXPECTED_DATA_HASH||keccak256(next.data)!==EXPECTED_DATA_HASH)throw Error('部署计划已改变或关闭，请刷新');
 if(!p||BigInt(await p.send('eth_chainId',[]))!==56n)throw Error('请切换到 BNB 主网');
 const accounts=await p.send('eth_accounts',[]);if(accounts[0]?.toLowerCase()!==plan.admin.toLowerCase())throw Error('请连接页面列出的管理员地址');
}
async function quote(){await guard();const gas=await signer.estimateGas({data:plan.data,value:0}),fees=await p.getFeeData();if(!fees.gasPrice)throw Error('Gas 价格暂不可用');const gasLimit=gas*120n/100n;$('#cost').textContent=formatEther(gasLimit*fees.gasPrice)+' BNB（Gas 上限含 20% 余量，按实际扣费）';if(await p.getBalance(plan.admin)<gasLimit*fees.gasPrice)throw Error('部署地址余额不足');return{data:plan.data,value:0,gasLimit,gasPrice:fees.gasPrice};}
async function resume(hash){
 if(!/^0x[0-9a-f]{64}$/i.test(hash))throw Error('交易哈希格式不正确');
 const r=await p.getTransactionReceipt(hash);if(!r){msg('交易仍待确认，请勿重复部署：'+hash);return;}
 if(r.status!==1||!r.contractAddress)throw Error('不是成功的合约部署交易');
 const tx=await p.getTransaction(hash);if(!tx||tx.chainId!==56n||tx.value!==0n||tx.from.toLowerCase()!==plan.admin.toLowerCase()||keccak256(tx.data)!==EXPECTED_DATA_HASH)throw Error('部署交易与锁定的计划不一致');
 localStorage.setItem(storageKey,hash);$('#deploy').disabled=true;
 await verifyClaim200(p,r.contractAddress,plan.admin,{initial:true,onProgress:(a,b)=>msg(`正在核验 ${a}/${b} 个物种与额度…\n合约：${r.contractAddress}`)});
 msg('部署及初始核验完成，合约仍为暂停状态。\n合约：'+r.contractAddress+'\n交易：'+hash+'\n请将交易哈希发回当前任务，完成线上接入与公共验证服务核验后开启。');
}
async function connect(){if(!window.ethereum)throw Error('请用安装钱包扩展的浏览器，或钱包内置浏览器打开');p=new BrowserProvider(window.ethereum,undefined,{batchMaxCount:1});await p.send('eth_requestAccounts',[]);signer=await p.getSigner();await guard();}
try{plan=await(await fetch('/claim200-deployment-plan.json',{cache:'no-store'})).json();if(plan.disabled&&plan.contract){$('#admin').textContent=plan.admin;throw Error('已部署并核验：'+plan.contract+'。请使用下方开启入口，不要重复部署。');}if(plan.disabled||plan.chainId!==56||plan.dataHash!==EXPECTED_DATA_HASH||keccak256(plan.data)!==EXPECTED_DATA_HASH)throw Error('部署文件尚未开放或校验不符');$('#admin').textContent=plan.admin;$('#connect').disabled=false;msg('部署文件已核验。请连接管理员钱包，先查看实时 Gas 估算。');}catch(e){msg(e.message);}
$('#connect').onclick=async()=>{if(busy)return;busy=true;try{await connect();const hash=localStorage.getItem(storageKey);if(hash){await resume(hash);return;}await quote();$('#deploy').disabled=false;msg('可以部署。只有在钱包内确认后才会发送主网交易，部署不会自动开启游戏。');}catch(e){msg(e.shortMessage||e.message);}finally{busy=false;}};
$('#recover').onclick=async()=>{if(busy)return;busy=true;try{await connect();await resume($('#txhash').value.trim());}catch(e){msg(e.shortMessage||e.message);}finally{busy=false;}};
$('#deploy').onclick=async()=>{if(busy)return;busy=true;$('#deploy').disabled=true;let hash;try{if(localStorage.getItem(storageKey))throw Error('已有部署记录，请核验后继续，不要重复部署');const data=await quote();await guard();const tx=await signer.sendTransaction(data);hash=tx.hash;localStorage.setItem(storageKey,hash);msg('已提交，请勿重复部署：'+hash);await tx.wait(3);await resume(hash);}catch(e){msg((hash?'交易已提交：'+hash+'\n请勿重复部署。\n':'')+(e.shortMessage||e.message));}finally{busy=false;}};
