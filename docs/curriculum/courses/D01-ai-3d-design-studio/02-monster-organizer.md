# D01-02｜怪獸收納站

版本：v0.4.2 課時定義澄清｜2026-09-28｜design SHIP（97.5/100，僅進入 generation-prep）；播放器與校內時長未實測，尚未生成／發布。
角色分工修訂：學生負責設計選擇、自然語言指令、觀察與驗收；AI 操作者負責 Blender 內所有建模、移動、測試、保存及視圖輸出。學生不直接操作 Blender。下文若出現「移入／調整／測試」，均指學生指揮 AI 執行並檢查結果。
對象：中一至中二；小五至小六用五部件支架。目標完整學習路徑約 30 分鐘；這是包括校內 AI-Blender 操作的總時長目標，不是 OpenMAIC 播放時長，播放器時長尚未知。
工具：Astra（GPT-6 Astra）＋具本機工具能力的 Codex；Blender 4.5 LTS。學校負責帳號、訂閱、設備與接駁。

## 1. 今天的委託與作品

S-01 原創任務：「桌面小怪獸成日偷食文具！把它變成收納站，讓它吞得下短筆和橡皮擦，又肯還給你。」

驅動問題：怎樣讓造型既有趣，又不擋住真正要用的空間？觀眾是想整理桌面的同伴，讓他在數碼模型裏放入和移出道具，不預設他一定喜歡。

**使用者起點：**先問一位同伴「如果桌面只收兩樣小文具，你最想收哪兩樣？」匿名記錄後，從本課固定 M 道具中選最接近的模擬物；不能把數碼尺寸檢查說成實物適配或全班需求調查。

**必交：可編輯中空收納站 .blend、兩件模擬文具、放入／取出證據圖、v01／v02。** 可以是長耳小怪獸、太空補給艙或原創小機械生物；學生選入口方向、兩件物品怎樣擺、裝飾放哪裏。不能只換老師模板的顏色。
核心版只測兩件指定模擬文具與一個入口；多件道具、裝飾精修屬延伸，不計入 30 分鐘核心承諾，也不能替代可重開、可試放取的收納站。

**本課學習目標：**（1）用指定道具和內部空間比較，說明外部尺寸不等於可用空間；（2）用自然語言指揮 AI 操作 Blender，按指定尺寸實際安置並逐件模擬取出道具；（3）根據可見相交或同伴回饋，選擇一項局部修改，要求 AI 另存新版本並用相同視角複查。達標證據是模型、學生指令、前後視圖及口述理由，不是背尺寸公式。

最低版本為底板＋四面壁＋兩個造型部件。打印不是必修；數碼通過不等於耐用、好拿或安全。今天不講完整體積公式、不做材料成本表。

## 2. 可重建的起點與任務條件

M-01 為自訂課堂尺寸，不是香港文具標準。短筆以 90 × 8 × 8 mm 長方體代替；橡皮擦以 30 × 20 × 10 mm 代替，兩件須同時放下。收納站連裝飾限 130 × 90 mm 桌面範圍；入口從頂部。限制可由老師另行調整，但須全程一致。

場景 Metric、Unit Scale＝1、顯示 mm；輸入數值帶單位。此約定下腳本 0.12 對應 120 mm，不要把 120 當作 120 mm。以下是 M-02 五部件例，底部 z＝0，正面為負 Y；數字是 mm：

| 部件 | 長×寬×高 | 中心 x,y,z |
| --- | --- | --- |
| Base | 120×80×3 | 0,0,1.5 |
| Front | 120×3×32 | 0,-38.5,19 |
| Back | 120×3×32 | 0,38.5,19 |
| Left | 3×74×32 | -58.5,0,19 |
| Right | 3×74×32 | 58.5,0,19 |

內部為 114×74×32 mm；只是這個矩形例的計算。短筆中心 (0,-15,7)、橡皮擦中心 (0,20,8) 是起始參考，學生可先選另一擺法，再指揮 AI 操作及觀察。改成曲面或加牙齒後，不能沿用矩形內部尺寸直接判通過。

順序：搭空盒 → 裝一對自己的特徵 → 放入兩件道具 → 試沿頂部拿出 → 同伴挑一個礙事處 → 改入口／裝飾位置 → 保留同角度對比。來源為 M 示例，不預填「成功取出」。

## 3. structureContract｜做出來再試

`archetype: pbl-studio`。

表內分鐘均為待驗證的學習路徑 timebox，不是保證完成時限；超時可延續同一作品，不得刪作品產出、觀眾評議或修訂。

