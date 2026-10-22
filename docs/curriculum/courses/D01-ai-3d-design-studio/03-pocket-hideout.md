# D01-03｜口袋秘密基地

版本：v0.4.2 課時定義澄清｜2026-09-28｜design SHIP（97.5/100，僅進入 generation-prep）；播放器與校內時長未實測，尚未生成／發布。
角色分工修訂：學生負責設計選擇、自然語言指令、觀察與驗收；AI 操作者負責 Blender 內所有建模、移動、測試、保存及視圖輸出。學生不直接操作 Blender。下文若出現「移動／試走／調整」，均指學生指揮 AI 執行並檢查結果。
對象：中一至中二；小五至小六做開放式單房。目標完整學習路徑約 30 分鐘；這是包括校內 AI-Blender 操作的總時長目標，不是 OpenMAIC 播放時長，播放器時長尚未知。
工具：Astra（GPT-6 Astra）＋具本機工具能力的 Codex；Blender 4.5 LTS。帳號、訂閱、設備與接駁由學校負責。

## 1. 一個藏得住驚喜、又進得去的基地

S-01 原創委託：「你的小角色要一個休息、收藏寶物、招呼朋友的地方。基地只有一塊小平台，別人能找到入口和寶物嗎？」

驅動問題：怎樣用有限空間造一個有個性、看得懂、走得通的基地？同伴是首次到訪者，不先聽設計師解說，先說自己會從哪裏進去。

**使用者起點：**先問一位同伴「第一次到這個幻想基地，你最想先找到甚麼？」用匿名答案決定一項用途或驚喜，再以無提示首次試看檢查入口；這是個人設計 brief，不推廣成校園空間需求。

**必交：一個可編輯微型基地 .blend，至少三種用途的小區域、入口、可示範的角色路線，俯視／入口圖和 v01／v02。** 最低只做一間無頂開放房＋三件道具，不做整棟城堡。學生選基地主題、空間怎樣分、驚喜藏在哪裏；紙上平面圖只是輔助，不能作主要產出。
核心版限一間無頂空間、入口、三個用途點和一條角色路線；額外房間／道具屬延伸，不計入 30 分鐘核心承諾，也不能替代可重開基地與前後版本。

**本課學習目標：**（1）按角色大小和場景視圖，指出路線最窄處或視線被遮擋處；（2）提出一項可檢查的布局假設，指揮 AI 在 Blender 保持角色尺寸與其餘條件不變，只改入口、家具或線索中的一項；（3）用同一條路線／同一觀眾視角比較 v01 與 v02，說明修改解決了甚麼、仍有甚麼未驗證。達標證據包括路線視圖、同伴首次反應、學生指令與改版理由。

可用幻想外太空、圖書樹屋或海底小站，不提供真實家居／學校資料。這是玩具空間設計，不是建築或消防課。

## 2. 起點、尺度和真正要做的事

M-01：底板 12×10、角色寬 1 高 2，均為本課相對場景單位，不是米或建築標準。可用圓柱加球體作角色；若沿用前課角色，先在副本調整到同一尺度，不更改原作。

M-02 低門檻佈局：底板中央為 (0,0)，負 Y 為入口側；後側放一片牆；休息墊中心 (-3,2)、尺寸 3×2；寶物箱中心 (3,2)、尺寸 2×2；招呼朋友的小平台中心 (0,-2)、尺寸 2×2。牆、地板和家具分件，保持開頂可看內部。例子只是可起步擺位，路線與視覺效果仍須實際測試，不能預判通過。

創作：學生選主題與問題 → 指揮 AI 建地板、三件道具、入口及角色路線 → AI 保存 v01 → 同伴找路 → 學生要求 AI 只改一個障礙或視覺線索並保存 v02。調查問題由學生選：「入口移到側面會怎樣？」或「把箱放中央會怎樣？」一次只改一項，再比較 AI 輸出。

## 3. structureContract｜小基地工作坊

`archetype: pbl-studio`。

表內分鐘均為待驗證的學習路徑 timebox，不是保證完成時限；超時可延續同一作品，不得刪作品產出、觀眾評議或修訂。

