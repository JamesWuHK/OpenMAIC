# D01-04｜五秒小劇場

版本：v0.4.2 課時定義澄清｜2026-09-28｜設計獨立重評 `SHIP`（97.5/100，僅准進入 generation-prep）；播放器時長與校內總時長未實測，未生成、未發布。
角色分工修訂：學生負責故事、節奏與鏡頭意圖、自然語言指令、觀察與驗收；AI 操作者負責 Blender 內所有場景、關鍵幀、播放、保存及視圖輸出。學生不直接操作 Blender。
對象：中一至中二；小五至小六用單物件移動。目標完整學習路徑約 30 分鐘；這是包括校內 AI-Blender 操作的總時長目標，不是 OpenMAIC 播放時長，播放器時長尚未知。
工具：Astra（GPT-6 Astra）＋具本機工具能力的 Codex；Blender 4.5 LTS。學校自備訂閱、帳號、電腦及接駁。

## 1. 今天不當聽眾，當小導演

S-01 任務：「奇想展的角色只有五秒鐘出場。它想得到甚麼？遇到甚麼？最後變成怎樣？不用旁白，讓觀眾看懂。」

驅動問題：如何用一個動作和一次變化，講出別人看得懂的短故事？學生選角色意圖、結局與停頓位置；不要求人人都跳上同一個平台。

**使用者起點：**先讓一位同伴從三個原創動作任務卡中選一個最想看的小事件，或讓他自提虛構動作；匿名記錄選擇，不稱為普遍興趣。試映時用不誘導的「你看到發生甚麼？」記錄理解差異。

**必交：能在 Blender 重開及播放的五秒小劇場 .blend（v01／v02）和三個關鍵時刻的畫面。** 主產出是實際時間軸，不是三格分鏡表。標準版不要求導出影片；設備和時間足夠才增加低清影片。沒有成功播放就只能標動畫未完成，不用生圖或剪接靜圖冒充。
核心版限一個主角、一個道具、固定鏡頭和簡單動作；音樂、口型、特效或多鏡頭屬延伸，不計入 30 分鐘核心承諾，也不能替代可重開播放的五秒時間軸。

**本課學習目標：**（1）把角色意圖整理成有起因、變化和結尾的五秒動作；（2）指揮 AI 在 Blender 用少量關鍵幀做出可播放時間軸，辨認「時間安排改變、動作感受也可能改變」；（3）從實際試映指出觀眾未看清的時刻，選擇修改一個關鍵幀時間或鏡頭，要求 AI 另存並重播。學生以三個關鍵時刻、兩版播放和實際觀眾反應證明學習，不需操作時間軸介面。

最低一個主角、一個道具、單一固定鏡頭；不做骨骼、口型、音樂、煙霧或真實物理模擬。

## 2. 可重建的五秒起點

M-01：設定輸出 24 fps、Base＝1、幀範圍 1–120，共 120 幀，播放輸出長度 5 秒。第一幀到最後一幀的取樣時間間隔為 119/24 秒，別把「端點間隔」誤當總片長。現場預覽卡頓不能當成改了輸出幀率。

M-02 是原創動作草例，不是已運行檔案：球半徑 0.4；小台頂面 z＝0.6；地面 z＝0。以下只是相對場景單位，不是真實速度或重力測量：

| 幀 | 球心 x,y,z | 故事情況 |
| --- | --- | --- |
| 1 | -2,0,0.4 | 球在台前出發 |
| 49 | -0.8,0,0.4 | 到台前，準備起跳 |
| 73 | -0.4,0,1.6 | 誇張跳起 |
| 97 | 0,0,1 | 登上小台 |
| 120 | 0,0,1 | 留時間讓觀眾看清結尾 |

先用少量位置關鍵幀和固定相機；不要一開始要求真人步態。這個草例不保證路徑沒有穿台，學生必須看中間畫面。可以改成靠近後退縮、道具突然長大等原創小故事；跳躍只是一個支架。