| 場景 | 環節／組件 | 學習路徑分鐘 | 學生動作與證據 |
| --- | --- | ---: | --- |
| L02-S1 | PBL 項目主線／驅動問題與作品簡報 | 2 | 進入 PBL v2 工作台，以「能否放入並取出」為主線，九個里程碑保存同一收納站設計 |
| L02-S2 | 準備度／不計分起點 | 1 | 看「外形夠大但取不出」情境，說第一個想法或「未能判斷」；不計分，記入 PBL 起點 |
| L02-S3 | 按需概念支架 | 2 | 需要時參考外部尺寸、內部空間、入口和取出路徑的差別，再檢查自己的項目 |
| L02-S4 | 簽名互動／取放路徑檢查 | 3 | 選物件分區並預測入口限制，取得可見回饋後帶回項目 |
| L02-S5 | 調查／AI 原型指令 | 8 | 指揮 AI 建收納站 v01，分別檢查放入和取出；未執行不得冒稱結果 |
| L02-S6 | 同伴評議／證據缺口 | 3 | 挑戰「外形夠大就一定取到」的推論，提出內部空間或路徑證據問題 |
| L02-S7 | 學生修訂／v01→v02 | 6 | 由學生決定只改一項，核對 v01／v02 及未驗證部分 |
| L02-S8 | 作品展示／證據交付 | 3 | 在同一 PBL 項目提交收納站、道具分區、取放證據與版本差異 |
| L02-S9 | 反思遷移 | 2 | 換一件不同尺寸道具，指出先重查的入口或內部阻擋並說明證據 |

PBL 項目主線：OpenMAIC PBL v2 工作台在 S1 開場，按序保存驅動問題、準備度、簡報、調查、原型、評議、修訂、展示和遷移九個里程碑；互動頁只作項目支架，結果需提交回對應里程碑。六功能：目標／成果與驅動問題 S1；激活 S2；主動建構 S4/S5；反饋修訂 S6/S7；評量證據 S1 項目記錄及 S5–S8；遷移 S9。全課不放獨立答案測驗。30 分鐘仍是未經試教的整體路徑目標。

## 4. interactionContract｜功能不是看起來像

**課堂邊界：**以下 I1／I2 是課堂中由學生提出設計決定、教師監督、AI 操作者在 Blender 執行的工作流，不是現有 OpenMAIC 播放器內的 Blender 互動；學生不操作 Blender 介面。

### I1｜文具餵食測試〔簽名互動〕

學生指揮 AI 把兩件 M 道具放入並按要求調方向，再觀察 AI 輸出的俯視和剖開／隱藏前壁後的側視；state＝learnerPrompt、propTransforms、intersectionsObserved、layoutChoice、modelVersion。可見結果是放下、相交或互相擋住，不能由「外尺寸夠」自動打勾。

錯例 M-03：裝飾柱佔了內部空間，截圖卻仍寫「內長 114」。反饋：「114 是沒有柱子的矩形空間，現在這件道具碰到哪裏？」第二提示：只暫時隱藏柱，比較相同道具位置。重試：移柱或改擺法，再顯示全部物件。證據：同一模型兩角度和修改前後；用眼檢查須標「數碼目視檢查」，非精密碰撞驗證。

### I2｜肯吞也要肯還

學生指揮 AI 從實際擺放位置沿選定入口逐件模擬移出道具，另一件保持原位；state＝learnerPrompt、removalPath、blockedPart、changedPart、retryResult。AI 輸出的畫面能看見拿到一半是否穿過牙齒、耳朵或另一件物品。

錯例：裝飾橫跨頂部，物件放得下卻無法按原路拿出。反饋指出相交位置，不命令刪掉所有造型。第二提示：試把裝飾移向外側，並重查 130×90 限制。重試要覆核放入與取出兩段。證據：路徑的起、中、終位置圖及一次現場示範；未連續檢查全程就不能聲稱整條路徑保證無碰撞。這也不證明真人手指握持方便。

## 5. 製作中的短救援

- 筆明明短過盒卻放不下：只在此刻展示外長減去兩面壁；本例 120−3−3＝114。換不規則形狀要重新量，不套死公式。
- 看不見內部：暫時隱藏一面壁查看，檢查完再顯示；不要刪掉壁後假稱原設計通過。
- 數字差一千倍：在輸入框明寫 mm，教師查場景設定，不用「畫面差不多大」判斷。
- AI 做成實心：停在空盒五部件版，讓學生看見真正內部空間，再加造型。

每卡不超過 90 秒；救援完立即回到作品。

## 6. Astra 請求

```text
我設計的原創收納站是：[造型]，兩件文具擺法是：[我的選擇]。
請在 Blender 4.5 LTS 依本課 M-02 五部件資料造可編輯空盒，
Metric、Unit Scale=1，輸入與顯示尺寸用 mm，腳本換算須核對。
加入分開命名的 90×8×8 mm 筆與 30×20×10 mm 橡皮擦。
先不要裝飾入口，請按我的口述擺放道具，展示頂視和側視；不要要求我操作 Blender。
之後只加我選的兩個造型部件，不自動宣稱打印或使用安全。
只操作本課資料夾，另存 v01，等我的測試再局部改版。
```

