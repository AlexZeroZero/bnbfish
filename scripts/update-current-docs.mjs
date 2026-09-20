import fs from 'node:fs';
const current='0x60011EaC38503af422d0B9AFeC214a18aD99c11f';
for(const p of ['web/developers/nft/index.html','web/developers/nft/read-nft.mjs','web/developers/nft/catalog.json','web/copyright/index.html']){
 let s=fs.readFileSync(p,'utf8').replaceAll('0x84A26C7d59f600120653A41769CE08174e34642f',current).replaceAll('2026-09-15','2026-09-16');
 if(p.endsWith('nft/index.html'))s=s.replace(/<h3>真实主网返回示例[\s\S]*?<h3>可运行的 Node.js 示例<\/h3>/,'<h3>当前系列的领取与元数据</h3><p>每 200 个区块最多预留 50 份鱼获。未领取记录是合约中的鱼获权益，尚未铸造成钱包 NFT；只有玩家领取成功后才可读取对应 Token ID 的 tokenURI。总额度 200 万份包含已领取与未领取预留，totalAllocated() 表示已分配量，totalSupply() 表示已铸造量。</p><h3>可运行的 Node.js 示例</h3>').replace('固定发行上限为','已铸造与未领取预留的共同上限为').replace('例如先读取 NFT #18 的','例如先读取已领取 NFT 的').replace('当前名称格式为 <code>Bnbfish #18</code>','名称以 tokenURI 的实际返回值为准，例如 <code>Bnbfish #18</code>');
 fs.writeFileSync(p,s);
}
fs.writeFileSync('web/developers/nft/example-token-18.json',JSON.stringify({retired:true,message:'Previous collection snapshot removed. Read the current contract tokenURI for an already claimed token.',contract:current,chainId:56},null,2));