創作：學生說三句故事並決定節奏 → 指揮 AI 搭場景及設定關鍵幀 → AI 實際播放／逐幀輸出並保存 v01 → 同伴靜音觀看及復述 → 學生指揮 AI 改一處節奏或鏡頭 → AI 重播並保存 v02。

## 3. structureContract｜導演工作坊

`archetype: pbl-studio`。

表內分鐘均為待驗證的學習路徑 timebox，不是保證完成時限；超時可延續同一作品，不得刪作品產出、觀眾評議或修訂。

| 場景 | 環節／組件 | 學習路徑分鐘 | 學生動作與證據 |
| --- | --- | ---: | --- |
| L04-S1 | PBL 項目主線／驅動問題與作品簡報 | 2 | 進入 PBL v2 工作台，以「觀眾能否看懂故事變化」為主線，保存同一動畫的九階段證據 |
| L04-S2 | 準備度／不計分起點 | 1 | 看動作一閃而過情境，說觀眾可能漏看甚麼；不計分，記入項目起點 |
| L04-S3 | 按需概念支架 | 2 | 需要時參考關鍵幀、時間間隔與實際播放的檢查方法，不作連續理論講授 |
| L04-S4 | 簽名互動／動畫節奏選擇 | 3 | 選一個關鍵時刻並預測時間安排的影響，帶回動畫項目 |
| L04-S5 | 調查／AI 原型指令 | 8 | 指揮 AI 建 v01，重播完整片段並檢查中段；不以播放器慢放代替修改時間軸 |
| L04-S6 | 同伴評議／證據缺口 | 3 | 挑戰把播放器慢放當成作品修改的推論，指出應看哪段實際播放證據 |
| L04-S7 | 學生修訂／v01→v02 | 6 | 由學生決定只改一項時間或取景，核對完整片段的前後證據 |
| L04-S8 | 作品展示／證據交付 | 3 | 在同一 PBL 項目提交可重播五秒動畫、關鍵時刻接觸表和修訂理由 |
| L04-S9 | 反思遷移 | 2 | 只剩三秒時，指出會縮短哪段、保留哪個瞬間及需要甚麼播放證據 |

PBL 項目主線：OpenMAIC PBL v2 工作台在 S1 開場，按序保存驅動問題、準備度、簡報、調查、原型、評議、修訂、展示和遷移九個里程碑；互動頁只作項目支架，結果需提交回對應里程碑。六功能：目標／成果與驅動問題 S1；激活 S2；主動建構 S4/S5；反饋修訂 S6/S7；評量證據 S1 項目記錄及 S5–S8；遷移 S9。全課不放獨立答案測驗。30 分鐘仍是未經試教的整體路徑目標。

## 4. interactionContract｜動畫一定真的動

**課堂邊界：**以下 I1／I2 是課堂中由學生提出設計決定、教師監督、AI 操作者在 Blender 執行的工作流，不是現有 OpenMAIC 播放器內的 Blender 互動；學生不操作 Blender 介面。

### I1｜同一路徑，換個節奏〔簽名互動〕

學生要求 AI 保持主要位置不變，移動一個中間關鍵幀的時間，或添加一段相同位置的停頓；state＝learnerPrompt、keyframeTimes、poseValues、playbackRange、viewerInterpretation。可見結果是等待／突然／猶豫等不同動作感，但觀眾理解不預填。

錯例 M-03：所有關鍵幀擠在最前面，觀眾只看到一閃。反饋：「哪一幀之前發生了重要變化？觀眾有沒有時間看到？」第二提示：先把其中一個關鍵時刻向後移，再重播。重試不得只慢放整個播放器當完成改版；需改作品時間軸。證據：前後關鍵幀位置、可播放兩版、觀眾一句實際反饋。

### I2｜相機沒有看到就等於沒有演到

學生要求 AI 播放中段並輸出相機框，決定調整主角路徑或鏡頭位置，只改一項；state＝learnerPrompt、cameraTransform、framing、actorPath、missingMoment。可見結果是關鍵動作被切掉／遮住，或能在畫面內看見。