修訂：「道具在［位置］碰到［部件］。我的方案是［移裝飾／改擺法］。請你只做這項修改並另存 v02，不把道具縮小偷過關。」學生須提出並說明至少一個修改決策，然後檢查 AI 輸出。

## 7. 作品驗收與遷移

四項各 0–2：教師／AI 操作者確認模型可重開且確實中空；AI 按學生指令安置兩件指定大小道具；學生能解讀取出模擬並說明觀察限制；返工保留造型意圖又解決具體問題。0 未見、1 需協助、2 能展示並說明；建議 6/8 且中空模型、返工不得 0。學生不直接移動道具或 Blender 物件。

不用最靚或最多裝飾排名。觀眾說「拎唔到」時要指出哪件、在哪裏，不讓嘲笑替代評議。新條件的參考回應：118 mm 筆比原矩形內長 114 mm 長，原直放方案不成立；若斜放，要重新做完整擺放和取出檢查，不能只說「斜一點便可以」。

## 8. 支架、角色、差異

高小保留矩形五部件，不要求布林或算體積；初中可改一個入口或增加可移隔片，仍須實測幾何。進階做兩種造型對比但不能刪掉返工時間。慢組少做裝飾，不減掉真正放入／取出。

高小必做：以圖卡選兩件指定尺寸的道具，按句框指揮 AI 擺放並指出一處阻擋；初中必做：自行交代尺寸／方向／不可變條件，解釋放入與取出為何要分開檢查。每名學生各自交一條指令、圈出一張輸出中觀察到的證據並說明一次取捨；可口述代替長文。

老師追問使用者怎樣拿；助教核對單位和指定道具未被縮小；AI 同學說「靚就得啦」，學生用作品回應。AI 不替同伴寫好評。

`designSignature`：可開合的觀察視圖和「餵／取」操作。比已發布 T02-01 的感知閾值、規則鏈、規則卡，本課採空間路徑、頂側視和功能物件三項不同；比 D01-01 由辨識造型轉到空間可用。禁止以換色作修訂、把穿牆動畫當可取出、用渲染冒充實物測試。只共用播放器和可訪問控件。

## 9. 畫面與口語分軌

- 畫面：嘴巴看起來夠大，文具真的放得進去、拿得出來嗎？
- 粵語：佢個口睇落好大喎，但支筆真係放得入、拎得返出嚟咩？唔好淨係望張相，我哋郁支筆試吓。
- 普通話：它的嘴看起来很大，但笔真的放得进去、拿得出来吗？移动模型试一下，不只看图片。

繁中、简中、English 學生閱讀文案及粵語、普通話、英文獨立旁白稿已完成；獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS（見 §15 及總審核）。音頻尚未合成、試聽或接入播放器；粵語目標語速 1.2 倍，合成與播放器只在一層加速。靜音可完成任務，不用普通話讀粵語文案，也不在缺音軌時跨語種替代。

## 10. 作品交接、私隱與保存