| 場景 | 環節／組件 | 學習路徑分鐘 | 學生動作與證據 |
| --- | --- | ---: | --- |
| L03-S1 | PBL 項目主線／驅動問題與作品簡報 | 2 | 進入 PBL v2 工作台，以「角色能否穿過基地路線」為主線，保存同一空間設計的九階段證據 |
| L03-S2 | 準備度／不計分起點 | 1 | 看角色與窄位情境，說第一個想法或「未能判斷」；不計分，記入項目起點 |
| L03-S3 | 按需概念支架 | 2 | 需要時參考角色實際寬度、入口、轉向和最窄處的檢查方法，再回到項目 |
| L03-S4 | 簽名互動／基地路線檢查 | 3 | 選入口和目的地，預測窄位結果並取得可見回饋 |
| L03-S5 | 調查／AI 原型指令 | 8 | 指揮 AI 建基地 v01，輸出俯視和斜視，查看角色實際寬度及路線證據 |
| L03-S6 | 同伴評議／證據缺口 | 3 | 挑戰只看平面線條便聲稱可通過的推論，提出尺度或路線檢查 |
| L03-S7 | 學生修訂／v01→v02 | 6 | 由學生決定只改一項，核對入口、最窄處或布局的版本差異 |
| L03-S8 | 作品展示／證據交付 | 3 | 在同一 PBL 項目提交入口、目的地、角色尺度和實際測試證據 |
| L03-S9 | 反思遷移 | 2 | 角色變寬後指出第一個要重查的位置、要改的決定和所需證據 |

PBL 項目主線：OpenMAIC PBL v2 工作台在 S1 開場，按序保存驅動問題、準備度、簡報、調查、原型、評議、修訂、展示和遷移九個里程碑；互動頁只作項目支架，結果需提交回對應里程碑。六功能：目標／成果與驅動問題 S1；激活 S2；主動建構 S4/S5；反饋修訂 S6/S7；評量證據 S1 項目記錄及 S5–S8；遷移 S9。全課不放獨立答案測驗。30 分鐘仍是未經試教的整體路徑目標。

## 4. interactionContract｜走得到、看得懂

**課堂邊界：**以下 I1／I2 是課堂中由學生提出設計決定、教師監督、AI 操作者在 Blender 執行的工作流，不是現有 OpenMAIC 播放器內的 Blender 互動；學生不操作 Blender 介面。

### I1｜帶客人走一遍〔簽名互動〕

學生指揮 AI 沿自己選的路線移動角色並保持相同尺寸；state＝learnerPrompt、layoutTransforms、avatarWidth、routeWaypoints、obstacleLocation。AI 輸出可見角色與家具、入口或牆相交／被擋，或順着路線走到目標。

錯例 M-03：俯視只畫一條線穿過兩件家具間，角色卻比間隙寬。反饋：「線沒有寬度，你個角色有。」第二提示：把角色停在最窄處，用俯視和斜視看左右邊。重試可移家具、改入口或改路，不可偷偷縮角色。證據：最窄處的前後圖與示範。只抽查幾點不能保證全路徑不相交；不生成現實通行或安全標章。

### I2｜第一次來，睇唔睇得明？

學生給同伴入口視圖，不先展示俯視答案；記下同伴猜入口和目標的位置，再改一個布局線索；state＝entranceCue、firstLookGuess、cameraView、revisedLayout。可見結果是視線和遮擋改變。

錯例：寶物在正中央却被高櫃完全遮住，設計師以為「在中間」就看得見。反饋：「從這個位置，你的觀眾先看到的是甚麼？」第二提示：只減高櫃高度或移向一側，其他佈局不動。重試讓另一位同學看相同視角；反應須如實記錄，不能保證一定猜對。證據：兩版入口圖和觀眾原話；若有意藏寶，須給能實際發現的線索，不要求全部一眼可見。

## 5. 即用即走的小提示

- 模型很靚但角色太大：放一個共同尺度角色，再比較家具，不先講比例公式。
- 頂部擋住看不到：保留無頂剖視；不是要求蓋完屋頂才准參觀。
- 怎樣表達入口：可改位置、朝向、開口或形體，不能只靠顏色；從觀眾位置看一次。
- 不知怎樣移路：先移一件障礙，重試原路。不要讓 AI 一次重造全場，否則看不出哪項修改有效。

