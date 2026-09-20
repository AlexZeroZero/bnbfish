import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {JsonRpcProvider,Contract,formatEther} from 'ethers';
const base='https://bnbfish.trade', expected='0x60011EaC38503af422d0B9AFeC214a18aD99c11f';
const get=async path=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return r.text();};
const cfg=JSON.parse(await get('/api/config'));assert.equal(cfg.contract,expected);
assert.equal(JSON.parse(await get('/api/config?collection=previous')).contract,expected);
const html=await get('/');const match=html.match(/src="(app.bundle.js[^\"]*)" integrity="(sha384-[^\"]+)"/);assert.ok(match);
const bundle=await get('/'+match[1]);assert.equal('sha384-'+createHash('sha384').update(bundle).digest('base64'),match[2]);assert.equal(bundle,fs.readFileSync('web/app.bundle.js','utf8'));
assert.ok(!bundle.includes('href="/?collection=previous"'));assert.ok(!bundle.includes('首次参与鱼讯需等待 10'));
const docs=await get('/developers/nft/');assert.ok(docs.includes(expected));assert.ok(!docs.includes('真实主网返回示例'));
for(const page of ['activate','deploy','blockhash-activate','blockhash-deploy']){const r=await fetch(base+'/'+page+'.html',{signal:AbortSignal.timeout(30000)});const body=await r.text();assert.ok((r.redirected&&r.url===base+'/')||body.includes('此版本入口已关闭'),page);}
const status=JSON.parse(await get('/api/status')),automation=JSON.parse(await get('/api/automation'));
const provider=new JsonRpcProvider(cfg.rpcUrl,undefined,{batchMaxCount:1});const contract=new Contract(expected,['function paused() view returns(bool)','function startBlock() view returns(uint256)','function totalSupply() view returns(uint256)','function totalAllocated() view returns(uint256)'],provider);
const [paused,startBlock,supply,allocated,balance]=await Promise.all([contract.paused(),contract.startBlock(),contract.totalSupply(),contract.totalAllocated(),provider.getBalance('0x81C8CDDC75490541733d5eDE40210432c529Ad94')]);
const result={verifiedAt:new Date().toISOString(),contract:expected,websiteIntegrity:true,retiredSelectorRemoved:true,status,automation,chain:{paused,startBlock:String(startBlock),supply:String(supply),allocated:String(allocated),operatorBalanceBNB:formatEther(balance)}};
fs.writeFileSync('docs/CLAIM200-CLEANUP-RELEASE.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));provider.destroy();