錯例：起跳最高點出了畫面，開場和結尾卻都正常。反饋：「檢查中間，不只看首尾。」第二提示：停在最高點、再停前後幾幀，比較邊界。重試重新播放全段，也檢查穿台。證據：同一關鍵幀兩版取景及全段播放；不要求電影級鏡頭，只要求觀眾看得到關鍵變化。

## 5. 動畫救援卡

- 模型移了但播放不動：確認在兩個不同時刻記錄相同屬性的不同值。示範一對位置關鍵幀，不展開函數曲線理論。
- 動作奇怪：先查中間畫面及插值，必要時用簡單可預期的方式測試；「有關鍵幀」不保證路徑正確。
- 看起來跳得不真：這是誇張創作，不把它稱為真實力學；若意圖是自然動作，先減少誇張，而非聲稱已模擬重力。
- 電腦慢：用工作視圖播放，或逐幀檢查並保留可播放時間軸；逐幀只證明順序，不能冒充流暢度實測。不等待高畫質長渲染。

每卡 90 秒內，全課單向講解上限 8 分鐘。

## 6. Astra 請求

```text
請協助我的五秒小劇場，故事是：[我的三句故事]。
Blender 4.5 LTS，24 fps、Base=1、1到120幀，固定鏡頭，一個主角一個道具。
先建立低複雜度場景與少量位置或旋轉關鍵幀，分件可編輯。
不要骨骼、物理模擬、音樂、外部素材或影片生成。
給我三個關鍵時刻和可播放時間軸；先保存 v01，按我的指令實際播放，等我決定後再改一個時間；不要要求我操作 Blender。
未渲染影片就不要聲稱影片已輸出；不把規劃畫面說成實際截圖。
只操作本課資料夾。
```

修訂：「觀眾在［時刻］未看懂［事情］。我想把［動作］停留久一點／把［鏡頭］移開。請保留未要求修改的部分，另存 v02 並播放給我檢查。」不要讓 AI 替學生寫觀眾復述或決定修改理由。

## 7. 現場驗收

四項各 0–2：教師／AI 操作者確認重開後時間軸確實動；有學生選擇的意圖和變化；學生檢查中間關鍵動作是否在鏡頭內；根據試映指揮 AI 改版。0 未見、1 需協助、2 能展示並說明；建議 6/8，動畫本體及改版不得 0。

觀眾對故事可有不同理解，若和意圖不同，先追問「你看到甚麼」，不要判觀眾錯。遷移三秒版只要求指出取捨並演示一處改時間，不在最後五分鐘硬逼再渲染一片。

## 8. 支架、角色和設計簽名

高小一物件移動／縮放、三個關鍵時刻；初中加入一次停頓；進階試相同路徑兩種節奏。不要求寫 Python。慢組保留單鏡頭，刪背景細節，不能用靜圖代替動畫。

高小必做：用三格故事卡選起點／變化／結尾，口述一個要停留的時刻；初中必做：自行寫三句故事 brief，指定要比較的關鍵幀時間或取景。每名學生各自提供一條時間／鏡頭指令，指出實際播放中一個時刻並說明保留或修改理由；不要求識讀時間軸介面或撰寫程式。

AI 老師問觀眾何時看懂；助教查時間軸與鏡頭；AI 同學說「首尾對就得」，由學生用中段畫面回應。同伴才是試映觀眾。

`designSignature`：時間軸和小型試映台，動效本身就是被檢查的作品。相對已發布 T02-01，互動從感知閾值改為時間／取景，版式由規則鏈改為分鏡＋時間軸，成果由規則卡改為可編輯動畫；相對 D01-03 的空間路線，本課評量時間表達。禁止花俏轉場代替故事、生成影片冒充 Blender、用背景音樂掩蓋觀眾看不懂。只共用播放器基建。

## 9. 畫面與口語分軌

- 畫面：關掉解說，觀眾還看得懂發生了甚麼嗎？
- 粵語：今次唔准你喺旁邊解畫。播一次俾同學睇，睇吓佢講唔講得出發生咗乜事；睇唔明就改節奏。
- 普通話：这次先不解释。播放一次，请同学说说发生了什么；看不明白，就改一改动作和节奏。