每段操作說明 30–90 秒，完成即回到基地；全課單向講解上限 8 分鐘。

## 6. Astra 請求

```text
請幫我做可編輯的微型基地粗模，不是現實建築設計。
主題：[自己的主題]；三區位置：[自己的選擇]；驚喜：[自己的選擇]。
用本課 M-01 相對尺度，底板 12×10，角色寬1高2。
先做地板、後牆及三件簡單道具，不做屋頂、精細貼圖或整棟樓。
保留分開命名的物件，展示俯視和入口視圖，依我的路線指令在 Blender 模擬角色行走；不要要求我操作 Blender。
只在本課資料夾保存 v01，不自動宣稱路線通過或符合建築規範。
```

修訂請求：「同伴在［位置］遇到［問題］。我選擇移動［物件］到［方向］，其餘不改；保留角色尺寸，請另存 v02 並按相同路線重新模擬。」學生作出具體布局決策並檢查 AI 輸出，不直接擺家具或移動角色。

## 7. 驗收方式

四項各 0–2：教師／AI 操作者確認小場景可重開；三種用途有學生作的布局選擇；學生能解讀 AI 模擬路線並指出局限；按觀眾反饋指揮 AI 修訂一次。0 未見、1 需協助、2 能展示並說明；建議 6/8，場景與修訂不得 0。模型有錯但能定位、再指揮 AI 修正，優於漂亮但無法解釋。

遷移：把角色寬由 1 改為 1.5，學生選最可能出問題的一段並試；沒有指定唯一正確家具。不能說所有大角色都走不通，也不能只沿用前次結論。

## 8. 支架與設計簽名

高小只做開放平台三區，不需牆上挖門；初中加入一面遮擋牆與入口；進階設計兩條不同路線並比較。慢組不要取消 AI 路線模擬，減掉裝飾便可。兩人輪換「AI 指令者／首次訪客」，每人至少提出並驗收一次修改。

高小必做：依角色卡和三區卡選布局，使用句框指揮 AI 跑一條路線；初中必做：自行提出「只改一項」的路線或視線假設，指定相同起終點比較。每人留一條自己的指令、一處被擋／可見證據及理由；可口述、指圖或用語音轉文字，教師記錄而不代答。

AI 老師追問訪客體驗；助教查尺度和選取；AI 同學提「我行條線就一定過到」的誤解。真正訪客判斷由同伴提供。

`designSignature`：微型開放場景、俯視／角色視角切換、路線與遮擋。與已發布 T02-01 相比，互動為佈局／視線而非感知閾值，版式是俯視加入口而非規則鏈，作品為基地場景而非規則卡；與 D01-02 的文具物件插取不同。禁用真實學校平面圖、完整建築規範宣稱、只有一條裝飾路線而沒有角色實試。可共用播放器，不複用雷達皮膚。

## 9. 畫面與口語分軌

- 畫面：俯視圖走得通，從入口看也走得通嗎？
- 粵語：喺上面睇好似行得通喎，咁落返入口嗰個角度呢？帶你個小角色行一次，睇吓邊度會頂住。
- 普通話：从上面看好像能走通，换到入口视角呢？带着你的小角色走一遍，看看哪里被挡住。

繁中、简中、English 學生閱讀文案及粵語、普通話、英文獨立旁白稿已完成；獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS（見 §15 及總審核）。音頻尚未合成、試聽或接入播放器；粵語目標語速 1.2 倍，只在一層加速。靜音可完成任務，不用普通話讀粵語文案，也不在缺音軌時跨語種替代。

## 10. 作品交接、私隱與保存

