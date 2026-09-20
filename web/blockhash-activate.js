import {BrowserProvider,Contract,formatEther,keccak256} from 'ethers';
import {ACTIVATION as c} from './blockhash-activation-config.js';
const abi=['function paused() view returns(bool)','function owner() view returns(address)','function rulesHash() view returns(bytes32)','function setPaused(bool)','function startBlock() view returns(uint256)'];
const $=s=>document.querySelector(s),msg=s=>$('#status').textContent=s;let p,signer,busy=false;
$('#contract').textContent=c.contract;$('#admin').textContent=c.admin;
async function walletGuard(){if(!p||Number(await window.ethereum.request({method:'eth_chainId'}))!==56)throw Error('请切换到 BNB 主网');const a=await window.ethereum.request({method:'eth_accounts'});if(a[0]?.toLowerCase()!==c.admin.toLowerCase())throw Error('请连接指定管理员钱包');}
async function guard(){
 await walletGuard();
 const current=await(await fetch('/api/config',{cache:'no-store'})).json();if(current.contract!==c.contract||current.protocol!=='blockhash-continuous-v1'||current.rulesHash!==c.rulesHash)throw Error('网站尚未配置此合约');
 const n=new Contract(c.contract,abi,signer),old=new Contract(c.legacy,abi,signer);
 const [code,oldCode,owner,oldOwner,rule,oldRule]=await Promise.all([p.getCode(c.contract),p.getCode(c.legacy),n.owner(),old.owner(),n.rulesHash(),old.rulesHash()]);
 if(keccak256(code)!==c.runtimeCodeHash||keccak256(oldCode)!==c.legacyCodeHash||owner.toLowerCase()!==c.admin.toLowerCase()||oldOwner.toLowerCase()!==c.admin.toLowerCase()||rule!==c.rulesHash||oldRule!==c.legacyRulesHash)throw Error('代码、管理员或规则不匹配');
 return {n,old};
}
async function outstanding(action){const key='bnbfish-switch:'+c.contract+':'+action,hash=localStorage.getItem(key);if(!hash)return;const r=await p.getTransactionReceipt(hash);if(!r)throw Error('此操作已有交易等待确认，请勿重复提交：'+hash);if(r.status===0)localStorage.removeItem(key);}
async function operatorReady(){const d=await(await fetch('/api/automation',{cache:'no-store'})).json(),balance=await p.getBalance(c.operator);$('#automation').textContent=d.ready&&d.contract===c.contract?'已配置并运行':'尚未就绪';$('#balance').textContent=formatEther(balance)+' BNB';if(!d.ready||d.contract!==c.contract||balance<c.minOperatorBalance)throw Error('自动推进服务或运营余额尚未就绪');}
async function estimate(n,value,element){const gas=(await n.setPaused.estimateGas(value))*120n/100n,fee=await p.getFeeData();if(!fee.gasPrice)throw Error('Gas价格读取失败');$(element).textContent='约 '+formatEther(gas*fee.gasPrice)+' BNB';return gas;}
async function refresh(){
 $('#pause-old').disabled=true;$('#enable-new').disabled=true;
 const {n,old}=await guard();const [op,np]=await Promise.all([old.paused(),n.paused()]);try{await operatorReady();}catch(e){$('#automation').textContent=e.message;}
 $('#pause-old').textContent=op?'旧版已停止新增抛竿':'暂停旧版新抛竿';$('#enable-new').textContent=np?'开启新版主网测试':'新版已开启';
 if(!op){await outstanding('pause');await estimate(old,true,'#old-cost');$('#pause-old').disabled=false;msg('请先暂停旧版的新抛竿，再开启新版。');return;}
 if(!np){msg('新版已开启。起始区块：'+await n.startBlock()+'。可以返回游戏，不需要重复操作。');return;}
 await operatorReady();await outstanding('enable');await estimate(n,false,'#new-cost');$('#enable-new').disabled=false;msg('旧版已暂停，新服务已就绪。请在钱包确认开启新版。');
}
$('#connect').onclick=async()=>{if(busy)return;busy=true;try{if(!window.ethereum)throw Error('请在装有EVM钱包的浏览器打开');p=new BrowserProvider(window.ethereum,undefined,{batchMaxCount:1,cacheTimeout:-1});await p.send('eth_requestAccounts',[]);signer=await p.getSigner();await refresh();}catch(e){msg(e.shortMessage||e.message);}finally{busy=false;}};
async function submit(action){if(busy)return;busy=true;$('#pause-old').disabled=true;$('#enable-new').disabled=true;let hash;try{
 const {n,old}=await guard();await outstanding(action);
 if(action==='enable'){if(!await old.paused())throw Error('请先暂停旧版');if(!await n.paused())return await refresh();await operatorReady();}else if(await old.paused())return await refresh();
 const target=action==='enable'?n:old,value=action!=='enable',gas=await estimate(target,value,action==='enable'?'#new-cost':'#old-cost');await walletGuard();
 const tx=await target.setPaused(value,{gasLimit:gas});hash=tx.hash;localStorage.setItem('bnbfish-switch:'+c.contract+':'+action,hash);msg('已提交，等待确认：'+hash);const r=await tx.wait(3);if(r.status!==1)throw Error('交易未成功');await refresh();
}catch(e){msg((hash?'已广播：'+hash+'\n请勿重复提交。\n':'')+(e.shortMessage||e.message));}finally{busy=false;}}
$('#pause-old').onclick=()=>submit('pause');$('#enable-new').onclick=()=>submit('enable');