繁中、简中、English 學生閱讀文案及粵語、普通話、英文獨立旁白稿已完成；獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS（見 §15 及總審核）。音頻尚未合成、試聽或接入播放器；粵語目標語速 1.2 倍，只在一層加速。靜音可完成任務，不用普通話讀粵語文案，也不在缺音軌時跨語種替代。

## 10. 作品交接、私隱與保存

開課前置：須遵守[系列未成年人課堂工具與資料保護協議](00-series-index.md#52-未成年人課堂工具與資料保護前置協議)，由校方確認年齡條款、資料流、工作站權限、教師監督與回滾；文件內 prompt 不是系統安全控制。任一條件未確認，就不收學生輸入、不執行 Blender 工具，並如實標示實作未完成。

`portfolioInput`：可用自己的角色／基地；獨立上課可重建本課一球、一小台、地板及相機。
`portfolioOutput`：v01／v02 .blend，含可播放 120 幀時間軸；三張關鍵時刻接觸表；實際播放的同伴回饋。低清影片是延伸，不以靜態圖冒充動畫。
`nextUse`：選一個觀眾看得懂的時刻或短片進入第六課展覽；作品在 Blender 可重播。
`conceptRevisit`：時間順序、位置與關鍵幀、停頓和觀眾理解；動畫不等於物理證明。

本課檔名用 `G03_D01_L04_v01.blend`、`v02.blend`；圖片同前綴。只能操作本課指定資料夾，保留舊版，不覆蓋他人作品。提示詞不是權限沙箱；學校事前限制檔案及工具權限，不執行來源不明腳本、不關閉安全防護、不裝未知插件。AI 出錯保留錯誤、回復可用版；未完成就如實標記，不編造已生成或測試成功。

只用組別代號，不上傳學生姓名、人臉、聲音、學校平面圖、帳號畫面或家庭位置。文字、角色、形體與示意圖全部原創，不使用官方圖文、供應商示範作品或品牌角色。M 是課堂設定，S 是虛構任務，均不可代表香港現況；實際觀察另記，不能預填。成果是數碼創作／概念，不作工程安全、打印可用性或專業用途保證。

## 11. 一手研究依據與準確性邊界

本次核對：2026-09-23（下列前兩項官方 4.5 正文已讀；Astra／安全沿用 2026-09-22 快照）。

1. [Blender Keyframes](https://docs.blender.org/manual/en/4.5/animation/keyframes/introduction.html) → R-01：關鍵幀存下某時刻的屬性，中間變化由插值產生；不保證自動得到有意思的表演。
2. [Blender Output Format](https://docs.blender.org/manual/en/4.5/render/output/properties/format.html) → R-02：影像時間取決於幀數與輸出幀率；即時預覽可受設備限制。
3. [OpenAI Astra 案例](https://developers.openai.com/blog/architectural-visualization-with-astra) → 場景／工具協作背景，不作動畫生成成功率證據。
4. [Blender 腳本安全](https://docs.blender.org/manual/en/4.5/advanced/scripting/security.html) → 本機執行邊界。

以上只作研究依據，教學表述與視覺重新創作。軟件行為有來源，不代表本課提示詞、學校電腦效能、約 30 分鐘完成率或學生興趣已驗證。不可把 M 示例或 AI 回答寫成實測結果。

## 12. OpenMAIC 單課製作指令

本課約 30 分鐘只指整條學習路徑（OpenMAIC 引導＋校內受監督 AI-Blender 活動）的設計目標；不得將其當成播放器 runtime。課件生成後分別計量播放器活動時間和課內工具活動的實際總時間；未計時試教前不公開承諾 30 分鐘。

只製作 D01-04「五秒小劇場」的候選引導，一課一文檔；不得生成其餘課或把本稿 13 節逐節朗讀。以第 1 節任務和作品開場，九場景採 `pbl-studio`。約 30 分鐘是全程學習路徑目標，不是 OpenMAIC 播放 runtime；課件生成後另測玩家活動時間，校內試教另測端到端總時長，兩者未取得證據前不得對外承諾 30 分鐘。最多兩張短說明頁，單次救援提示最長 90 秒，全課單向講解設計上限 8 分鐘。時間尚待學校設備計時試教；如生成超時，允許同一作品跨課延續，不刪作品、試映或修改。

託管只做原創引導、按需提示和教練式討論候選。模型、動畫和投影必須在 Blender 真正執行；不讓學生按「完成」後就自動判通過。可編輯工作區的來源是本機 .blend；未來網站狀態或提交組件需另做確定性實作與驗證，不聲稱播放器已接通 Blender。

功能：Web 關（資料閉合）；image 關（教學關鍵圖須來自實際原創模型）；生成 video 關（不冒充 Blender 輸出）；託管 TTS 關（後續獨立語軌）；agents／discussion 開候選（各有任務，不能替學生選）；quiz 僅保留操作中誤區和離堂遷移，不作理論考試；interactive／PBL 保留真實作品編輯與返工，不以通用選擇題代替。學生可見工具名稱，不出現密鑰、帳號設定、供應商選擇器或作者導航。

## 13. 教師開課檢查與未完成門檻

- 課前在學校電腦真正重建本課 M 起點，確認檔案能重開；本稿沒有附上已完成 .blend 資產。
- 確認電腦＋滑鼠和 Astra 工具接駁；手機能看任務不等於能建模。老師若只能投影示範，不宣稱學生完成個人實作。
- 示範只到最小粗模；學生必須保留自己的選擇、指揮 AI、同伴測試及一次由 AI 執行的作品修訂；不能以學生手動操作 Blender 代替 AI 操作目標。
- 本課的 AI 操作者必須在 Blender 真正建立並播放時間軸；若只有分鏡、影片生成或靜態截圖，不能記作動畫完成，也不改由學生直接操作 Blender 來補流程。
- 卡住先縮減細節或修局部；不能用生成圖片、填表或聽講替代本課作品。若素材／設備不合格，先完成準備，不虛報通過。
- 設計階段獨立重評為 97.5/100、`SHIP`（僅進入 generation-prep）；學生未實操驗證、未試教，尚無 generation manifest／G2 授權。不得把設計 `SHIP` 當作 OpenMAIC 提交或網站發布許可。

## 14. 可訪問性與窄屏完成規格（待成品測試）

- 核心路徑不使用拖放或只靠顏色／聲音的提示；故事意圖、時間點、鏡頭和修訂可用原生表單及鍵盤完成，Tab／Shift+Tab／Enter／Space 可走完，焦點清楚可見；播放狀態和反饋有文字標籤並由 `aria-live` 宣讀。
- 390×844 手機版採單欄時間線，以可放大的關鍵影格與逐段播放替代橫向拖拉；每個控制至少 55px，不要求橫向捲動。手機完成故事選擇、AI 指令草擬、關鍵影格檢查和修改理由；Blender 動畫由校方工作站上的 AI 操作者執行，學生不須在手機操作 Blender。
- 動畫可暫停、重播，並提供靜態關鍵影格／文字敘述；不閃爍，尊重減少動態偏好。低效能時先提供同一模型的靜態時間線證據，但不得稱作已播放驗證。
- 待驗收：桌面與 390×844 真瀏覽器各完成「選故事—複製 AI 指令—檢查 1／49／73／120 幀—記錄節奏判斷—提出修訂—遷移」；鍵盤重走，檢查播放控制、標籤、焦點、朗讀回饋及控制台。此規格不是成品已通過的證據。

## 15. D01-04 九場景六軌閱讀稿與三語操作稿

畫面閱讀選項為繁體中文（香港）、简体中文、English；粵語、普通話、英文旁白各自撰寫。互動指令和錯誤提示留在畫面並隨閱讀語言切換，旁白不跨語種代讀。OpenMAIC 託管 TTS 關閉；以下是文案，不是音頻或實際動畫。

### 九場景六軌引導

| 場景 | 繁中屏幕 | 简中屏幕 | English screen | 粵語口語 | 普通話口語 | English narration |
| --- | --- | --- | --- | --- | --- | --- |
| S1 任務 | 五秒內讓觀眾看懂一件事：角色想做甚麼，遇到甚麼變化，最後怎樣。 | 五秒内让观众看懂一件事：角色想做什么，遇到什么变化，最后怎样。 | Tell a tiny story in five seconds: what does the character want, what changes, and how does it end? | 五秒講一個小故事：個角色想做乜？中間有咩變化？最後點收科？ | 用五秒讲一个小故事：角色想做什么？中间有什么变化？最后怎样结束？ | Tell a tiny story in five seconds: what the character wants, what changes, and how it ends. |
| S2 先說第一個想法（不計分） | 重要變化一閃而過時，你覺得觀眾可能漏看甚麼？先說直覺，也可說未能判斷；不計分，稍後再看時間點。 | 重要变化一闪而过时，你觉得观众可能漏看什么？先说直觉，也可说暂时不能判断；不计分，稍后再看时间点。 | When an important change flashes by, what might the audience miss? Share a first thought or say you cannot tell yet. Not scored; we will inspect timing later. | 重要變化一閃而過，你估觀眾會睇漏乜？先講直覺，唔計分，之後再睇時間點。 | 重要变化一闪而过，你猜观众会漏看什么？先说直觉，不计分，之后再看时间点。 | What might the audience miss when a key change flashes by? Share a first thought; this is not scored. |
| S3 故事 | 用三句決定起因、變化和結尾；由你選停頓。 | 用三句话决定起因、变化和结尾；由你选择停顿。 | Use three short lines for the setup, change, and ending. You choose the pause. | 用三句諗好開頭、變化同結尾，幾時停一停都由你決定。 | 用三句话想好开头、变化和结尾，停顿的时机也由你决定。 | Plan the setup, change, and ending in three short lines. You choose when the action pauses. |
| S4 節奏試驗 | 保持角色走相同路線，只移一個中間時間點，再看兩版感受。 | 保持角色走相同路线，只移动一个中间时间点，再比较两版感受。 | Keep the same path. Change one middle timing point and compare the two versions. | 路線唔變，淨係改一個中間時間，睇吓兩版感覺有咩唔同。 | 路线不变，只改一个中间时间点，再比较两个版本的感觉。 | Keep the path unchanged. Change one timing point in the middle and compare how the versions feel. |
| S5 建動畫 | 指揮 AI 建單鏡頭低細節場景，設 24 fps、1–120 幀並保存 v01。 | 指挥 AI 建立单镜头低细节场景，设置 24 fps、1–120 帧并保存 v01。 | Direct AI to build a simple one-shot scene at 24 fps, frames 1–120, and save v01. | 叫 AI 整個簡單單鏡頭場景，設定每秒 24 格、由第 1 到 120 格，存成 v01。 | 请 AI 制作简单的单镜头场景，设置每秒 24 帧、第 1 到 120 帧，并保存为 v01。 | Ask AI to build a simple one-shot scene at 24 frames per second, from frame 1 to 120, and save v01. |
| S6 靜音試映 | 同伴靜音觀看後說自己看到甚麼；只記錄實際反應。 | 同伴静音观看后说自己看到了什么；只记录实际反应。 | Let a peer watch silently and describe what they saw. Record only their actual response. | 靜音播俾同學睇，問佢見到咩事，只記低佢真係點講。 | 静音播放给同伴看，问他看到了什么，只记录他的真实回答。 | Play it silently for a peer. Ask what happened, and record only what they actually say. |
| S7 修訂 | 選一處故事不清的時間點或取景；指揮 AI 只改一項、保存 v02、重播。 | 选择一个故事不清的时间点或取景；指挥 AI 只改一项、保存 v02 并重播。 | Choose one unclear timing or framing issue. Ask AI to change only one thing, save v02, and replay. | 揀一個故事唔清楚嘅時間或者鏡頭位，叫 AI 淨係改一樣，存 v02 再播。 | 选一个故事不清楚的时间点或镜头，请 AI 只改一项，保存 v02 后重播。 | Choose one unclear moment or framing issue. Ask AI to change only that, save v02, and replay it. |
| S8 首映 | 並排播放 v01 和 v02，指出故事變清楚的證據。 | 并排播放 v01 和 v02，指出故事变清楚的证据。 | Play v01 and v02. Point to evidence that the story became clearer. | 播埋 v01 同 v02，指住一個位講吓點解而家清楚咗。 | 播放 v01 和 v02，指出一个让故事变清楚的地方。 | Play v01 and v02. Point to one moment that makes the story clearer. |
| S9 遷移 | 只剩三秒：說出要縮短哪一段、保留哪個關鍵瞬間，再作時間線修改。 | 只剩三秒：说出要缩短哪一段、保留哪个关键瞬间，再修改时间安排。 | With only three seconds, say what to shorten and which key moment to keep, then revise the timing. | 如果只剩三秒，你會縮短邊一段、保留邊個重要一刻？講完再叫 AI 改。 | 如果只剩三秒，你会缩短哪一段、保留哪个重要瞬间？说完再请 AI 修改。 | If you have only three seconds, what would you shorten and which key moment would you keep? Then ask AI to revise the timing. |

### 核心互動、修訂、救援及評量（三語閱讀稿）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 時間比較：位置不變，先記下關鍵幀時間[由我選]，再只改一個中間時間點。請 AI 各自播放兩版，不能只把播放器速度放慢。 | 时间比较：位置不变，先记录关键帧时间[由我选择]，再只改一个中间时间点。请 AI 分别播放两个版本，不能只把播放器速度放慢。 | Timing test: keep the poses unchanged. Record my chosen keyframe time, then change only one middle timing point. Ask AI to play both versions; do not merely slow the player down. |
| 回饋：重要動作發生前，觀眾有時間看見角色準備嗎？若沒有，選一個關鍵時間點調整，再重播。 | 反馈：重要动作发生前，观众有时间看到角色准备吗？如果没有，选择一个关键时间点调整，再重播。 | Feedback: does the audience have time to see the character prepare before the key action? If not, choose one keyframe time to adjust and replay. |
| 取景檢查：在第 49、73、97 幀停下查看相機框；若角色被切掉，選擇改角色路徑或相機，只改一項。請 AI 播放中段及全段，檢查穿台與出框。 | 镜头检查：在第 49、73、97 帧停下查看相机画面；如果角色被切掉，选择改变角色路径或相机，只改一项。请 AI 播放中段和全段，检查穿台与出框。 | Framing check: inspect the camera view at frames 49, 73, and 97. If the character is cut off, choose either the path or camera to change—not both. Ask AI to play the middle and full sequence, checking for intersections and out-of-frame action. |
| 完整修訂指令：同伴在[時間／畫面]看不清[動作]。我想只改[關鍵幀時間／鏡頭位置]，保留其餘姿勢與場景。保存 v01，另存 v02，實際播放兩版，輸出第 1、49、73、97、120 幀供我檢查。 | 完整修改指令：同伴在[时间／画面]看不清[动作]。我只想改[关键帧时间／镜头位置]，保留其他姿势和场景。保留 v01，另存 v02，实际播放两个版本，输出第 1、49、73、97、120 帧让我检查。 | Revision request: My peer could not see [action] at [time/view]. I want to change only [keyframe timing/camera position], keeping all other poses and the scene. Preserve v01, save v02, play both versions, and export frames 1, 49, 73, 97, and 120 for my review. |
| 救援：兩幀不同但不動，請 AI 核對同一屬性有不同數值；動作怪先看中段；跳躍是誇張故事，不稱真實物理；電腦慢用工作視圖，記清楚未證明流暢度。 | 求助：两个关键帧不同但不动，请 AI 检查同一属性是否有不同数值；动作奇怪先看中段；跳跃是夸张故事，不称真实物理；电脑慢时用工作视图，并说明没有验证流畅度。 | Help: if two different keyframes do not move, ask AI to check that the same property has different values; inspect the middle when motion looks odd; treat the jump as stylized, not real physics; on a slow computer use working views and state that smoothness was not verified. |
| 評量四項：時間軸可重開和播放；故事由我選；我檢查中段關鍵動作及鏡頭；我按真實試映反應改一項。0＝未展示、1＝需要提示、2＝能展示並解釋。動畫可播放和實際改版都不可為 0，建議至少 6/8；本課建議，非官方標準。 | 评价四项：时间轴可重新打开和播放；故事由我选择；我检查了中段动作和镜头；我根据真实试映反馈修改一项。0＝未展示、1＝需要提示、2＝能展示并解释。动画可播放和实际修改都不能为 0，建议至少 6/8；这是本课建议，不是官方标准。 | Four checks: the timeline reopens and plays; I chose the story; I checked a middle action and the framing; and I made one change from actual screening feedback. Score 0 = not shown, 1 = with prompting, 2 = shown and explained. A playable animation and a real revision must both score above 0; suggested total 6/8. This is not an official standard. |
| 安全告知：這是風格化短動畫，不是物理或特技指引。校方核實服務年齡條款、資料流、權限和監督前，不輸入姓名、人臉、聲音、帳號、校園／家庭位置；不執行未知腳本。 | 安全告知：这是风格化短动画，不是物理或特技指导。学校核实服务年龄条款、数据流、权限和监督前，不输入姓名、人脸、声音、账号、校园／家庭位置；不运行未知脚本。 | Safety notice: this is a stylized short animation, not physics or stunt guidance. Until the school checks age terms, data flow, permissions, and supervision, do not enter names, faces, voices, account details, or school/home locations; do not run unfamiliar scripts. |
| 介面欄位：三句故事／關鍵動作／我的預測／觀眾實際復述／要改的時間或鏡頭／複製給 AI／保存 v01／保存 v02／播放對比／提交。 | 界面字段：三句话故事／关键动作／我的预测／观众实际复述／要修改的时间或镜头／复制给 AI／保存 v01／保存 v02／播放对比／提交。 | Interface fields: Three-line story / Key action / My prediction / Audience's actual retelling / Timing or camera change / Copy to AI / Save v01 / Save v02 / Play comparison / Submit. |

獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS。音頻尚未合成或試聽，Blender 動畫亦未實測；此 PASS 不代表生成作品、播放證據或學生端 runtime 通過。

## 17. OpenMAIC 原生組件藍圖（生成輸入範圍）

結構原型 `pbl-studio`。最終組裝須由 S1 的 OpenMAIC PBL v2 工作台啟動九階段同一項目；調查、簽名互動、評議、修訂和展示頁只是支架，學生須把可核對結果提交回對應里程碑。S2 為不計分起點；本課不設獨立 quiz。托管生成只負責短引導與角色候選；複雜互動、項目狀態及工作台採確定性本地組裝與測試。托管生成不得生成 interactive HTML、PBL 工作區或 JavaScript；web search、image/video generation、hosted TTS 關閉；不得假稱 Blender 已執行。

本機確定性 I1「故事關鍵時刻預測」保存學生對起因／變化／結尾及節奏的判斷，創作節奏沒有唯一答案；I2「只改一個時間點再播」要求 AI 操作者保留位置和鏡頭、只改時間安排，學生比較兩版並記觀眾是否看懂。若沒在 Blender 執行或只有靜態分鏡，標記未完成，不以生圖代替動畫。

生成候選只供教師審閱，不接入學生網站，且不含學生資料；生成課堂連結可能可由持有連結者打開，審核通過前不分享。工作台只準備交付 AI 操作者的指令，不連模型、不控制 Blender。校方安全和資料條件未核驗前不開放學生工具操作；G2 批准後僅逐課提交一次，生成不等於 import／release 通過。
