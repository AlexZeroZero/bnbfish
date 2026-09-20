# NFT 钱包完整收藏卡

2026-09-15：将100个品种的独立鱼类图片更新为完整收藏卡。沿用已确认的水下背景、SVG鱼类美术和雕刻边框，保持原始鱼类比例。

- 900×1200 PNG，平均约421KB。
- 五档名称颜色：普通白、稀有蓝、珍稀紫、罕见粉、极其罕见橙金；边框对应银、蓝银、紫、玫瑰金、香槟金。
- 卡图包含品牌、鱼名、稀有度、物种编号、ERC-721标识及收藏娱乐说明。
- 每个物种共用卡图，不将某一枚NFT的编号、长度、重量或捕获时间写成所有同物种NFT共有的图片内容。个体属性继续读取链上元数据。

## 文件及重建

`scripts/prepare-card-fonts.py` 从现有字库导出中文矢量字形；`scripts/export-nft-cards.mjs` 将原有美术、背景和卡框组合成SVG后栅格化为PNG。依赖现有Python fontTools及桌面运行时sharp，sharp路径可用BNBFISH_SHARP环境变量覆盖。

原始素材位于 `web/assets/fish-catalog` 和 `web/assets/collectibles`，没有覆盖；游戏仍使用这些素材绘制卡片，避免将完整卡图再次嵌套进网页卡框。

输出位于 `release/nft-cards-v1`，manifest.json记录100个物种ID、名称、稀有度、尺寸、大小和SHA256。四张总览图位于 `artifacts/card-export`，已检查全部100张。正式图片仍使用 `/nft-images/{speciesId}.png`，无需部署或签名交易。

预览页：`https://bnbfish.trade/nft-card-gallery.html`。该页为图鉴预览，不代表访问者已持有这些NFT。

## 已有NFT的兼容性

例如NFT #1（细鳞鲑）引用1056.png，NFT #2（草鱼）引用1030.png。更换这些URL的图片内容后，链上tokenURI及所有权不变，现有和未来同物种NFT均引用完整卡图。独立的单枚NFT属性没有改变。

更新图片不会主动控制OKX等第三方钱包的缓存或索引。钱包可能需要刷新元数据或等待重新抓取；未确认OKX已显示前，不应宣称其显示问题已经修复。

本地原图备份：`release/nft-images-before-cards-v1`。服务器备份路径记录在NFT-CARDS-PUBLISHED.json。发布前核对全部100个ID、PNG尺寸、文件完整性和哈希，服务器发布时再次核对。只替换图片，不重启游戏或推进服务。

## 公网抓取发现

发布后，Mozilla/5.0请求可正常取得完整卡图；Python-urllib/3.13请求被Cloudflare边缘返回HTTP403、错误1010，响应显示没有到达源站。说明部分程序客户端仍被拦截，不能保证OKX图片索引立即成功。应在Cloudflare中针对公开 `/nft-images/` 路径检查事件与拦截规则，采取仅针对公开图片的例外，而不是关闭整站防护。本次未修改Cloudflare账户设置。
