# Bnbfish 协议 v4：十区块轮次与固定发行上限

历史文件名保留，内容取代 v3 逐竿抽奖协议。网络为 BNB Smart Chain 主网 chainId 56，ERC-721Enumerable，名称 Bnbfish BNB，符号 BNBFISH。NFT 仅作为收藏娱乐，不承诺经济价值。

## 1. 永久发行限制

|等级|最大数量|物种数|初始鱼种等级权重|
|---|---:|---:|---:|
|普通|1,200,000|33|60%|
|稀有|500,000|27|25%|
|珍稀|150,000|17|7.5%|
|罕见|100,000|11|5%|
|极其罕见|50,000|12|2.5%|

累计最多 2,000,000 枚、100 物种。每档额度均分到物种，余数按物种 ID 升序分配。不同水域共享同一物种库存。上述百分比是成功产生鱼获后选鱼的初始等级权重，绝不是某张抛竿机会最终中奖的概率。

合约无增发、管理员铸造、配额修改、销毁后重新发行或代理升级入口。累计发行由单调递增的 nextTokenId 限制，转账不改变任何物种发行计数。规则变更只能部署新合约，不能改变此合约内已固定的规则。

## 2. 十区块轮次

首次 setPaused(false) 时锁定 startBlock，以后暂停和恢复不重置。轮次 ID = floor((block.number - startBlock) / 10) + 1。第 r 轮允许参与的区块为 [startBlock+(r-1)*10, startBlock+r*10)，右端不包含。

每次 cast(water) 增加一张独立机会，同一地址可以重复参与；value 必须是 0，玩家支付自己交易的 Gas。每轮最多铸造一枚 NFT，另加全局 lastMintBlock 限制，相邻实际铸造至少相隔 10 个区块。无人参与的轮次不进入队列，不补发。

智能合约不能自行定时执行。轮次关闭后任何人可 requestRound(r)，支付交易 Gas 触发 VRF；订阅支付 VRF 费用。随机数回调后自动尝试结算，不保证恰好在第十区块产出；延迟回调、排队和铸造冷却均可能延后。

## 3. 空竿与中奖抽取

参与名单封盘后才允许向 Chainlink VRF v2.5 请求一个随机数；每轮最多请求一次，不允许取消、重抽或修改名单。确认数为部署配置，当前为 3。

每张机会先独立以 20% 概率判为空竿。其余机会中，当前水域仍有库存者参与等概率 reservoir sampling（蓄水池抽样），最终最多一张中奖。允许同一地址拥有多张机会。没有通过筛选的机会或未被抽中的机会均不获得 NFT。若 n 张机会的水域均有库存，则本轮有鱼概率为 1 - 0.2^n；每张机会获鱼概率为 (1 - 0.2^n) / n。多地址和重复抛竿不受身份限制。

随机派生函数为 keccak256(abi.encode(word, scope, rulesHash)) % bound。ticket ID 为 i 时，scope=100+2*i 用于空竿，scope=101+2*i 用于蓄水池替换（eligibleCount 为界）；scope 1/2/3/4 用于等级、物种、长度、品质。256 位取模有可忽略但非零的数学偏差，哈希派生以密码学随机预言机假设为基础。

中奖后，按有当前水域可用物种的各档全局剩余库存选择等级，再按该档当前水域各物种剩余库存选择物种。体重随体长三次方缩放，品质 6000–10000 bps。鼠标落点和动画不改变结果。

## 4. 有界结算与顺序

有参与者的轮次按时间进入 activeRounds，严格 FIFO 消耗库存，不能抢先结算后轮。状态 None=0、Waiting=1、RandomReady=2、Settled=3。

VRF 仅由固定 coordinator 回调；先保存随机数和 RandomReady，再以 1,100,000 Gas 的隔离自调用尝试处理最多 20 张机会。回调请求预算 1,500,000 Gas。预算不足或子调用失败会保留随机数，事件 AutoSettlementDeferred 表示需要补结算。每次 processQueue(limit) 最多处理 1–20 张机会，不遍历所有轮次；批次数量、调用人和时间不会改变中奖者。扫描完但铸造间隔不足时保留候选者，等待公开补结算。

