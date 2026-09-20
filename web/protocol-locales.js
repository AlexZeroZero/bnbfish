export const protocolTranslations=[
  [
    "在 BNB 主网上持续垂钓，收藏可验证、可转移的鱼获 NFT。每条鱼获对应一份独立的 ERC-721 NFT。",
    {
      "en": "Fish continuously on BNB mainnet and collect verifiable, transferable catches. Each catch is a separate ERC-721 NFT.",
      "ru": "Ловите в основной сети BNB и собирайте проверяемые, передаваемые NFT. Каждый улов — отдельный NFT ERC-721.",
      "ja": "BNB メインネットで釣りを続け、検証・移転可能な釣果を集めます。各釣果は独立した ERC-721 NFT です。"
    }
  ],
  [
    "每次成功抛竿，合约记录你的地址、水域和抛竿区块，形成一支独立鱼竿。首次参与鱼讯需等待 10～19 个区块，之后持续参与，直到获得一份鱼获 NFT 或主动收竿。",
    {
      "en": "Each successful cast records your address, water and block as an independent rod. Eligibility starts after 10–19 blocks and continues until a catch or withdrawal.",
      "ru": "Успешный заброс записывает адрес, водоём и блок как отдельную удочку. Участие начинается через 10–19 блоков и продолжается до улова или снятия удочки.",
      "ja": "投入が成功すると、アドレス・釣り場・ブロックが独立した竿として記録されます。10～19 ブロック後から釣果獲得または竿の収納まで参加します。"
    }
  ],
  [
    "合约按固定的每 10 个区块设置鱼讯节点。目标区块产生并经过至少 3 个后续区块后，才能处理该次鱼讯。有符合条件的鱼竿且水域仍有库存时，每个成功处理的节点最多分配一份 NFT；相邻实际铸造至少间隔 10 个区块。区块间隔不等于固定秒数。",
    {
      "en": "Fishing targets occur every 10 blocks. Processing requires at least 3 blocks after the target. With eligible rods and stock, each processed target awards at most one NFT. Actual mints are at least 10 blocks apart. Blocks do not correspond to a fixed number of seconds.",
      "ru": "Цели задаются каждые 10 блоков. Обработка возможна минимум через 3 блока после цели. При наличии подходящих удочек и запасов одна обработанная цель выдаёт не более одного NFT. Между выпусками минимум 10 блоков. Это не фиксированное число секунд.",
      "ja": "判定目標は 10 ブロックごとに設定され、目標の後に少なくとも 3 ブロックが必要です。対象の竿と在庫があれば、処理された目標ごとに最大 1 点を発行します。実際の発行間隔は最低 10 ブロックです。秒数は固定ではありません。"
    }
  ],
  [
    "没获得鱼获的鱼竿继续垂钓，无需再次抛竿或重复签名。多支鱼竿各自独立参与。",
    {
      "en": "Rods without a catch remain active. No new cast or signature is needed. Multiple rods participate independently.",
      "ru": "Удочки без улова остаются активны. Повторный заброс или подпись не нужны. Каждая удочка участвует независимо.",
      "ja": "釣れなかった竿は継続し、再投入や再署名は不要です。複数の竿はそれぞれ独立して参加します。"
    }
  ],
  [
    "先从全部符合条件的鱼竿中等权抽取一支，再从这支鱼竿所在水域抽取鱼种。符合条件指：仍在垂钓、已达到首次参与区块，且所在水域还有库存。",
    {
      "en": "One rod is selected with equal weight from all eligible rods, then a species is selected in its water. Eligible means active, past the initial waiting block, and in a water with stock.",
      "ru": "Одна удочка выбирается равновероятно среди подходящих, затем выбирается вид в её водоёме. Удочка должна быть активна, пройти начальное ожидание и находиться в водоёме с запасами.",
      "ja": "条件を満たす全竿から等確率で 1 本を選び、その釣り場から種類を選びます。条件は継続中・初回待機ブロック到達済み・釣り場に在庫があることです。"
    }
  ],
  [
    "例如，同一次鱼讯有 100 支符合条件的鱼竿，你有其中 3 支，那么本次获得鱼获的机会约为 3%。人数、鱼竿数量和剩余库存会变化，因此不存在每次抛竿固定的获得概率，也不保证在指定时间内钓到鱼。",
    {
      "en": "For example, owning 3 of 100 eligible rods gives approximately a 3% chance for that event. Participation and stock change, so there is no fixed chance per cast or guaranteed time to catch.",
      "ru": "Например, 3 из 100 подходящих удочек дают около 3% на это событие. Участие и запасы меняются; нет фиксированного шанса на заброс или гарантированного срока улова.",
      "ja": "対象の 100 本中 3 本を持つ場合、その判定での獲得確率は約 3% です。参加数や在庫は変動するため、投入ごとの固定確率や獲得期限の保証はありません。"
    }
  ],
  [
    "同一等级的额度尽量平均分给该等级的各个品种；不能整除的余数，按物种编号从小到大各增加一份。每个品种都有固定上限，跨水域共享同一库存，不会在不同水域重复计算额度。",
    {
      "en": "Each tier's quota is split as evenly as possible across its species. Remainders add one unit in ascending species-ID order. Every species has a fixed cap and shares its stock across waters; quotas are not counted again in another water.",
      "ru": "Квота уровня распределена между видами максимально поровну. Остаток добавляет по единице в порядке возрастания ID видов. У вида фиксированный лимит и общий запас для всех водоёмов, без повторного учёта.",
      "ja": "各段階の枠は種類ごとに可能な限り均等配分し、余りは種類 ID の昇順に 1 点ずつ加算します。各種の上限は固定で、釣り場をまたいで在庫を共有します。"
    }
  ],
  [
    "上表是初始库存比例，也是五档在所选水域均可产出时、已经获得鱼获这一前提下的初始等级概率，不是每支鱼竿直接钓到该等级的概率。",
    {
      "en": "The table shows initial stock shares. These are also the initial tier probabilities conditional on receiving a catch when all five tiers are available in the water, not the unconditional chance per rod.",
      "ru": "Таблица показывает начальные доли запасов. Это также начальные вероятности уровня при уже полученном улове, если в водоёме доступны все пять уровней, а не безусловный шанс удочки.",
      "ja": "表は初期在庫比率です。5 段階すべてがその釣り場で出現可能なとき、釣果獲得を前提とする初期レアリティ確率でもあります。各竿がその段階を釣る確率ではありません。"
    }
  ],
  [
    "等级先按全局剩余数量加权抽取：某等级在当前水域仍有可产出的品种时，才参与等级抽取；已耗尽的等级被排除，其余等级重新按剩余数量计算比例。",
    {
      "en": "Tiers are weighted by global remaining stock, but only tiers with available species in the selected water participate. Depleted tiers are excluded and probabilities are recalculated.",
      "ru": "Уровни взвешиваются по глобальному остатку, но участвуют только уровни с доступными видами в этом водоёме. Исчерпанные уровни исключаются, доли пересчитываются.",
      "ja": "段階は全体の残数で重み付けします。ただし、その釣り場で出現可能な種類が残る段階だけが対象です。在庫切れの段階を除外し、比率を再計算します。"
    }
  ],
  [
    "确定等级后，只在该水域可产出的同等级品种中，按每个品种的剩余数量抽取。剩余越多，抽取权重越高；库存为零的品种不再产出。",
    {
      "en": "Within the selected tier, eligible species in that water are weighted by their remaining stock. Larger stock means higher weight; species with zero stock cannot be issued.",
      "ru": "В выбранном уровне виды данного водоёма взвешиваются по остатку. Чем больше запас, тем выше вес; при нулевом запасе вид не выпускается.",
      "ja": "選ばれた段階では、その釣り場の対象種を残数で重み付けして選びます。残数が多いほど重みが高く、ゼロの種は発行されません。"
    }
  ],
  [
    "因此，概率会随已发行数量和所选水域变化。鱼的长度与品质由同一链上随机来源按固定规则生成；重量按该物种的参考体型与长度计算。",
    {
      "en": "Probabilities therefore change with issued supply and water selection. Length and quality use fixed rules and the same on-chain random source; mass is calculated from the species reference size and length.",
      "ru": "Вероятности меняются с выпуском и выбором водоёма. Длина и качество получаются по фиксированным правилам из того же источника случайности; масса рассчитывается по эталонному размеру вида и длине.",
      "ja": "確率は発行数と釣り場によって変わります。長さ・品質は同じオンチェーン乱数源と固定規則から生成し、重さは種類の基準体型と長さから計算します。"
    }
  ],
  [
    "200 万份是合约中的累计发行上限，并非一开始就把 200 万份 NFT 铸造到某个钱包。只有鱼获确认时，合约才扣减对应品种和等级的剩余额度，创建唯一的 Token ID，并直接把 NFT 记到获得鱼获的玩家地址。",
    {
      "en": "2,000,000 is the lifetime cap, not a premint to a wallet. When a catch is confirmed, the contract reduces species and tier stock, creates a unique token ID, and assigns the NFT directly to the player's address.",
      "ru": "2 000 000 — общий лимит, а не предварительный выпуск на кошелёк. При подтверждении улова контракт уменьшает запас вида и уровня, создаёт уникальный ID и передаёт NFT адресу игрока.",
      "ja": "200 万点は累計上限であり、最初にウォレットへ全量発行するものではありません。釣果確定時に種類・段階の残枠を減らし、固有の Token ID を作成してプレイヤーのアドレスに付与します。"
    }
  ],
  [
    "鱼种、等级、水域、体长、重量、品质、获得时间和对应垂钓记录保存在合约中；铸造与后续转移产生链上事件，可通过 BNB 区块浏览器核验。转出只改变所属地址，不增加 NFT 数量，也不恢复发行额度。",
    {
      "en": "Species, tier, water, length, mass, quality, catch time and entry are stored in the contract. Minting and transfers emit events verifiable in a BNB explorer. Transfers change ownership only; they neither increase supply nor restore quotas.",
      "ru": "В контракте хранятся вид, уровень, водоём, длина, масса, качество, время и запись заброса. Выпуск и передача создают проверяемые события. Передача меняет только владельца, не увеличивает выпуск и не восстанавливает квоты.",
      "ja": "種類・段階・釣り場・長さ・重さ・品質・取得時刻・釣り記録をコントラクトに保存します。発行と移転は BNB エクスプローラーで検証可能です。移転は所有者だけを変更し、数量を増やしたり枠を回復したりしません。"
    }
  ],
  [
    "钱包通过 ERC-721 的 tokenURI 读取卡片资料。当前鱼获属性与元数据由合约提供，卡片图片由外部图片地址加载；图片文件本身并未完整写入区块链。支持该标准的钱包可以展示和转移 NFT，展示时间取决于钱包的收录与缓存。",
    {
      "en": "Wallets read card metadata through ERC-721 tokenURI. Attributes and metadata come from the contract; images load from external URLs and are not fully stored on-chain. Compatible wallets can display and transfer NFTs; indexing and cache affect display timing.",
      "ru": "Кошельки читают данные через ERC-721 tokenURI. Атрибуты и метаданные предоставляет контракт, изображения загружаются по внешним URL и не хранятся целиком в сети. Показ зависит от индексации и кеша кошелька.",
      "ja": "ウォレットは ERC-721 の tokenURI から情報を取得します。属性とメタデータはコントラクト由来で、画像は外部 URL から読み込みます。画像全体がチェーン上にあるわけではありません。表示時期はウォレットの収録・キャッシュに依存します。"
    }
  ],
  [
    "合约将预先确定的目标区块哈希，与链 ID、合约地址、规则哈希和目标高度共同计算随机来源，再按固定算法选择鱼竿、等级及品种。数据与算法可公开复算，服务器不能自行指定鱼获归属或鱼种。",
    {
      "en": "The random source combines the predetermined target block hash, chain ID, contract address, rules hash and target height. Fixed algorithms select the rod, tier and species. Anyone can recompute the result; the server cannot simply choose its owner or species.",
      "ru": "Источник случайности объединяет заранее заданный хеш блока, ID сети, адрес контракта, хеш правил и высоту цели. Фиксированные алгоритмы выбирают удочку, уровень и вид. Результат можно пересчитать; сервер не назначает его произвольно.",
      "ja": "事前に決めた目標ブロックハッシュ・チェーン ID・コントラクトアドレス・規則ハッシュ・目標高を組み合わせ、固定アルゴリズムで竿・段階・種類を選びます。誰でも再計算でき、サーバーが任意に指定することはできません。"
    }
  ],
  [
    "区块哈希随机性仍可能受到出块者影响，不能承诺完全不可操纵。自动服务负责提交推进交易，实际结果由合约计算和验证；网络或服务延迟可能使鱼获晚于目标区块确认。",
    {
      "en": "Block producers may influence block-hash randomness, so complete manipulation resistance is not guaranteed. Automation submits processing transactions; the contract computes and verifies results. Network or service delays can postpone confirmation.",
      "ru": "Производители блоков могут влиять на хеш; полная защита от манипуляций не гарантируется. Сервис отправляет транзакции обработки, результат вычисляет и проверяет контракт. Задержки сети или сервиса могут отложить подтверждение.",
      "ja": "ブロック生成者がハッシュに影響できるため、完全な操作耐性は保証しません。自動サービスは処理取引を送信し、結果はコントラクトが計算・検証します。ネットワークやサービスの遅延で確定が遅れる場合があります。"
    }
  ],
  [
    "若目标哈希未及时保存且已超出 256 个区块的读取窗口，该时段会跳过，不更换哈希重抽，也不补发该时段鱼获；鱼竿仍继续参与后续鱼讯。无人参与时不积累待发鱼获。",
    {
      "en": "If the target hash was not saved within the 256-block window, the period is skipped without another hash, redraw or backdated issuance. Rods continue in later events. Idle periods do not accumulate catches.",
      "ru": "Если хеш не сохранён в окне 256 блоков, период пропускается без нового хеша, повторного выбора или дополнительного выпуска. Удочки продолжают участие. Периоды без участников не накапливают улов.",
      "ja": "目標ハッシュを 256 ブロックの期限内に保存できなかった期間は、別ハッシュでの再抽選や遡及発行をせずスキップします。竿は後続の判定に参加し続け、無人期間の釣果は蓄積しません。"
    }
  ],
  [
    "当前运行合约不收取饵料费或游戏服务费，玩家发起抛竿、收竿和 NFT 转移时支付网络 Gas。拟定服务费尚未在当前合约启用，费用以实际签名交易为准。",
    {
      "en": "The current contract charges no bait or game service fee. Casting, withdrawing and NFT transfers cost network Gas. The proposed service fee is not enabled in this contract; review the actual wallet transaction.",
      "ru": "Текущий контракт не берёт плату за наживку или сервис. Заброс, снятие удочки и передача NFT требуют сетевой Gas. Предложенная сервисная плата не включена; проверяйте транзакцию в кошельке.",
      "ja": "現行コントラクトは餌代・ゲームサービス料を徴収しません。投入・竿の収納・NFT 移転にはネットワーク Gas が必要です。予定のサービス料は未導入で、実際の取引をウォレットで確認してください。"
    }
  ],
  [
    "当前合约不可升级，未提供调整总量、物种配额或随机规则的管理入口。管理员可暂停新增抛竿，已有鱼竿仍可继续按规则处理。",
    {
      "en": "The contract is not upgradeable and has no admin methods to change total supply, species quotas or randomness rules. The administrator can pause new casts; existing rods can still be processed.",
      "ru": "Контракт необновляемый, без административного изменения общего выпуска, квот видов или правил случайности. Администратор может приостановить новые забросы; существующие удочки продолжают обработку.",
      "ja": "現行コントラクトはアップグレード不可で、総量・種類別枠・乱数規則を変更する管理機能はありません。管理者は新規投入を停止できますが、既存の竿は引き続き処理可能です。"
    }
  ],
  [
    "NFT 没有任何经济价值属性，仅作为收藏娱乐。当前为 BNB 主网公开测试，非正式运营。以上说明对应当前运行合约。",
    {
      "en": "NFTs have no economic value and are solely for collecting and entertainment. This is a BNB mainnet public test, not production. These rules describe the currently running contract.",
      "ru": "NFT не имеют экономической ценности и служат только коллекционированию и развлечению. Это открытый тест основной сети BNB, а не рабочий релиз. Правила относятся к текущему контракту.",
      "ja": "NFT に経済的価値はなく、コレクションと娯楽専用です。現在は BNB メインネット公開テストで、正式運営版ではありません。説明は現在稼働中のコントラクトに対応します。"
    }
  ]
];