開課前置：須遵守[系列未成年人課堂工具與資料保護協議](00-series-index.md#52-未成年人課堂工具與資料保護前置協議)，由校方確認年齡條款、資料流、工作站權限、教師監督與回滾；文件內 prompt 不是系統安全控制。任一條件未確認，就不收學生輸入、不執行 Blender 工具，並如實標示實作未完成。

`portfolioInput`：可帶自己的角色；沒有也可用圓柱加球體重建小角色，不能要求已有模板。
`portfolioOutput`：基地場景 v01／v02 .blend、俯視路線圖、入口視圖、一次按觀眾意見改路或移家具的證據。
`nextUse`：作第四課小劇場的簡單背景或第六課其中一個展品；兩者都不是必需前置。
`conceptRevisit`：相對尺度、空間分區、視角和遮擋；路線不能只在紙上成立。

本課檔名用 `G03_D01_L03_v01.blend`、`v02.blend`；圖片同前綴。只能操作本課指定資料夾，保留舊版，不覆蓋他人作品。提示詞不是權限沙箱；學校事前限制檔案及工具權限，不執行來源不明腳本、不關閉安全防護、不裝未知插件。AI 出錯保留錯誤、回復可用版；未完成就如實標記，不編造已生成或測試成功。

只用組別代號，不上傳學生姓名、人臉、聲音、學校平面圖、帳號畫面或家庭位置。文字、角色、形體與示意圖全部原創，不使用官方圖文、供應商示範作品或品牌角色。M 是課堂設定，S 是虛構任務，均不可代表香港現況；實際觀察另記，不能預填。成果是數碼創作／概念，不作工程安全、打印可用性或專業用途保證。

## 11. 一手研究依據與準確性邊界

核對快照：2026-09-22（沿用前版官方資料，場景數字為本課 M 設定）。

1. [Blender Transform](https://docs.blender.org/manual/en/4.5/scene_layout/object/properties/transforms.html) → R-01：物件的變換及尺寸可獨立編輯，實際相交要在場景檢查。
2. [Blender Units](https://docs.blender.org/manual/en/4.5/scene_layout/scene/properties.html) → R-02：須約定單位與尺度；本課玩具比例不直接對應真實建築。
3. [OpenAI Astra 案例](https://developers.openai.com/blog/architectural-visualization-with-astra) → 工具協作可編輯場景的流程背景；不提供建築安全認證。
4. [Blender 腳本安全](https://docs.blender.org/manual/en/4.5/advanced/scripting/security.html) → 外部工具的權限要求。

以上只作研究依據，教學表述與視覺重新創作。軟件行為有來源，不代表本課提示詞、學校電腦效能、約 30 分鐘完成率或學生興趣已驗證。不可把 M 示例或 AI 回答寫成實測結果。

## 12. OpenMAIC 單課製作指令

本課約 30 分鐘只指整條學習路徑（OpenMAIC 引導＋校內受監督 AI-Blender 活動）的設計目標；不得將其當成播放器 runtime。課件生成後分別計量播放器活動時間和課內工具活動的實際總時間；未計時試教前不公開承諾 30 分鐘。

只製作 D01-03「口袋秘密基地」的候選引導，一課一文檔；不得生成其餘課或把本稿 13 節逐節朗讀。以第 1 節任務和作品開場，九場景採 `pbl-studio`。約 30 分鐘是全程學習路徑目標，不是 OpenMAIC 播放 runtime；課件生成後另測玩家活動時間，校內試教另測端到端總時長，兩者未取得證據前不得對外承諾 30 分鐘。最多兩張短說明頁，單次救援提示最長 90 秒，全課單向講解設計上限 8 分鐘。時間尚待學校設備計時試教；如生成超時，允許同一作品跨課延續，不刪產出、評議或修改。

託管只做原創引導、按需提示和教練式討論候選。模型、動畫和投影必須在 Blender 真正執行；不讓學生按「完成」後就自動判通過。可編輯工作區的來源是本機 .blend；未來網站狀態或提交組件需另做確定性實作與驗證，不聲稱播放器已接通 Blender。

功能：Web 關（資料閉合）；image 關（教學關鍵圖須來自實際原創模型）；生成 video 關（不冒充 Blender 輸出）；託管 TTS 關（後續獨立語軌）；agents／discussion 開候選（各有任務，不能替學生選）；quiz 僅保留操作中誤區和離堂遷移，不作理論考試；interactive／PBL 保留真實作品編輯與返工，不以通用選擇題代替。學生可見工具名稱，不出現密鑰、帳號設定、供應商選擇器或作者導航。

## 13. 教師開課檢查與未完成門檻

- 課前在學校電腦真正重建本課 M 起點，確認檔案能重開；本稿沒有附上已完成 .blend 資產。
- 確認電腦＋滑鼠和 Astra 工具接駁；手機能看任務不等於能建模。老師若只能投影示範，不宣稱學生完成個人實作。
- 示範只到最小粗模；學生必須保留自己的選擇、指揮 AI、同伴測試及一次由 AI 執行的作品修訂；不能以學生手動操作 Blender 代替 AI 操作目標。
- 本課的 AI 操作者必須實際在 Blender 建場景並按指令模擬路線；若工具鏈不可用，記錄未完成及阻礙，不改成學生手動移動角色或家具。
- 卡住先縮減細節或修局部；不能用生成圖片、填表或聽講替代本課作品。若素材／設備不合格，先完成準備，不虛報通過。
- 設計階段獨立重評為 97.5/100、`SHIP`（僅進入 generation-prep）；學生未實操驗證、未試教，尚無 generation manifest／G2 授權。不得把設計 `SHIP` 當作 OpenMAIC 提交或網站發布許可。

## 14. 可訪問性與窄屏完成規格（待成品測試）

- 核心路徑不使用拖放或只靠顏色／聲音的提示；角色尺度、入口、路段和視線選擇可用原生表單及鍵盤完成，Tab／Shift+Tab／Enter／Space 可走完，焦點清楚可見，路徑回饋使用 `aria-live` 宣讀。
- 390×844 手機版採單欄：路線圖可切換入口、中段和出口局部文字描述／圖片，長圖不縮到無法辨讀，觸控目標至少 55px，不要求橫向捲動。手機可完成路線假設、指令草擬、AI 輸出檢查記錄和遷移；Blender 由校方工作站上的 AI 操作者執行，學生不須在手機操作 Blender。
- 尺度與障礙物以文字／標記共同表達；M 模型只供設計試查，不把幾條抽查線冒充全路徑驗證。尊重放大與減少動態偏好，無圖像時保留完整文字任務。
- 待驗收：桌面與 390×844 真瀏覽器各完成「預測路線—複製 AI 指令—讀取入口及中段檢查—記錄失敗位置—提出修訂—遷移」；鍵盤重走相同路徑，檢查焦點、標籤、朗讀回饋與控制台。此規格不是成品已通過的證據。

## 15. D01-03 九場景六軌閱讀稿與三語操作稿

閱讀選項：繁體中文（香港）、简体中文、English；旁白是分開撰寫的粵語、普通話和英文場景稿。完整指令留在畫面並隨閱讀語言切換，不由另一種音色代讀。OpenMAIC 託管 TTS 關閉；下列都是未審文案，並非音頻。

### 九場景六軌引導

| 場景 | 繁中屏幕 | 简中屏幕 | English screen | 粵語口語 | 普通話口語 | English narration |
| --- | --- | --- | --- | --- | --- | --- |
| S1 委託 | 為小角色設計一個找得到入口、看得見驚喜的迷你基地。你設計，AI 操作 Blender。 | 为小角色设计一个找得到入口、看得见惊喜的迷你基地。你设计，AI 操作 Blender。 | Design a tiny hideout with a findable entrance and a visible surprise. You design; AI operates Blender. | 幫你個小角色起個迷你基地啦！入口要搵到，驚喜又要睇得到；你揀設計，AI 操作 Blender。 | 给小角色设计一个迷你基地，入口要找得到，惊喜也要看得见。由你作决定，AI 负责操作 Blender。 | Design a tiny hideout for your character. Make the entrance findable and the surprise visible. You decide; AI operates Blender. |
| S2 先說第一個想法（不計分） | 地上有路線，但角色比最窄的空位寬。你覺得走得通嗎？也可以說「未能判斷」；不計分，稍後用尺度檢查。 | 地上画了路线，但角色比最窄的空位宽。你觉得走得通吗？也可以说“暂时不能判断”；不计分，稍后用尺度检查。 | A route is drawn, but the character is wider than the narrowest gap. Do you think it can pass? “I can’t tell yet” is fine; this is not scored. | 地上畫咗條路，但角色闊過最窄個位，你估行唔行到？答未肯定都得，唔計分，之後用尺寸核對。 | 地上画了路线，但角色比最窄处还宽，你觉得走得通吗？回答还不能确定也可以，不计分，之后用尺寸核对。 | A route is drawn, but the character is wider than the narrowest gap. Can it pass? This is not scored; we will check with measurements later. |
| S3 分區 | 選休息、收藏、招呼朋友三個用途區，再決定入口和驚喜。 | 选休息、收藏、招待朋友三个用途区，再决定入口和惊喜。 | Choose zones for resting, keeping treasures, and greeting friends; then place the entrance and surprise. | 揀三個地方畀佢休息、收藏同招呼朋友，再諗入口同驚喜放邊。 | 选三个区域让它休息、收藏和招待朋友，再决定入口和惊喜放在哪里。 | Choose three areas for rest, treasures, and greeting friends. Then place the entrance and surprise. |
| S4 先猜 | 如果把箱子移到中央，角色路線或視線會怎樣？一次只改一項。 | 如果把箱子移到中央，角色路线或视线会怎样？一次只改一项。 | What might change if the box moves to the centre? Change one thing at a time. | 如果將箱移去中間，你估條路或者視線會點變？一次只試一樣。 | 如果把箱子移到中间，你猜路线或视线会怎样变化？一次只试一个改动。 | What might happen to the route or view if the box moves to the centre? Test one change at a time. |
| S5 建基地 | 指揮 AI 建一間開頂房、入口、三件道具和角色，保存可編輯 v01。 | 指挥 AI 建一间开放顶面的房间、入口、三件道具和角色，保存可编辑 v01。 | Direct AI to build an open-top room, entrance, three props, and a character. Save editable v01. | 叫 AI 起個冇頂嘅房間，加入口、三件道具同角色，存成可編輯嘅 v01。 | 请 AI 制作一间没有屋顶的房间、入口、三件道具和角色，保存为可编辑的 v01。 | Ask AI to build an open-top room, entrance, three props, and a character, then save editable v01. |
| S6 訪客試走 | 不解說，請同伴從入口視圖找入口，再找到指定道具。 | 不解释，请同伴从入口视图寻找入口，再找到指定道具。 | Without an explanation, ask a peer to find the entrance and a chosen prop from the visitor view. | 先唔好解說，俾同學由入口個角度搵入口，再搵指定道具。 | 先不要解释，让同伴从访客视角找入口，再找指定道具。 | Do not explain first. From the visitor view, ask a peer to find the entrance and a chosen prop. |
| S7 修訂 | 記錄同伴實際遇到的阻擋；選一項修改，請 AI 保存 v02 並按原路重試。 | 记录同伴实际遇到的阻挡；选择一项修改，请 AI 保存 v02 并按原路线重试。 | Record an actual obstruction. Choose one change, ask AI to save v02, and retry the same route. | 記低同學真係撞到邊度，揀一樣要改嘅，叫 AI 存 v02，再行返同一條路。 | 记录同伴实际遇到的阻挡，选择一项修改，请 AI 保存 v02，再按同一路线重试。 | Record the obstruction your peer actually encountered. Choose one change, ask AI to save v02, and retry the same route. |
| S8 展示 | 展示俯視與入口視圖，說明修改改善了甚麼、仍未證明甚麼。 | 展示俯视和入口视图，说明修改改善了什么、仍未证明什么。 | Show top and entrance views. Explain what a revision improved and what it did not prove. | 一齊睇頂面同入口視圖，講吓今次改好咗乜，仲有乜未試到。 | 展示俯视图和入口视图，说明这次修改改善了什么，还有什么没有验证。 | Show the top and entrance views. Explain what improved and what remains untested. |
| S9 遷移 | 角色寬度改為 1.5：選一處窄位，指揮 AI 重新試走。 | 角色宽度改为 1.5：选择一处窄处，指挥 AI 重新模拟路线。 | Increase character width to 1.5. Choose a narrow point and ask AI to retry the route. | 角色闊度加到一點五，你揀個最窄位，叫 AI 再行一次睇吓。 | 把角色宽度改为 1.5，选一个最窄的位置，请 AI 再模拟一次路线。 | Increase the character's width to 1.5. Pick a narrow point and ask AI to test the route again. |

### 學生操作文字（三種畫面語言）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 路線檢查：角色保持寬 1、高 2。請 AI 按我的路線逐點移動，輸出最窄位置的俯視和斜視。路線線條沒有寬度；抽查不代表全路線無碰撞或現實安全。 | 路线检查：角色保持宽 1、高 2。请 AI 按我的路线逐点移动，输出最窄位置的俯视和斜视。路线线条没有宽度；抽查不代表全路线无碰撞或现实安全。 | Route check: keep the character 1 unit wide and 2 high. Ask AI to move it along my waypoints and export top and oblique views at the narrowest point. A route line has no width; spot checks do not prove a collision-free or real-world safe route. |
| 回饋：線條穿過去了，但角色比線寬。把角色停在最窄處，看左右是否留有空間。再試：角色尺寸不變，只移一件家具或改入口，沿同一路線輸出。 | 反馈：路线线条通过了，但角色比线宽。把角色停在最窄处，检查左右是否有空间。重试：角色尺寸不变，只移动一件家具或改变入口，再按同一路线输出。 | Feedback: the route line passes, but the character is wider than the line. Stop it at the narrowest point and inspect both sides. Retry: keep its size fixed, move one piece of furniture or change the entrance, then export the same route. |
| 首次訪客：先只顯示入口視圖。請同伴說會從哪裏進、先看到甚麼；記錄真實回答，不預設他一定找得到。 | 首次访客：先只显示入口视图。请同伴说会从哪里进入、先看到什么；记录真实回答，不预设他一定找得到。 | First-time visitor: show only the entrance view. Ask a peer where they would enter and what they notice first. Record the actual response; do not assume they will find it. |
| 回饋：從訪客站的位置看，他第一眼見到甚麼？如果高櫃遮住寶物，這可能是刻意隱藏，也可能令線索消失；由你判斷。 | 反馈：从访客站的位置看，他第一眼会看到什么？如果高柜挡住宝物，这可能是刻意隐藏，也可能让线索消失；由你判断。 | Feedback: from the visitor's position, what do they see first? If a tall cabinet hides the treasure, that may be intentional—or it may hide the clue. You decide. |
| 再試：只降低高櫃或把它移到一側，其他物件不變；請第二位同學看相同入口視角，記錄他實際先看到甚麼。 | 重试：只降低高柜或把它移到一侧，其他物件保持不变；请第二位同学从相同入口视角观看，记录他实际先看到什么。 | Retry: lower the tall cabinet or move it to one side, leaving everything else unchanged. Ask a second peer to view from the same entrance angle and record what they actually notice first. |
| 修訂指令：同伴在[位置]遇到[阻擋／看不見線索]。我只想改[入口／家具／提示物]。保留角色尺寸和其他物件，另存 v02，按相同起點與路線重試。 | 修改指令：同伴在[位置]遇到[阻挡／看不见线索]。我只想改[入口／家具／提示物]。保持角色尺寸和其他物件不变，另存 v02，按相同起点和路线重试。 | Revision request: My peer met [an obstruction/missed cue] at [location]. I want to change only [the entrance/furniture/cue]. Keep the character size and other objects, save v02, and retry from the same start along the same route. |
| 求助：角色看起來太大時，放一個共同尺度參照物再比較，不要改角色尺寸；入口不明顯時可改位置、方向、開口或形體，不能只改顏色，要從訪客位置再看。 | 求助：角色看起来太大时，放一个共同尺度参照物再比较，不要改角色尺寸；入口不明显时可改位置、方向、开口或形体，不能只改颜色，并从访客位置再看。 | Help: if the character seems too large, add a shared scale reference rather than resizing it. If the entrance is unclear, change its position, direction, opening, or shape—not only its colour—and inspect again from the visitor's position. |
| 評量：場景可重開；分區、入口、驚喜由我選；我能說明路線抽查的限制；我按同伴實際反應修訂。0＝未展示、1＝需要提示、2＝能展示並解釋。可重開和實際修訂兩項不可為 0，四項建議至少 6/8；此為課堂建議，不是官方標準。 | 评价：场景可重新打开；分区、入口和惊喜由我选择；我能说明路线抽查的限制；我根据同伴的实际反应作出修改。0＝未展示、1＝需要提示、2＝能展示并解释。作品可重开和实际修改两项不能为 0，四项建议至少 6/8；这是课堂建议，不是官方标准。 | Review: the scene reopens; I chose the zones, entrance, and surprise; I explain the limits of a route spot-check; and I revised from an actual peer response. Score 0 = not shown, 1 = with prompting, 2 = shown and explained. Reopening and a real revision must score above 0; suggested total 6/8. This is not an official standard. |
| 安全告知：這是幻想小場景，不是建築、消防或無障礙設計。校方確認工具年齡條款、資料流、權限和監督前，不輸入姓名、人臉、聲音、帳號、真實家居或校園平面圖、家庭位置；遇未批准工具或未知腳本即停止並通知老師。 | 安全告知：这是幻想小场景，不是建筑、消防或无障碍设计。学校确认工具年龄条款、数据流、权限和监督前，不输入姓名、人脸、声音、账号、真实家居或校园平面图、家庭位置；遇到未经批准的工具或未知脚本立即停止并告诉老师。 | Safety notice: this is a fantasy scene, not architectural, fire-safety, or accessibility design. Until the school checks age terms, data flow, permissions, and supervision, do not enter names, faces, voices, account details, real home or school floor plans, or home locations. Stop and tell the teacher if a tool is unapproved or a script is unfamiliar. |
| 介面欄位：我的主題／三區安排／入口位置／我的預測／訪客實際回應／路線觀察／修訂理由／複製給 AI／保存 v01／保存 v02／提交作品。 | 界面字段：我的主题／三区安排／入口位置／我的预测／访客实际反应／路线观察／修改理由／复制给 AI／保存 v01／保存 v02／提交作品。 | Interface fields: My theme / Three-zone layout / Entrance / My prediction / Visitor's actual response / Route observation / Reason for revision / Copy to AI / Save v01 / Save v02 / Submit work. |

| 教師匿名採集的起點問題（展示給學生作設計 brief）：第一次來到這個幻想基地，你最想先找到甚麼？答案只供本組選用途／驚喜，不記姓名，不宣稱代表全班。 | 教师匿名收集的起点问题（展示给学生作为设计 brief）：第一次来到这个幻想基地，你最想先找到什么？答案只供本组选择用途／惊喜，不记录姓名，不宣称代表全班。 | Anonymous starting question for the design brief: On your first visit to this fantasy hideout, what would you most want to find? Use the answer only to choose this team's purpose or surprise; record no name and do not claim it represents the class. |

| 求助：看不見內部時保持開頂剖視，不必加屋頂；先移除不必要的裝飾，再請 AI 由相同視角重新輸出。 | 求助：看不到内部时保持开放顶面的剖视，不必加屋顶；先移除不必要的装饰，再请 AI 从相同视角重新输出。 | Help: if the interior is hidden, keep an open-top section view; you do not need a roof. Remove unnecessary decoration first, then ask AI to export the same view again. |

獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS。音頻尚未合成或試聽，§14 瀏覽器語言切換和鍵盤體驗也未驗；此 PASS 不代表課件已生成或 runtime 通過。

## 17. OpenMAIC 原生組件藍圖（生成輸入範圍）

結構原型 `pbl-studio`。最終組裝須由 S1 的 OpenMAIC PBL v2 工作台啟動九階段同一項目；調查、簽名互動、評議、修訂和展示頁只是支架，學生須把可核對結果提交回對應里程碑。S2 為不計分起點；本課不設獨立 quiz。托管生成只負責短引導與角色候選；複雜互動、項目狀態及工作台採確定性本地組裝與測試。托管生成不得生成 interactive HTML、PBL 工作區或 JavaScript；web search、image/video generation、hosted TTS 關閉；不得假稱 Blender 已執行。

本機確定性 I1「入口至目的地路線」記錄學生設定的入口、目的地、路線預測和同伴實際試走；I2「單一障礙修訂」只改一處阻擋，重試同一路線並記錄可見差異。若未執行或未觀察，標記未測試，不自動判定場景可通行。

生成候選僅供教師審閱，不接入學生網站，且不含學生資料；生成課堂連結可能可由持有連結者打開，審核通過前不分享。本機指令草稿不連模型、不控制 Blender。校方未核實服務條款、資料流、隔離資料夾與教師監督前，不開放學生工具活動。G2 通過後仍逐課只提交一次，生成不等於 import／release 通過。