每轮扫描完成后仅给赢家发 CatchSettled；全部机会的最终状态由所属轮次推导，不为所有输家循环写存储或逐一发事件。RoundSettled 记录 winnerTicket、tokenId、eligible。tokenId=0 表示该轮没有铸造。

## 5. 开发接口

- cast(uint8 water)：water=0/1/2，返回 ticketId。CastRequested 中历史字段 requestId 在 v4 代表 ticketId，不是 VRF 请求 ID。
- playerTicketCount(address)、playerTicketAt(address,index)：分页读取参与记录；ticketRound(ticketId) 关联轮次。
- casts(ticketId)：兼容视图，读取玩家、水域、区块和推导状态、中奖 tokenId。randomWord 字段不提供轮次熵，应读取 rounds。
- pendingRequest(address)：仅为最近一张未结束机会的便捷视图，不能用它表示全部待结算机会。
- currentRound()、roundEnd(roundId)、rounds(roundId)：轮次进度，processed/count 为扫描进度。
- requestRound(roundId)：封盘后唯一一次 VRF 请求，RoundRequested 关联 roundId 和 vrfRequestId。
- nextSettlementRound()、processQueue(limit)：公开推进 FIFO 队首。nextSettlementRequest 返回队首第一张 ticket ID；旧脚本需更新。
- settle(ticketId)：只有队首轮次的票可调用，等同于处理其最多 20 张机会。
- ticketEligible(ticketId)：随机数就绪后可核验 20% 筛选，不代表已经中奖。
- outcome(ticketId)：只接受已结束轮次，返回固定的鱼获结果；未中奖返回 false。
- fish(tokenId)、tokenURI、ownerOf、safeTransferFrom：鱼获、元数据及 ERC-721 转账。

前端和索引器必须区分链 ID、合约地址、ticket ID、round ID 与 VRF ID。按日志定位去重、处理重组；动画和缓存不能铸造 NFT。tokenURI 为链上 Base64 JSON，图片在 imageBase+speciesId+'.png'，图片 URI 固定不等于图片内容永久链上保存。

## 6. 权限、安全边界和运维

管理员保留暂停新参与和两步移交所有权的能力，不能指定赢家、重抽、改库存或升级实现。暂停不阻止已有轮次请求 VRF、结算和转账。不要在首次启用前放弃所有权，否则无法启动。VRF coordinator 为外部依赖，订阅所有者可停止资助或移除 Consumer，这会影响可用性但不赋予改写随机结果的权限。

FIFO 早期轮次若一直未得到随机数会阻塞后续，当前没有管理员跳过入口；需要持续资助订阅。免费重复参与可能消耗存储和 VRF 补贴，不能声称防机器人。NFT 使用 _mint 给原中奖者，避免接收回调阻塞队列；智能合约账户须自行具备转出 NFT 的能力。

scripts/keeper.mjs 是可选公开调用工具，可发起封盘请求和补结算，不能改变抽奖结果；默认未配置签名密钥、未部署付费 keeper。玩家也可在网页“垂钓机会”中主动推进，钱包逐笔确认 Gas。无需 Automation/CRE。

## 7. 部署核验

先构建并测试；管理员钱包部署，默认暂停。scripts/verify-deployment.mjs <交易哈希> 验证链 56、创建输入哈希、代码与 immutable 参数、所有者、VRF 参数、配额、十区块规则、零费用和暂停状态。artifacts/verification-input.json 用于区块浏览器标准 JSON 源码验证，编译器版本见 Bnbfish artifact。

部署后需注册 VRF Consumer，核验资金，然后启动、完成真实 VRF 轮次和 NFT 转账验收。本地 MockVRF、静态检查或源码验证均不能代表独立安全审计，不能保证绝对无漏洞。