開課前置：須遵守[系列未成年人課堂工具與資料保護協議](00-series-index.md#52-未成年人課堂工具與資料保護前置協議)，由校方確認年齡條款、資料流、工作站權限、教師監督與回滾；文件內 prompt 不是系統安全控制。任一條件未確認，就不收學生輸入、不執行 Blender 工具，並如實標示實作未完成。

`portfolioInput`：可沿用第一課角色特徵，但非必要；本課五部件文字起點可獨立重建。
`portfolioOutput`：中空收納站 v01／v02 .blend；兩件 M 文具分開命名；放入及取出關鍵位置圖；一句功能取捨。
`nextUse`：把小物件加入第三課基地作道具，或留待第六課展出。只複用自己原創的形體。
`conceptRevisit`：外部範圍與內部空間；物件放置方向；裝飾和功能的取捨。

本課檔名用 `G03_D01_L02_v01.blend`、`v02.blend`；圖片同前綴。只能操作本課指定資料夾，保留舊版，不覆蓋他人作品。提示詞不是權限沙箱；學校事前限制檔案及工具權限，不執行來源不明腳本、不關閉安全防護、不裝未知插件。AI 出錯保留錯誤、回復可用版；未完成就如實標記，不編造已生成或測試成功。

只用組別代號，不上傳學生姓名、人臉、聲音、學校平面圖、帳號畫面或家庭位置。文字、角色、形體與示意圖全部原創，不使用官方圖文、供應商示範作品或品牌角色。M 是課堂設定，S 是虛構任務，均不可代表香港現況；實際觀察另記，不能預填。成果是數碼創作／概念，不作工程安全、打印可用性或專業用途保證。

## 11. 一手研究依據與準確性邊界

核對快照：2026-09-22（前版已讀官方正文；幾何例為本稿自訂並另作算術檢查）。

1. [Blender Units](https://docs.blender.org/manual/en/4.5/scene_layout/scene/properties.html) → R-01：單位設定須明確，畫面顯示不能取代數值檢查。
2. [Blender Transform](https://docs.blender.org/manual/en/4.5/scene_layout/object/properties/transforms.html) → R-02：外包圍尺寸與物件變換可查；不自動證明內部可用或沒有相交。
3. [OpenAI Astra 案例](https://developers.openai.com/blog/architectural-visualization-with-astra) → R-03：工具協作與可編輯場景的案例，不支持打印安全性。
4. [Blender 腳本安全](https://docs.blender.org/manual/en/4.5/advanced/scripting/security.html) → 工具執行權限由學校控制。

以上只作研究依據，教學表述與視覺重新創作。軟件行為有來源，不代表本課提示詞、學校電腦效能、約 30 分鐘完成率或學生興趣已驗證。不可把 M 示例或 AI 回答寫成實測結果。

## 12. OpenMAIC 單課製作指令

本課約 30 分鐘只指整條學習路徑（OpenMAIC 引導＋校內受監督 AI-Blender 活動）的設計目標；不得將其當成播放器 runtime。課件生成後分別計量播放器活動時間和課內工具活動的實際總時間；未計時試教前不公開承諾 30 分鐘。

只製作 D01-02「怪獸收納站」的候選引導，一課一文檔；不得生成其餘課或把本稿 13 節逐節朗讀。以第 1 節任務和作品開場，九場景採 `pbl-studio`。約 30 分鐘是全程學習路徑目標，不是 OpenMAIC 播放 runtime；課件生成後另測玩家活動時間，校內試教另測端到端總時長，兩者未取得證據前不得對外承諾 30 分鐘。最多兩張短說明頁，單次救援提示最長 90 秒，全課單向講解設計上限 8 分鐘。時間尚待學校設備計時試教；如生成超時，允許同一作品跨課延續，不刪產出、評議或修改。

託管只做原創引導、按需提示和教練式討論候選。模型、動畫和投影必須在 Blender 真正執行；不讓學生按「完成」後就自動判通過。可編輯工作區的來源是本機 .blend；未來網站狀態或提交組件需另做確定性實作與驗證，不聲稱播放器已接通 Blender。

功能：Web 關（資料閉合）；image 關（教學關鍵圖須來自實際原創模型）；生成 video 關（不冒充 Blender 輸出）；託管 TTS 關（後續獨立語軌）；agents／discussion 開候選（各有任務，不能替學生選）；quiz 僅保留操作中誤區和離堂遷移，不作理論考試；interactive／PBL 保留真實作品編輯與返工，不以通用選擇題代替。學生可見工具名稱，不出現密鑰、帳號設定、供應商選擇器或作者導航。

## 13. 教師開課檢查與未完成門檻

- 課前在學校電腦真正重建本課 M 起點，確認檔案能重開；本稿沒有附上已完成 .blend 資產。
- 確認電腦＋滑鼠和 Astra 工具接駁；手機能看任務不等於能建模。老師若只能投影示範，不宣稱學生完成個人實作。
- 示範只到最小粗模；學生必須保留自己的選擇、指揮 AI、同伴測試及一次由 AI 執行的作品修訂；不能以學生手動操作 Blender 代替 AI 操作目標。
- 本課的 AI 操作者必須能在學校批准的本機工具鏈中真正在 Blender 執行建模、視圖輸出與版本保存；若接駁失敗，記為未完成，不退回學生手動建模，也不以靜態圖冒充測試。
- 卡住先縮減細節或修局部；不能用生成圖片、填表或聽講替代本課作品。若素材／設備不合格，先完成準備，不虛報通過。
- 設計階段獨立重評為 97.5/100、`SHIP`（僅進入 generation-prep）；學生未實操驗證、未試教，尚無 generation manifest／G2 授權。不得把設計 `SHIP` 當作 OpenMAIC 提交或網站發布許可。

## 14. 可訪問性與窄屏完成規格（待成品測試）

- 核心路徑不使用拖放或只靠顏色／聲音的提示；尺寸比較、擺位選擇、複製指令和提交均可用原生表單及鍵盤完成，Tab／Shift+Tab／Enter／Space 可走完，焦點清楚可見，回饋使用 `aria-live` 宣讀。
- 390×844 手機版採單欄、兩件道具逐項檢查、尺寸與視角圖可單張放大；觸控目標至少 55px，不要求橫向捲動。手機完成 OpenMAIC 的選擇、指令草擬、放入／取出證據記錄與遷移；Blender 由校方工作站上的 AI 操作者執行，學生不須在手機操作 Blender。
- 尺寸以文字和單位標示；「數碼模型中看似放入／取出」不以顏色代替狀態，不暗示精密碰撞或實物安全。尊重放大及減少動態偏好，畫面失效仍提供文字任務。
- 待驗收：桌面與 390×844 真瀏覽器各完成「選擺法—複製操作指令—查看實際放取輸出—記錄問題—提出修訂—離堂換尺寸遷移」；以鍵盤重走，確認標籤、焦點、回饋和控制台。此規格不是成品已通過的證據。

## 15. D01-02 九場景六軌閱讀稿與三語核心操作稿

閱讀選項為繁體中文（香港）、简体中文、English；旁白為獨立撰寫的粵語、普通話及英文場景稿。完整螢幕指令按所選閱讀語言切換，旁白只讀口語場景稿，不以普通話音色朗讀粵語文字。OpenMAIC 託管 TTS 關閉；未合成、未聽審的音訊不可標示可用。以下是本課完整核心操作包，不代表其餘教師規劃章節都要顯示給學生。

### 九場景：屏幕引導與獨立旁白

| 場景 | 繁中屏幕 | 简中屏幕 | English screen | 粵語口語 | 普通話口語 | English narration |
| --- | --- | --- | --- | --- | --- | --- |
| S1 委託 | 讓小怪獸變成能在模型中模擬放入、取出兩件文具的收納站。你設計，AI 操作 Blender。 | 让小怪兽变成能在模型中模拟放入、取出两件文具的收纳站。你设计，AI 操作 Blender。 | Turn the creature into a storage station where two stationery items can be simulated going in and out. You design; AI operates Blender. | 小怪獸今次要變身收納站喇！你諗造型同擺位，AI 負責喺 Blender 整；最後用模型模擬放入同拎出。 | 今天让小怪兽变成收纳站。造型和摆放由你决定，AI 负责操作 Blender，最后用模型模拟放入和取出。 | The creature is becoming a storage station. You choose its design and layout; AI operates Blender. Finally, simulate putting the items in and taking them out in the model. |
| S2 找問題／先說第一個想法（不計分） | 外形看起來夠大，但道具拿不出來。你會先看哪裏？也可以說「未能判斷」；不是考試、不計分，稍後再用檢查方法核對。 | 外形看起来够大，但道具拿不出来。你会先看哪里？也可以说“暂时不能判断”；不是考试、不计分，稍后再用检查方法核对。 | The container looks big enough, but the prop will not come out. What would you inspect first? “I can’t tell yet” is fine. This is not a test and is not scored; we will check later. | 外面睇落夠大，但件文具攞唔出，你會先睇邊度？答未肯定都得，唔計分，學完檢查方法再返嚟核對。 | 外面看起来够大，但文具拿不出来，你会先看哪里？说还不能确定也可以，不计分，学完检查方法再回来核对。 | The container looks big enough, but the prop will not come out. What would you inspect first? This is not scored; we will check again after learning the method. |
| S3 選擺法 | 決定兩件道具怎樣放；尺寸和方向要告訴 AI，不能先縮小道具。 | 决定两件道具怎样摆；把尺寸和方向告诉 AI，不能先缩小道具。 | Decide how to place both props. Tell AI their sizes and orientation; do not shrink them to make them fit. | 你先揀點樣擺兩件文具，講清楚尺寸同方向。唔可以偷偷縮細道具當成功。 | 先决定两件文具怎么摆，并说清尺寸和方向。不能偷偷缩小道具来算成功。 | Choose how to arrange both items and state their size and orientation. Do not shrink a prop to fake success. |
| S4 入口試驗 | 預測裝飾會否擋住入口；一次只改一個位置，保留道具尺寸。 | 预测装饰会不会挡住入口；一次只改一个位置，保留道具尺寸。 | Predict whether the decoration blocks the opening. Change one position at a time and keep prop sizes fixed. | 估吓個裝飾會唔會頂住個入口。一次只試一個位置，道具大細唔好改。 | 先猜装饰会不会挡住入口。一次只试一个位置，道具尺寸保持不变。 | Predict whether the decoration blocks the opening. Test one position at a time and keep prop sizes unchanged. |
| S5 建立 v01 | 指揮 AI 建立可編輯空盒、加入兩件道具並保存 v01；先看俯視和側視。 | 指挥 AI 建立可编辑空盒、加入两件道具并保存 v01；先看俯视和侧视。 | Direct AI to build an editable open box, add both props, and save v01. Inspect top and side views first. | 而家叫 AI 起一個可編輯嘅空盒，擺好兩件道具，存成 v01；先睇頂面同側面。 | 现在请 AI 制作可编辑的空盒，摆好两件道具并保存为 v01；先检查俯视和侧视。 | Ask AI to build an editable open box, place both props, and save v01. Start by checking the top and side views. |
| S6 同伴試拿 | 不先解說，請同伴看道具放入及取出的實際模擬；只記錄他指出的阻擋。 | 不先解释，请同伴看道具放入和取出的实际模拟；只记录他指出的阻挡。 | Without explaining first, show a peer the simulated insertion and removal. Record only the obstruction they identify. | 先唔好講你點諗，俾同學睇放入同拎出嘅模擬，記低佢實際見到邊度頂住。 | 先不要解释设计，让同伴看放入和取出的模拟，只记录他实际看到哪里受阻。 | Do not explain the design first. Show the insertion and removal simulation, and record the obstruction your peer actually notices. |
| S7 修訂 v02 | 選一個阻擋原因，指揮 AI 只改那一處；保存 v02，重做放入和取出檢查。 | 选一个阻挡原因，指挥 AI 只改那一处；保存 v02，重新检查放入和取出。 | Choose one cause of obstruction. Ask AI to change only that part, save v02, and retest insertion and removal. | 你揀一個真係頂住嘅原因，叫 AI 淨係改嗰度，另存 v02，再試放同拎。 | 你选一个真实的阻挡原因，请 AI 只改这一处，另存 v02，再重新测试放入和取出。 | Choose one actual cause of the obstruction. Ask AI to change only that part, save v02, then test insertion and removal again. |
| S8 展示 | 展示兩件道具怎樣進出，說明一個造型與功能的取捨。 | 展示两件道具怎样进出，说明一个造型与功能的取舍。 | Show how both props go in and out. Explain one design trade-off between appearance and function. | 示範兩件道具點樣放入同拎返出嚟，再講一個造型同功能之間嘅取捨。 | 展示两件道具如何放入和取出，再说明一个造型与功能之间的取舍。 | Demonstrate how both props enter and leave, then explain one trade-off between appearance and function. |
| S9 遷移 | 換成 118 mm 模擬筆：指出原來哪項檢查要重做。數碼通過不等於真實可用或安全。 | 换成 118 mm 模拟笔：指出原来哪项检查要重做。数字模型通过不等于真实可用或安全。 | Try a 118 mm simulated pen. Which check must be repeated? A digital pass does not prove real-world usability or safety. | 換一支 118 mm 嘅模擬筆，你估邊個測試要重做？數碼模型過到，唔代表真實用落安全。 | 换成一支 118 毫米的模拟笔，你认为哪项测试要重做？数字模型通过不代表真实使用安全。 | Try a simulated 118 mm pen. Which test should you repeat? Passing in a digital model does not prove real-world safety. |

### 核心互動、回饋、AI 指令及評量

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 放入測試：先選擺法。請 AI 保持筆 90×8×8 mm、橡皮擦 30×20×10 mm，按我的指示擺放；輸出俯視和側視。 | 放入测试：先选择摆法。请 AI 保持笔 90×8×8 毫米、橡皮擦 30×20×10 毫米，按我的指示摆放；输出俯视和侧视。 | Insertion test: choose a layout. Keep the pen at 90×8×8 mm and the eraser at 30×20×10 mm. Place them as I direct, then export top and side views. |
| 回饋：外部尺寸夠，不代表內部沒有裝飾阻擋。你在圖中看到哪件道具碰到甚麼？ | 反馈：外部尺寸够，不代表内部没有装饰阻挡。你在图中看到哪件道具碰到了什么？ | Feedback: enough outer space does not guarantee a clear interior. Which prop appears to touch what in the view? |
| 再試：只暫時隱藏指定裝飾，使用相同道具位置再看；檢查後要把裝飾顯示回來。 | 重试：只暂时隐藏指定装饰，用相同道具位置重新查看；检查后要把装饰显示回来。 | Retry: temporarily hide only the named decoration and inspect the same prop positions. Restore it after checking. |
| 取出測試：請 AI 從實際位置逐件模擬沿頂部取出；輸出起點、中途和終點。只看首尾圖不能證明全程沒有穿越。 | 取出测试：请 AI 从实际位置逐件模拟从顶部取出；输出起点、中途和终点。只看首尾图不能证明全程没有穿越。 | Removal test: ask AI to simulate removing each prop from its actual position through the top. Export start, middle, and end. Start/end views alone cannot prove a clear path. |
| 回饋：物件放得入，不等於拿得出。請指出哪個部件阻住哪件文具的路徑。 | 反馈：物件放得进去，不等于拿得出来。请指出哪个部件挡住了哪件文具的路径。 | Feedback: fitting an item inside does not mean it can come out. Identify which part blocks which prop's path. |
| 再試：請 AI 只把該裝飾移向外側，保留原尺寸，再檢查 130×90 mm 範圍，重做放入和取出。 | 重试：请 AI 只把该装饰移向外侧，保持原尺寸，再检查 130×90 毫米范围，重新测试放入和取出。 | Retry: ask AI to move only that decoration outward, keep the original sizes, check the 130×90 mm footprint, and retest insertion and removal. |
| 修訂指令：道具[名稱]在[位置]碰到[部件]。我選擇[移動裝飾／改擺法]。請保持道具尺寸，只改這一項，保留 v01，另存 v02，再檢查放入和取出。 | 修改指令：道具[名称]在[位置]碰到[部件]。我选择[移动装饰／改变摆法]。请保持道具尺寸，只改这一项，保留 v01，另存 v02，再检查放入和取出。 | Revision request: The [prop] at [position] touches [part]. I choose to [move the decoration/change the layout]. Keep prop sizes fixed, change only this item, preserve v01, save v02, and retest insertion and removal. |
| 評量四項：模型可重開且中空；按原尺寸安置兩件道具；能說明數碼目視檢查的限制；按具體問題完成一項修訂。每項 0–2；建議 6/8，非官方標準。 | 评价四项：模型可重新打开且内部中空；按原尺寸摆放两件道具；能说明数字模型目视检查的限制；根据具体问题完成一项修改。每项 0–2；建议 6/8，不是官方标准。 | Four checks: the model reopens and is hollow; both props remain at their specified sizes; you explain the limits of visual digital inspection; and you make one revision for a specific issue. Score 0–2 each; 6/8 is a suggestion, not an official standard. |
| 操作告知：這是課堂數碼模型，不是產品測試、人體工學或安全認證。校方確認年齡條款、資料流、權限和教師監督前，不輸入姓名、人臉、聲音、帳號、學校平面圖或家庭位置，不執行 AI 工具。 | 操作告知：这是课堂数字模型，不是产品测试、人体工学或安全认证。学校确认年龄条款、数据流、权限和教师监督前，不输入姓名、人脸、声音、账号、学校平面图或家庭位置，不运行 AI 工具。 | Use notice: this classroom digital model is not product testing, ergonomics, or a safety certification. Until the school checks age terms, data flow, permissions, and teacher supervision, do not enter names, faces, voices, account details, school floor plans, or home locations, and do not run AI tools. |
| 介面欄位：我的擺法／道具尺寸／預測的阻擋／實際觀察／修訂理由／複製給 AI／保存 v01／保存 v02／提交作品。 | 界面字段：我的摆法／道具尺寸／预测的阻挡／实际观察／修改理由／复制给 AI／保存 v01／保存 v02／提交作品。 | Interface fields: My layout / Prop sizes / Predicted obstruction / Actual observation / Reason for revision / Copy to AI / Save v01 / Save v02 / Submit work. |

| 評量分檔：0＝尚未展示；1＝能展示但需要提示；2＝能獨立展示並解釋。作品可重開和實際完成修訂兩項均須高於 0；四項建議至少 6/8。此為本課檢視建議，不是官方標準。 | 评价分档：0＝尚未展示；1＝能展示但需要提示；2＝能独立展示并解释。作品可重开和实际完成修改两项都必须高于 0；四项建议至少 6/8。这是本课检查建议，不是官方标准。 | Scoring: 0 = not shown; 1 = shown with prompting; 2 = independently shown and explained. The reopenable-work and completed-revision checks must both score above 0; a suggested total is at least 6/8. This is a lesson suggestion, not an official standard. |

### 完整 AI 建模請求（三種畫面語言）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 我選的收納造型是：[填寫]；兩件文具擺法是：[填寫]。請在 Blender 4.5 LTS 用公制、Unit Scale＝1，建立可編輯空盒：底板 120×80×3 mm；前後壁各 120×3×32 mm；左右壁各 3×74×32 mm。加入分開命名的筆 90×8×8 mm 和橡皮擦 30×20×10 mm，保持原尺寸，按我的擺法放置。展示頂視及側視，標明目前只是數碼目視檢查，不宣稱精密無碰撞、實物好拿、打印可用或安全。只在本課資料夾保存 v01，不覆蓋檔案；先停下等我檢查。若不能真正操作 Blender 或保存 .blend，請明說，不得以圖片冒充。 | 我选的收纳造型是：[填写]；两件文具的摆法是：[填写]。请在 Blender 4.5 LTS 中使用公制、Unit Scale＝1，建立可编辑空盒：底板 120×80×3 毫米；前后壁各 120×3×32 毫米；左右壁各 3×74×32 毫米。加入分别命名的笔 90×8×8 毫米和橡皮擦 30×20×10 毫米，保持原尺寸，按我的摆法放置。展示俯视和侧视，说明目前只是数字模型目视检查，不宣称精确无碰撞、实物好拿、可打印或安全。只在本课文件夹保存 v01，不覆盖文件；先停下等我检查。如果不能真正操作 Blender 或保存 .blend，请说明，不得用图片冒充。 | My storage design is [my choice], and my prop layout is [my choice]. In Blender 4.5 LTS, use metric units and Unit Scale = 1 to build an editable open box: base 120×80×3 mm; front and back walls each 120×3×32 mm; left and right walls each 3×74×32 mm. Add separately named props: a 90×8×8 mm pen and a 30×20×10 mm eraser. Keep their sizes fixed and place them as I direct. Show top and side views. State that this is only visual inspection of a digital model; do not claim precise collision clearance, real-world usability, printability, or safety. Save v01 only in this lesson folder without overwriting files, then stop for my review. If Blender cannot actually be operated or a .blend cannot be saved, say so; do not substitute an image. |

### 求助卡（三種畫面語言）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 筆看起來比盒短，卻放不下：比較可用內長和道具長度；本例直放空間是 114 mm。若斜放，重新檢查整條路徑，不可直接判通過。 | 笔看起来比盒短，却放不下：比较可用内长和道具长度；本例直放空间是 114 毫米。如果斜放，要重新检查整条路径，不能直接判定通过。 | The pen looks shorter than the box but does not fit: compare usable inner length with prop length. This example has 114 mm of straight inner space. If angled, recheck the whole path; do not assume it passes. |
| 看不見內部：請 AI 暫時隱藏一面牆並輸出視圖；檢查後要顯示回來，不要刪牆冒充原作品。 | 看不到内部：请 AI 暂时隐藏一面墙并输出视图；检查后要显示回来，不要删除墙来冒充原作品。 | Interior not visible: ask AI to temporarily hide one wall and export a view. Restore it after checking; do not delete the wall and present that as the original. |
| 尺寸大／小了一千倍：請 AI 顯示場景單位、Unit Scale 和輸入值；每個尺寸都要標 mm。 | 尺寸大／小了一千倍：请 AI 显示场景单位、Unit Scale 和输入值；每个尺寸都要标毫米。 | Scale is off by a factor of 1,000: ask AI to show scene units, Unit Scale, and input values. Label every dimension in mm. |
| AI 做成實心：先回到底板加四面壁的空盒版，輸出剖視確認，再加入造型。 | AI 做成了实心：先回到“底板＋四面墙”的空盒版，输出剖视确认，再加入造型。 | AI made it solid: return to the hollow base-and-four-walls version, export a section view to check, then add the design features. |

四張求助卡、完整評量分檔、建模指令及課堂安全告知均為學生可見材料，三種閱讀語言必須完整替換。這些文案已經獨立審核；詳盡口語稿仍須合成、試聽，§14 瀏覽器語言切換與鍵盤輔助使用亦未做 runtime QA。

獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS。§14 的真瀏覽器語言切換、欄位狀態保留與輔助科技測試仍未做；粵語、普通話、英文場景稿尚未合成或人耳驗收。此 PASS 不代表音頻、OpenMAIC 成品或學生端 runtime 通過。

## 17. OpenMAIC 原生組件藍圖（生成輸入範圍）

結構原型 `pbl-studio`。最終組裝須由 S1 的 OpenMAIC PBL v2 工作台啟動九階段同一項目；調查、簽名互動、評議、修訂和展示頁只是支架，學生須把可核對結果提交回對應里程碑。S2 為不計分起點；本課不設獨立 quiz。托管生成只負責短引導與角色候選；複雜互動、項目狀態及工作台採確定性本地組裝與測試。托管生成不得生成 interactive HTML、PBL 工作區或 JavaScript；web search、image/video generation、hosted TTS 關閉；不得假稱 Blender 已執行。

本機確定性 I1「入口及取放測試」記錄學生選擇的分區／拿取方式及 AI 操作者執行後的真實取放結果；I2「單一分區修訂」只改一項擺放，保留其餘條件並用同角度重試。回饋指出入口、尺寸或取用證據缺口，不把創意選擇當唯一答案。

生成候選僅供教師審閱，不接入學生網站、不含學生個人資料；生成課堂連結可能可由持有連結者打開，審核通過前不分享。工作台指令不連模型、不操作 Blender；校方核驗供應商、年齡條款、權限和資料流前不開放學生工具活動。G2 批准後逐課只提交一次，生成不等於 import／release 通過。
