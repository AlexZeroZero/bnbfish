// UI copy only. Never use translated strings as transaction state or asset IDs.
export const languageNames={zh:'中文',en:'English',ru:'Русский',ja:'日本語'};
export const locales={zh:'zh-CN',en:'en-US',ru:'ru-RU',ja:'ja-JP'};
const rows=`
抛竿|Cast|Заброс|投げる
我的鱼篓|My collection|Моя коллекция|マイコレクション
鱼篓|Collection|Коллекция|魚かご
鱼获记录|Catch log|Журнал улова|釣果履歴
我的鱼获|My catches|Мой улов|自分の釣果
水生图鉴|Species guide|Атлас видов|水生生物図鑑
连接钱包|Connect wallet|Подключить кошелёк|ウォレット接続
连接你的钱包|Connect your wallet|Подключите кошелёк|ウォレットを接続
钱包已连接|Wallet connected|Кошелёк подключён|接続済み
断开本页连接|Disconnect this site|Отключить сайт|このサイトから切断
打开 鱼获记录 ↗|Open catch log ↗|Открыть журнал ↗|釣果履歴を開く ↗
查看 鱼获记录|View catch log|Посмотреть улов|釣果履歴を見る
切换水域|Choose water|Выбрать водоём|釣り場を選択
月影湖|Moonlit Lake|Лунное озеро|月影の湖
青岚河|Jade River|Нефритовая река|青嵐の川
星潮海|Starlit Sea|Звёздное море|星潮の海
晨雾 · 松林 · 静水|Morning mist · Pines · Still water|Утренний туман · Сосны · Тихая вода|朝霧 · 松林 · 静かな水面
竹影 · 河谷 · 缓流|Bamboo · Valley · Gentle current|Бамбук · Долина · Тихое течение|竹影 · 渓谷 · 緩やかな流れ
暮色 · 海崖 · 潮汐|Dusk · Sea cliffs · Tides|Сумерки · Скалы · Приливы|夕暮れ · 海岸の崖 · 潮汐
前往垂钓 →|Fish here →|Ловить здесь →|ここで釣る →
清水饵|Freshwater bait|Простая наживка|清水の餌
当前鱼饵|Current bait|Наживка|使用中の餌
仅网络 Gas|Network Gas only|Только сетевой Gas|ネットワーク Gas のみ
智能合约|Smart contract|Смарт-контракт|スマートコントラクト
风平浪静，适合抛竿|Calm water. Make a cast.|Тихая вода. Пора забросить.|穏やかな水面。釣りを始めよう。
拖动湖面 · 自由环视|Drag the lake to look around|Потяните сцену для обзора|水面をドラッグして見回す
点击水面选落点 · 拖动鱼竿轻晃 · 拖动空白处环视|Tap water to aim · Drag the rod to sway · Drag the scene to look around|Нажмите на воду для прицеливания · Тяните удочку или сцену|水面で投下位置を選択 · 竿をドラッグして揺らす · 背景をドラッグして見回す
落点已选定 · 点击抛竿开始 · 仅支付 Gas|Spot selected · Cast to begin · Gas only|Место выбрано · Забросьте · Только Gas|投下位置を選択済み · 投げて開始 · Gas のみ
主网公开测试 · 非正式运营|Mainnet public test · Not a production release|Открытый тест основной сети · Не рабочий релиз|メインネット公開テスト · 正式運営版ではありません
主网测试 · 正在读取配置|Mainnet test · Loading configuration|Тест основной сети · Загрузка настроек|メインネットテスト · 設定を読み込み中
主网测试 · 正在检查服务|Mainnet test · Checking services|Тест основной сети · Проверка сервисов|メインネットテスト · サービス確認中
主网测试 · 合约尚未部署|Mainnet test · Contract not deployed|Тест основной сети · Контракт не развёрнут|メインネットテスト · コントラクト未配置
主网测试|Mainnet test|Тест основной сети|メインネットテスト
正在读取垂钓进度|Loading fishing progress|Загрузка хода рыбалки|釣りの進行状況を取得中
抛竿、鱼篓和记录按钮将保持可用。|Cast, collection and log controls remain available.|Кнопки заброса, коллекции и журнала остаются доступны.|投げる・魚かご・履歴の操作は引き続き利用できます。
水域已就绪|Water is ready|Водоём готов|釣り場の準備完了
等待链上配置|Waiting for on-chain setup|Ожидание настройки сети|オンチェーン設定待ち
抛竿后等待可验证随机结果|Cast and wait for the verifiable result|Забросьте и ждите проверяемый результат|投げて検証可能な結果を待つ
服务未就绪|Service not ready|Сервис не готов|サービス準備中
服务暂不可用，图鉴仍可浏览|Service unavailable; the guide is still available|Сервис недоступен; атлас доступен|サービス停止中でも図鑑は閲覧できます
更多垂钓选项|More fishing options|Настройки рыбалки|釣りのその他の設定
垂钓手记|Fishing journal|Дневник рыболова|釣りの手帳
当前装备|Current tackle|Снасти|現在の釣具
碳素鱼竿 · 清水饵|Carbon rod · Freshwater bait|Карбоновая удочка · Простая наживка|カーボンロッド · 清水の餌
垂钓记录与鱼获进度|Fishing entries and progress|Записи и ход рыбалки|釣り履歴と進行状況
查看协议说明 ↗|Read the protocol ↗|Правила протокола ↗|プロトコルの説明 ↗
在 BNB Chain，收藏每一次相遇。|Collect every encounter on BNB Chain.|Сохраняйте встречи в BNB Chain.|BNB Chain で出会いをコレクション。
连接用于读取公开地址。签名与交易均在钱包中确认，本站不接收助记词或私钥。|Connection reads your public address. Approve signatures and transactions in your wallet. This site never requests seed phrases or private keys.|Подключение даёт публичный адрес. Подписи и транзакции подтверждаются в кошельке. Сайт не запрашивает сид-фразу или приватный ключ.|接続では公開アドレスを読み取ります。署名と取引はウォレットで確認します。当サイトはシードフレーズや秘密鍵を要求しません。
浏览器钱包 · EVM|Browser wallet · EVM|Кошелёк браузера · EVM|ブラウザーウォレット · EVM
浏览器钱包|Browser wallet|Кошелёк браузера|ブラウザーウォレット
已检测到 EVM 钱包|EVM wallet detected|Обнаружен EVM-кошелёк|EVM ウォレットを検出
请安装 MetaMask 等 EVM 扩展|Install an EVM wallet such as MetaMask|Установите EVM-кошелёк, например MetaMask|MetaMask などの EVM 拡張機能をインストールしてください
请在 MetaMask / Trust Wallet 内置浏览器中打开，或安装浏览器钱包扩展。|Open in the MetaMask / Trust Wallet browser or install a wallet extension.|Откройте во встроенном браузере MetaMask / Trust Wallet или установите расширение кошелька.|MetaMask / Trust Wallet 内のブラウザーで開くか、ウォレット拡張機能を導入してください。
仅供收藏娱乐|For collecting and entertainment only|Только коллекция и развлечение|コレクションと娯楽専用
NFT 没有任何经济价值属性，仅作为收藏娱乐。|NFTs have no economic value and are for collecting and entertainment only.|NFT не имеют экономической ценности и предназначены только для коллекционирования и развлечения.|NFT に経済的価値はなく、コレクションと娯楽のみを目的としています。
NFT 没有任何经济价值属性|NFTs have no economic value|NFT не имеют экономической ценности|NFT に経済的価値はありません
鱼获仅用于游戏收藏与娱乐，不代表投资、收益或兑换权益。|Catches are game collectibles, not investments, income or redemption rights.|Улов — игровая коллекция, а не инвестиции, доход или право на обмен.|釣果はゲーム内のコレクションであり、投資・収益・交換権を意味しません。
链上 NFT|On-chain NFTs|NFT в блокчейне|オンチェーン NFT
图鉴物种|Species|Виды|図鑑の種類
↻ 刷新|↻ Refresh|↻ Обновить|↻ 更新
正在读取 ERC-721 持仓…|Loading ERC-721 holdings…|Загрузка NFT ERC-721…|ERC-721 保有情報を取得中…
最新鱼获在前 · 按链上获得时间排序|Newest first · Sorted by on-chain catch time|Новые сверху · По времени получения в сети|新しい釣果から · オンチェーン取得日時順
把湖里的故事，收进鱼篓|Collect stories from the water|Соберите истории водоёма|水辺の物語を魚かごへ
连接钱包查看你的鱼获，或先翻阅 100 种水生图鉴。|Connect to see your catches, or explore the 100-species guide.|Подключите кошелёк для просмотра улова или откройте атлас 100 видов.|ウォレットを接続して釣果を見るか、100 種類の図鑑をご覧ください。
翻开水生图鉴 ↗|Explore the species guide ↗|Открыть атлас видов ↗|水生生物図鑑を開く ↗
搜索鱼、蟹、虾、贝|Search species or scientific names|Поиск видов или научных названий|生物名・学名で検索
全部|All|Все|すべて
普通|Common|Обычный|普通
稀有|Rare|Редкий|希少
珍稀|Precious|Ценный|珍稀
罕见|Exceptional|Исключительный|非常に希少
极其罕见|Legendary|Легендарный|極めて希少
图鉴|Guide|Атлас|図鑑
鱼儿正在出水…|Your catch is emerging…|Улов появляется из воды…|釣果が水面から姿を現しています…
上鱼后揭晓收藏卡|The card is revealed after landing|Карточка появится после вываживания|取り込み後にカードを公開
物种图鉴，不代表你已持有 NFT。|Guide entry; this does not mean you own the NFT.|Запись атласа не означает владение NFT.|図鑑への掲載は NFT の保有を意味しません。
该物种仅收录展示，不产出。|Display only; this species is not issued.|Только для показа; этот вид не выпускается.|展示専用の種類で、釣果としては発行されません。
转账这枚 NFT|Transfer this NFT|Передать этот NFT|この NFT を送信
收藏等级|Rarity|Редкость|レアリティ
收藏卡|Collectible card|Коллекционная карта|コレクションカード
物种图鉴 · 展示参考|Species guide · Reference|Атлас видов · Справка|生物図鑑 · 参考表示
尺寸范围|Size range|Диапазон размеров|サイズ範囲
尺寸|Size|Размер|サイズ
重量|Weight|Вес|重量
鱼类|Fish|Рыбы|魚類
水生物种|Aquatic species|Водные виды|水生生物
贝类|Shellfish|Моллюски|貝類
蟹类|Crabs|Крабы|カニ類
虾类|Shrimp and lobsters|Креветки и омары|エビ類
螺类|Snails|Улитки|巻貝類
头足类|Cephalopods|Головоногие|頭足類
海参类|Sea cucumbers|Голотурии|ナマコ類
龟鳖类|Turtles|Черепахи|カメ類
同步记录|Sync records|Синхронизировать|履歴を同期
收获与流转，按时间留存|Catches and transfers, in time order|Улов и передачи по времени|釣果と移転を時系列で記録
获得鱼获|Caught NFT|Получен улов|釣果を獲得
NFT 转入|NFT received|NFT получен|NFT 受信
NFT 转出|NFT sent|NFT отправлен|NFT 送信
转入|Received|Получено|受信
转出|Sent|Отправлено|送信
下一页，等你写下|Your next story starts here|Следующая история — ваша|次の物語はあなたから
连接钱包，查看每次收获和鱼获流转的足迹。|Connect your wallet to see catches and transfers.|Подключите кошелёк для просмотра улова и передач.|ウォレットを接続すると釣果と移転履歴を確認できます。
链上已确认 · 上鱼动作结束后揭晓鱼种|Confirmed on-chain · Species revealed after landing|Подтверждено в сети · Вид откроется после вываживания|オンチェーン確認済み · 取り込み後に種類を公開
查看链上记录 ↗|View on-chain ↗|Посмотреть в блокчейне ↗|オンチェーン履歴 ↗
正在读取链上 NFT 事件…|Loading NFT events…|Загрузка событий NFT…|NFT イベントを取得中…
正在核对链上记录…|Checking on-chain records…|Проверка записей в сети…|オンチェーン履歴を照合中…
正在补齐历史鱼获 · 已扫描区块|Loading older catches · Scanned blocks|Загрузка истории · Проверены блоки|過去の釣果を取得中 · 確認済みブロック
读取链上记录…|Reading on-chain records…|Чтение записей сети…|オンチェーン履歴を読み込み中…
可继续加载更早的链上记录。|Older on-chain records are available.|Можно загрузить более ранние записи.|さらに古いオンチェーン履歴を読み込めます。
加载更多记录|Load more|Загрузить ещё|さらに読み込む
加载更多鱼获|Load more catches|Загрузить ещё улов|釣果をさらに読み込む
这个地址还没有鱼获 NFT。|This address has no catch NFTs yet.|У этого адреса пока нет NFT улова.|このアドレスにはまだ釣果 NFT がありません。
尚未铸造|Not minted yet|Ещё не выпущено|未発行
尚未部署|Not deployed|Не развёрнут|未配置
链上生成|Minted on-chain|Выпущено в сети|オンチェーン発行
获得于|Caught at|Получено|取得日時
来自|From|Откуда|送信元
至 |To |Кому |送信先 
区块 #|Block #|Блок №|ブロック #
（本机提交记录）|(Submitted on this device)|(Отправлено с этого устройства)|（この端末から送信）
已提交，等待确认|Submitted; awaiting confirmation|Отправлено; ожидается подтверждение|送信済み・確認待ち
已入块|Included in a block|Включено в блок|ブロックに記録済み
失败|Failed|Ошибка|失敗
已完成|Completed|Завершено|完了
转移 NFT #|Transfer NFT #|Передать NFT №|NFT を送信 #
收款地址|Recipient address|Адрес получателя|受取アドレス
核对并估算 Gas|Review and estimate Gas|Проверить и оценить Gas|確認して Gas を見積もる
收款：|Recipient: |Получатель: |受取先：
金额：|Amount: |Сумма: |金額：
预估 Gas|Estimated Gas|Оценка Gas|推定 Gas
预估合计|Estimated total|Итого примерно|推定合計
前往钱包签名确认|Confirm in wallet|Подтвердить в кошельке|ウォレットで署名を確認
请核对，尚未提交交易。|Please review. Nothing has been submitted yet.|Проверьте данные. Транзакция ещё не отправлена.|内容を確認してください。取引はまだ送信されていません。
等待钱包确认…|Waiting for wallet approval…|Ожидание подтверждения кошелька…|ウォレットの確認待ち…
已提交，可关闭窗口，在 鱼获记录中查看。|Submitted. Close this window and check the catch log.|Отправлено. Можно закрыть окно и проверить журнал.|送信済みです。ウィンドウを閉じ、釣果履歴で確認できます。
交易已入块。|Transaction included in a block.|Транзакция включена в блок.|取引がブロックに記録されました。
确认抛竿|Confirm cast|Подтвердить заброс|投げる操作を確認
主网公开测试 · 非正式运营。此操作发送真实 BNB 主网交易，并消耗真实 Gas。|Mainnet public test, not production. This sends a real BNB mainnet transaction and spends real Gas.|Открытый тест основной сети. Это реальная транзакция BNB с расходом настоящего Gas.|正式運営前のメインネット公開テストです。実際の BNB メインネット取引が送信され、Gas が消費されます。
前往钱包确认|Confirm in wallet|Подтвердить в кошельке|ウォレットで確認
正在估算网络费用|Estimating network fee|Оценка комиссии сети|ネットワーク手数料を見積もり中
直接调用 BNB 合约，无需登录签名|Direct contract call; no sign-in signature|Прямой вызов контракта; подпись входа не нужна|コントラクトを直接呼び出します。ログイン署名は不要です
准备中|Preparing|Подготовка|準備中
正在确认已有鱼讯|Confirming an existing fishing event|Подтверждение текущего события|進行中の釣果を確認中
系统会等待资格可变更后，再请你确认抛竿|Waiting until participation can change before requesting approval|Ожидание возможности изменить участие перед подтверждением|参加資格を変更可能になるまで待ってから確認を求めます
请稍候|Please wait|Подождите|お待ちください
抛竿入水|Casting into the water|Заброс в воду|水面へ投入
等待钱包确认并提交链上|Waiting for wallet approval and submission|Ожидание кошелька и отправки|ウォレット確認と送信を待っています
提交中|Submitting|Отправка|送信中
确认完成后将打开钱包，无需额外结算操作|Your wallet will open when ready; no extra settlement step|Кошелёк откроется после проверки; дополнительный расчёт не нужен|確認後にウォレットが開きます。追加の精算操作は不要です
鱼饵已入水|Bait is in the water|Наживка в воде|餌を投入しました
交易已发送，等待入块|Transaction sent; waiting for a block|Транзакция отправлена; ожидание блока|取引送信済み・ブロックへの記録待ち
守漂中|Watching the float|Следим за поплавком|ウキを見守り中
等待下一次抛竿|Ready for the next cast|Готово к новому забросу|次の投入を待っています
查看鱼获记录以确认交易状态|Check transaction status in the catch log|Проверьте статус в журнале улова|釣果履歴で取引状態を確認してください
每次抛竿独立持续垂钓，获得鱼获或主动收竿后结束。首次资格等待10～19个区块，随后每10个区块判定鱼讯；未获鱼会继续等待，无需重复付费抛竿。只有网络Gas，最终金额以钱包为准。|Each cast stays active until a catch or withdrawal. Eligibility starts after 10–19 blocks, with fishing events every 10 blocks. No catch means continued fishing, without paying to cast again. Only network Gas applies; confirm the amount in your wallet.|Каждый заброс активен до улова или снятия удочки. Участие начинается через 10–19 блоков, события — каждые 10 блоков. Без улова рыбалка продолжается, повторно платить не нужно. Только сетевой Gas; сумму проверьте в кошельке.|各投入は釣果獲得または竿をしまうまで有効です。最初の参加資格は 10～19 ブロック後、その後は 10 ブロックごとに判定されます。釣れなくても再投入や再支払いは不要です。ネットワーク Gas のみで、金額はウォレットで確認してください。
我的垂钓记录|My fishing entries|Мои забросы|自分の釣り履歴
全部垂钓记录 ↗|All fishing entries ↗|Все забросы ↗|すべての釣り履歴 ↗
收起这支鱼竿|Withdraw this rod|Снять эту удочку|この竿をしまう
持续垂钓|Still fishing|Рыбалка продолжается|釣りを継続中
已收竿|Rod withdrawn|Удочка снята|竿をしまいました
收竿|Withdraw rod|Снять удочку|竿をしまう
查看鱼讯|View progress|Посмотреть статус|進行状況を見る
每支鱼竿独立持续垂钓，获得鱼获或收竿后结束；未获得鱼获不会自动结束。|Each rod stays active until a catch or withdrawal. A missed catch does not end it.|Каждая удочка активна до улова или снятия. Отсутствие улова не завершает участие.|各竿は釣果獲得または収納まで有効で、釣れなくても自動終了しません。
还没有垂钓记录，去湖边抛下第一竿吧。|No entries yet. Cast your first rod.|Записей пока нет. Сделайте первый заброс.|まだ履歴がありません。最初の一投をどうぞ。
查看更多垂钓记录|More fishing entries|Другие забросы|釣り履歴をさらに表示
当前水域鱼获已全部收藏|This water has no catches remaining|В этом водоёме улов исчерпан|この釣り場の釣果はすべて獲得済みです
不会继续产生这处水域的鱼获。可在垂钓记录中收竿。|No more catches will be issued here. Withdraw your rod from the fishing entries.|Здесь больше не будет улова. Снимите удочку в записях рыбалки.|この釣り場では新たな釣果は発行されません。釣り履歴から竿をしまえます。
鱼讯确认暂缓 · 仍在垂钓|Confirmation delayed · Still fishing|Подтверждение задержано · Рыбалка продолжается|確認が遅延中 · 釣りは継続中
自动推进暂不可用。记录仍在链上；超时未确认的时段不会补发或伪装成空竿。|Automatic processing is unavailable. Entries remain on-chain; expired periods are not reissued or shown as misses.|Автообработка недоступна. Записи в сети; просроченные периоды не перевыпускаются и не считаются промахом.|自動処理を利用できません。記録はチェーン上に残り、期限切れの期間は追加発行や空振り扱いにはなりません。
尚未获得鱼获会继续垂钓，无需再次抛竿。10个区块不等于10秒。|Fishing continues without another cast until a catch. 10 blocks does not mean 10 seconds.|Без улова рыбалка продолжается без нового заброса. 10 блоков — не 10 секунд.|釣果がなくても再投入せずに継続します。10 ブロックは 10 秒ではありません。
上一时段确认超时。|The previous period expired.|Предыдущий период истёк.|前の期間は確認期限を過ぎました。
鱼儿正在靠近 · 自动确认中|A fish is approaching · Confirming automatically|Рыба приближается · Автоподтверждение|魚が近づいています · 自動確認中
正在恢复延迟的鱼讯。未保存哈希的过期时段将跳过，你仍继续垂钓。|Recovering delayed events. Expired periods without saved hashes are skipped; your rod stays active.|Восстанавливаются события. Периоды без сохранённого хеша пропускаются; удочка остаётся активной.|遅延した処理を復旧中です。ハッシュ未保存で期限切れの期間はスキップされ、釣りは継続します。
目标区块已到达，等待链上处理。是否获得鱼获以合约完成记录为准。|Target block reached; awaiting on-chain processing. The contract determines the catch.|Целевой блок достигнут; ожидание обработки в сети. Улов определяется контрактом.|目標ブロックに到達し、オンチェーン処理を待っています。釣果はコントラクトの完了記録で確定します。
鱼获确认中 · 至少再等|Confirming catch · At least|Подтверждение улова · Ещё минимум|釣果確認中 · あと最低
守漂中 · 距下次鱼讯|Watching the float · Next event in|Следим за поплавком · До события|ウキを見守り中 · 次の判定まで
个区块|blocks|блоков|ブロック
鱼竿 #|Rod #|Удочка №|竿 #
垂钓 #|Entry #|Заброс №|釣り #
区块 |Block |Блок |ブロック 
操作提示|Notice|Уведомление|お知らせ
你已取消钱包操作，未继续提交。|Wallet action cancelled; no further submission.|Действие в кошельке отменено; отправка остановлена.|ウォレット操作をキャンセルしました。送信は続行されません。
请先连接钱包|Connect your wallet first|Сначала подключите кошелёк|先にウォレットを接続してください
钱包已变化|Wallet changed|Кошелёк изменён|ウォレットが変更されました
请重新连接账户后继续|Reconnect your account to continue|Подключите аккаунт снова|アカウントを再接続してください
收款地址不能是当前账户|Recipient must differ from your account|Получатель не может быть вашим адресом|受取先に自分のアドレスは指定できません
当前地址不持有该 NFT|This address does not own this NFT|Этот адрес не владеет NFT|現在のアドレスはこの NFT を保有していません
请勿发送到零地址或 NFT 合约|Do not send to the zero address or NFT contract|Не отправляйте на нулевой адрес или контракт NFT|ゼロアドレスや NFT コントラクトには送信しないでください
无法获取 Gas 价格|Unable to get Gas price|Не удалось получить цену Gas|Gas 価格を取得できません
网络暂不可用|Network unavailable|Сеть недоступна|ネットワークを利用できません
钱包网络已改变，请重新连接 BNB Chain|Network changed; reconnect to BNB Chain|Сеть изменена; подключитесь к BNB Chain|ネットワークが変更されました。BNB Chain に再接続してください
钱包账户已改变，请重新连接|Wallet account changed; reconnect|Аккаунт кошелька изменён; подключитесь снова|ウォレットのアカウントが変更されました。再接続してください
账户已变化，请重新连接|Account changed; reconnect|Аккаунт изменён; подключитесь снова|アカウントが変更されました。再接続してください
合约代码校验失败，已阻止交互|Contract code check failed; interaction blocked|Код контракта не прошёл проверку; действие заблокировано|コントラクトコードの検証に失敗したため操作を停止しました
全屏垂钓|Fullscreen|Полный экран|全画面で釣る
退出全屏|Exit fullscreen|Выйти из полного экрана|全画面を終了
退出全屏（Esc）|Exit fullscreen (Esc)|Выйти из полного экрана (Esc)|全画面を終了（Esc）
音效 · 关闭|Sound · Off|Звук · Выкл.|効果音 · オフ
音效 · 开启|Sound · On|Звук · Вкл.|効果音 · オン
声音 · 关闭|Sound · Off|Звук · Выкл.|音声 · オフ
音乐 · 关闭|Music · Off|Музыка · Выкл.|音楽 · オフ
音乐 · 湖畔钢琴|Music · Lakeside piano|Музыка · Фортепиано|音楽 · 湖畔のピアノ
宁静配乐 · 开启|Calm music · On|Спокойная музыка · Вкл.|穏やかな音楽 · オン
声源说明|Audio credits|Источники звука|音源について
关闭面板|Close panel|Закрыть панель|パネルを閉じる
展开面板|Expand panel|Развернуть панель|パネルを展開
收起面板|Collapse panel|Свернуть панель|パネルを折りたたむ
关闭|Close|Закрыть|閉じる
钓鱼主页交互设计|Fishing scene|Сцена рыбалки|釣りの画面
垂钓操作栏|Fishing controls|Управление рыбалкой|釣りの操作バー
链上垂钓进度|On-chain fishing progress|Ход рыбалки в сети|オンチェーンの釣り進行状況
实时 3D 湖面、鱼竿与浮漂|Live 3D water, rod and float|3D-вода, удочка и поплавок|リアルタイム 3D 水面・竿・ウキ
请竖屏体验钓鱼游戏|Please use portrait orientation|Используйте вертикальную ориентацию|縦向きでプレイしてください
游戏协议|Game protocol|Протокол игры|ゲームプロトコル
累计发行上限|Maximum lifetime supply|Предельный общий выпуск|累計発行上限
五档收藏等级|Five rarity tiers|Пять уровней редкости|5 段階のレアリティ
200 万份 NFT|2,000,000 NFTs|2 000 000 NFT|200 万点の NFT
100 个品种|100 species|100 видов|100 種類
如何钓到鱼获|How fishing works|Как работает рыбалка|釣果獲得の仕組み
获得鱼获的概率|Chance of a catch|Вероятность улова|釣果を獲得する確率
200 万份 NFT 如何分配|How 2,000,000 NFTs are allocated|Распределение 2 000 000 NFT|200 万点の NFT の配分
鱼种如何抽取，概率会不会变化|Species selection and changing probabilities|Выбор вида и изменение вероятностей|種類の抽選方法と確率の変化
NFT 如何上链和转移|NFT minting and transfers|Выпуск и передача NFT|NFT の発行と移転
随机验证、自动处理与费用|Randomness, automation and fees|Случайность, обработка и комиссии|ランダム検証・自動処理・手数料
数量上限|Supply cap|Лимит выпуска|数量上限
初始比例|Initial share|Начальная доля|初期比率
合计|Total|Всего|合計
份| NFTs| NFT| 点
单支鱼竿的机会 ≈ 1 ÷ 符合条件的鱼竿总数|Chance per rod ≈ 1 ÷ eligible rods|Шанс удочки ≈ 1 ÷ число подходящих удочек|1 本の竿の確率 ≈ 1 ÷ 条件を満たす竿の総数
等级概率 = 该等级全局剩余数量 ÷ 当前水域可选各等级的全局剩余数量之和|Tier probability = global remaining stock in the tier ÷ sum of global stock in tiers available in this water|Вероятность уровня = его глобальный остаток ÷ сумма глобальных остатков доступных в водоёме уровней|レアリティ確率 = 該当段階の全体残数 ÷ この釣り場で選択可能な各段階の全体残数の合計
品种概率 = 该品种剩余数量 ÷ 当前水域同等级可选品种的剩余数量之和|Species probability = its remaining stock ÷ remaining stock of eligible species in this water and tier|Вероятность вида = его остаток ÷ остаток доступных видов того же уровня в водоёме|種類の確率 = 該当種の残数 ÷ 同じ釣り場・同じ段階で選択可能な種類の残数合計
THE MORNING STILL|THE MORNING STILL|УТРЕННЯЯ ТИШИНА|朝の静けさ
YOUR WALLET · YOUR CATCH|YOUR WALLET · YOUR CATCH|ВАШ КОШЕЛЁК · ВАШ УЛОВ|あなたのウォレット · あなたの釣果
LIGHT TACKLE|LIGHT TACKLE|ЛЁГКИЕ СНАСТИ|軽量の釣具
COLLECTION|COLLECTION|КОЛЛЕКЦИЯ|コレクション
RECORDS|RECORDS|ЖУРНАЛ|履歴
`;
export const translations=new Map(rows.trim().split('\n').map(row=>{const [zh,en,ru,ja]=row.split('|');return [zh,{en,ru,ja}];}));
