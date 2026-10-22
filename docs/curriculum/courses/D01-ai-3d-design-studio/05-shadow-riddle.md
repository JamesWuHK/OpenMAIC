# D01-05｜影子猜謎機

版本：v0.4.2 課時定義澄清｜2026-09-28｜design SHIP（97.5/100，僅進入 generation-prep）；播放器與校內時長未實測，尚未生成／發布。
角色分工修訂：學生負責謎底、線索與控制變因的選擇、自然語言指令、觀察與驗收；AI 操作者負責 Blender 內所有形體／燈光調整、渲染、保存及輸出。學生不直接操作 Blender。
對象：中一至中二；小五至小六從三個形體起步。目標完整學習路徑約 30 分鐘；這是包括校內 AI-Blender 操作的總時長目標，不是 OpenMAIC 播放時長，播放器時長尚未知。
工具：Astra（GPT-6 Astra）＋具本機工具能力的 Codex；Blender 4.5 LTS。學校自備訂閱、帳號、設備及接駁。

## 1. 讓觀眾先猜，再大叫「原來係咁！」

S-01 原創委託：「奇想展需要一個影子謎題。先讓人看影子，猜完才看到原來用了哪幾件東西。」

驅動問題：怎樣安排幾個簡單形體和一盞燈，讓影子像你想表達的東西？學生選謎底、用哪些形體、希望多容易猜；不能只改老師示範的背景色。

**使用者起點：**先問一位同伴「你喜歡先猜影子，還是先看它由甚麼組成？」只將答案用作本組展示順序選擇；測試時展示無標題謎面、照錄猜測與依據，不外推成科學或市場結論。

**必交：可重開的 3D 燈光裝置 .blend，影子謎面圖、結構揭曉圖，v01／v02。** 最低三個形體＋一盞燈＋背板＋一個看影子的視角。不做複雜影子字、不做激光或實體高熱燈具；全程數碼。這是藝術裝置和條件比較，不作完整光學定律講授。
核心版限三個形體、一盞燈、固定背板與單一視角，產生真實計算的投影並只改一項條件；多燈、多謎底及精修屬延伸，不計入 30 分鐘核心承諾，也不能用貼圖／生圖替代真實陰影。

**本課學習目標：**（1）用形體、燈和承接面在 Blender 中做出真正由場景計算的影子，而非貼圖或生成圖；（2）提出影子輪廓的猜想，指揮 AI 一次只改一個形體位置或光源參數，並用相同視角觀察差異；（3）根據真實同伴猜測決定保留或修改線索，並說清這次數碼比較不能直接推廣成普遍光學定律。證據是可重開場景、固定條件前後影子、學生指令及匿名真實反饋。

圖必須由真實場景算出；不能在背板畫黑色兔子再聲稱是物件投影，也不能請生圖模型直接畫答案。

## 2. 可重建的原創舞台

M-01 為相對場景單位，不是物理實驗器材尺度。先用「長耳輪廓」作重建支架，之後學生至少改謎底特徵或安排，不是人人照交同一隻兔：

| 物件 | 尺寸／位置起點 | 用途 |
| --- | --- | --- |
| 背板 | 4×0.1×4，中心 (0,2,2) | 接住投影的直立平面 |
| 頭部球體 | 直徑 0.9，中心 (0,0,2) | 基本圓輪廓 |
| 左長形體 | 0.25×0.25×0.8，中心 (-0.3,0,2.6) | 一個突出特徵 |
| 右長形體 | 同尺寸，中心 (0.3,0,2.6) | 第二個突出特徵 |
| 點光源 | 位置 (0,-4,2)，小半徑起步 | 由物件前方照向背板 |

採能看實際場景燈光和陰影的渲染設定，不用只看材質色的畫面冒充投影。燈亮度、曝光和陰影設定需在學校電腦試出可見畫面；本表尚未實跑，不承諾一貼就得到清晰謎面。看影子的相機可放物件與背板之間朝向背板；揭曉另用斜視，讓人看清三者位置。不要為揭曉改掉模型卻稱同一裝置。

做法：先在粗舞台看到真影子 → 選自己的謎底 → 改一個形體的位置／比例 → 保存 v01 → 同伴只看謎面猜 → 改特徵或燈位 → 重試 → 保存 v02 並出兩張圖。

## 3. structureContract｜光影工作坊

`archetype: pbl-studio`。

表內分鐘均為待驗證的學習路徑 timebox，不是保證完成時限；超時可延續同一作品，不得刪作品產出、觀眾評議或修訂。

| 場景 | 環節／組件 | 學習路徑分鐘 | 學生動作與證據 |
| --- | --- | ---: | --- |
| L05-S1 | PBL 項目主線／驅動問題與作品簡報 | 2 | 進入 PBL v2 工作台，以「哪項條件造成影子改變」為主線，保存同一謎題的九階段證據 |
| L05-S2 | 準備度／不計分起點 | 1 | 看多項條件一起改動的情境，說能否判斷原因；不計分，記入項目起點 |
| L05-S3 | 按需概念支架 | 2 | 需要時參考物件、光源和視角如何共同影響真實投影，再用於自己的謎題 |
| L05-S4 | 簽名互動／控制單一條件 | 3 | 選謎底並預測改一項條件後的影子變化 |
| L05-S5 | 調查／AI 原型指令 | 8 | 指揮 AI 建 v01，查看真正渲染投影並保留可比較條件；未執行則標未測試 |
| L05-S6 | 同伴評議／證據缺口 | 3 | 挑戰同時改兩項後作因果結論的說法，指出缺少的對照證據 |
| L05-S7 | 學生修訂／v01→v02 | 6 | 固定其他條件，只改一項，核對真實投影的前後差異 |
| L05-S8 | 作品展示／證據交付 | 3 | 在同一 PBL 項目提交謎面、揭曉、真實投影與條件記錄 |
| L05-S9 | 反思遷移 | 2 | 換一盞燈後提出下一個可檢查問題、控制條件和證據限制 |

PBL 項目主線：OpenMAIC PBL v2 工作台在 S1 開場，按序保存驅動問題、準備度、簡報、調查、原型、評議、修訂、展示和遷移九個里程碑；互動頁只作項目支架，結果需提交回對應里程碑。六功能：目標／成果與驅動問題 S1；激活 S2；主動建構 S4/S5；反饋修訂 S6/S7；評量證據 S1 項目記錄及 S5–S8；遷移 S9。全課不放獨立答案測驗。30 分鐘仍是未經試教的整體路徑目標。

## 4. interactionContract｜看見變化才算試驗

**課堂邊界：**以下 I1／I2 是課堂中由學生提出設計決定、教師監督、AI 操作者在 Blender 執行的工作流，不是現有 OpenMAIC 播放器內的 Blender 互動；學生不操作 Blender 介面。

### I1｜拼出一個影子〔簽名互動〕

初始是三件形體和固定燈／背板。學生先預測，再指揮 AI 只移一件物體；state＝learnerPrompt、objectTransforms、lightTransform、screenTransform、shadowImage、prediction。可見結果是實際投影重疊、分離或改輪廓。

錯例 M-02：兩個突出特徵投影疊在一起，失去辨識線索。反饋：「你現在看見幾個突出部分？和你想讓人認出的特徵一致嗎？」第二提示：鎖住燈和背板，只橫移其中一件少許。重試用同一謎面視角比較，不同時改全部參數。證據：改前／後模型版本、參數改了哪個及實際影子圖。未知結果就先記觀察，不說 AI 的預測一定對。

### I2｜猜不到，是線索不清還是影太糊？

學生保持形體和相機不變，比較兩個點光源半徑，之後選一個可讀效果；state＝lightRadius、fixedObjectState、guessReason、selectedVersion。可見結果是邊緣和細節可讀性變化，不能保證每組觀眾都猜中。

錯例：為清楚輪廓同時改燈位、亮度、物件及相機，然後說「半徑造成全部改變」。反饋：「你剛才其實改了幾樣？」第二提示：回 v01，固定其他條件。重試只改半徑，用同一視角再看；必要時把亮度調整視為另一輪，不混在同一次比較。證據：兩個設定和同視角圖、同伴實際理由、學生選擇。圖太黑時先修可見性，不編造一組觀察數字。

## 5. 光影救援卡

- 沒有影子：先查是否使用實際場景燈光、物件是否在燈與背板之間、承接面是否看得到，再查渲染陰影設定。一次排查一項。
- 謎面看成別的東西：問觀眾認了哪條邊；可以接受意外的新謎底，也可修原意圖，不把猜錯的人扣分。
- 影子太糊：試較小光源半徑，其他條件固定；這是軟件場景中的對照，不推出所有真實光源結論。
- 設備慢：只做小尺寸單張預覽，少物件，先確認一幅；若陰影仍不可見，這節作品未完成，不能改交黑色剪影貼圖。

每卡不超過 90 秒，全課單向講解設計上限 8 分鐘。

## 6. Astra 請求

```text
請幫我在 Blender 4.5 LTS 建可編輯的影子謎題粗舞台。
謎底：[自己的選擇]；兩個主要輪廓特徵：[自己的選擇]。
可從本課 M-01 物件、燈和背板起點建立，先確認真正投影可見。
只用簡單形體、一盞燈、背板和低解析預覽，不下載素材。
不要在背板貼一張畫好的影子，不用圖片生成取代投影。
先另存 v01 並停下；我決定要改哪件物體後，由你在 Blender 移動並比較影子，不要要求我操作 Blender。
只操作本課資料夾；如果渲染未成功，說明未成功。
```

修訂：「同伴以為是［實際猜測］，因為［線索］。我想保留／改成［自己的選擇］。請只改［一件形體或一個光源參數］，保持其餘條件，另存 v02，並用同角度輸出比較。」

## 7. 觀眾驗收

四項各 0–2：教師／AI 操作者確認場景可重開且確有三維投影；謎面與揭曉來自同一裝置；學生能解讀一次控制條件比較；按觀眾線索指揮 AI 修改作品。0 未見、1 需協助、2 能展示並說明；建議 6/8，真投影及改版不得 0。大家全部猜中不是必要分數，教師看學生能否解釋和改善線索。

遷移不考公式：如果把光源半徑加大，先描述打算觀察哪一條邊，再實試；接受與預測不同的結果，如實解釋可見限制。不得把班上兩個人的猜測說成市場喜好或科學規律。

## 8. 支架、角色及設計簽名

高小固定燈與背板，先只移三個形體，半徑比較由老師協助；初中自己控制一項燈光參數；進階用四至六個物體造雙重解讀，不追求影子文字或多人像。慢組減形體，不放棄投影比較。

高小必做：從謎底圖卡選一項、預測一個形體移動後的影子並用口述記錄；初中必做：自行選一個控制變因，說明哪些條件要固定並比較同角度輸出。每人各自交一條指令、一個預測、一項真實可見結果；不以猜中謎底或長篇書寫評分。

AI 老師問哪條線索有效；助教排查可見性與條件；AI 同學猜另一個合理物件，學生回應但不把虛構猜測當真觀眾調查。

`designSignature`：暗場中的背板＋揭曉斜視；互動為投影拼合／光源條件，版式為謎面與結構並列，作品是影子裝置，三者均不同於已發布 T02-01 的閾值、規則鏈、規則卡。與 D01-04 時間敘事不同，本課關鍵是空間和光的關係。禁用假的影子貼圖、神秘物理宣稱、現成商標輪廓；重用播放器但不移植其內容視覺。

## 9. 畫面與口語分軌

- 畫面：幾件普通形體，能否在牆上組成一個讓人猜得到的影子？
- 粵語：呢幾舊嘢分開睇唔似乜喎，照埋一齊會變成乜？你郁一件試吓，睇下個影會點變。
- 普通話：这几个形体分开看不太像什么，投在一起会变成什么？移动其中一个，看看影子怎么变。

繁中、简中、English 學生閱讀文案及粵語、普通話、英文獨立旁白稿已完成；獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS（見 §15 及總審核）。音頻尚未合成、試聽或接入播放器；粵語目標語速 1.2 倍，只在一層加速。靜音可完成任務，不用普通話讀粵語文案，也不在缺音軌時跨語種替代。

## 10. 作品交接、私隱與保存

開課前置：須遵守[系列未成年人課堂工具與資料保護協議](00-series-index.md#52-未成年人課堂工具與資料保護前置協議)，由校方確認年齡條款、資料流、工作站權限、教師監督與回滾；文件內 prompt 不是系統安全控制。任一條件未確認，就不收學生輸入、不執行 Blender 工具，並如實標示實作未完成。

`portfolioInput`：不需要前課資產；用本課球體、兩個拉長形體、背板和燈光重建。前課角色可作延伸。
`portfolioOutput`：影子裝置 v01／v02 .blend；謎面圖和結構揭曉圖；一次固定其他條件的前後比較及真實猜測記錄。
`nextUse`：以謎面／揭曉兩階段體驗進入第六課展覽；保留裝置，可調整而不只貼一張謎面。
`conceptRevisit`：光源、遮擋物與承接面；觀察和改變單一條件；數碼渲染與現實實驗的邊界。

本課檔名用 `G03_D01_L05_v01.blend`、`v02.blend`；圖片同前綴。只能操作本課指定資料夾，保留舊版，不覆蓋他人作品。提示詞不是權限沙箱；學校事前限制檔案及工具權限，不執行來源不明腳本、不關閉安全防護、不裝未知插件。AI 出錯保留錯誤、回復可用版；未完成就如實標記，不編造已生成或測試成功。

只用組別代號，不上傳學生姓名、人臉、聲音、學校平面圖、帳號畫面或家庭位置。文字、角色、形體與示意圖全部原創，不使用官方圖文、供應商示範作品或品牌角色。M 是課堂設定，S 是虛構任務，均不可代表香港現況；實際觀察另記，不能預填。成果是數碼創作／概念，不作工程安全、打印可用性或專業用途保證。

## 11. 一手研究依據與準確性邊界

本次核對：2026-09-23（Lights／Format 官方 4.5 正文；Transform／安全沿用 2026-09-22 快照）。

1. [Blender Light Objects](https://docs.blender.org/manual/en/4.5/render/lights/light_object.html) → R-01：光源位置及大小影響照明／陰影；點光源半徑增大可使陰影邊緣較柔。具體畫面仍取決於場景與渲染設定。
2. [Blender Transform](https://docs.blender.org/manual/en/4.5/scene_layout/object/properties/transforms.html) → R-02：可獨立改物件變換；本課用它測試相對位置。
3. [Blender Output Format](https://docs.blender.org/manual/en/4.5/render/output/properties/format.html) → R-03：可設定低解析測試影像，不必先作高畫質輸出。
4. [Blender 腳本安全](https://docs.blender.org/manual/en/4.5/advanced/scripting/security.html) → 執行權限邊界。

以上只作研究依據，教學表述與視覺重新創作。軟件行為有來源，不代表本課提示詞、學校電腦效能、約 30 分鐘完成率或學生興趣已驗證。不可把 M 示例或 AI 回答寫成實測結果。

## 12. OpenMAIC 單課製作指令

本課約 30 分鐘只指整條學習路徑（OpenMAIC 引導＋校內受監督 AI-Blender 活動）的設計目標；不得將其當成播放器 runtime。課件生成後分別計量播放器活動時間和課內工具活動的實際總時間；未計時試教前不公開承諾 30 分鐘。

只製作 D01-05「影子猜謎機」的候選引導，一課一文檔；不得生成其餘課或把本稿 13 節逐節朗讀。以第 1 節任務和作品開場，九場景採 `pbl-studio`。約 30 分鐘是全程學習路徑目標，不是 OpenMAIC 播放 runtime；課件生成後另測玩家活動時間，校內試教另測端到端總時長，兩者未取得證據前不得對外承諾 30 分鐘。最多兩張短說明頁，單次救援提示最長 90 秒，全課單向講解設計上限 8 分鐘。時間尚待學校設備計時試教；如生成超時，允許同一作品跨課延續，不刪作品、猜測或修改。

託管只做原創引導、按需提示和教練式討論候選。模型、動畫和投影必須在 Blender 真正執行；不讓學生按「完成」後就自動判通過。可編輯工作區的來源是本機 .blend；未來網站狀態或提交組件需另做確定性實作與驗證，不聲稱播放器已接通 Blender。

功能：Web 關（資料閉合）；image 關（教學關鍵圖須來自實際原創模型）；生成 video 關（不冒充 Blender 輸出）；託管 TTS 關（後續獨立語軌）；agents／discussion 開候選（各有任務，不能替學生選）；quiz 僅保留操作中誤區和離堂遷移，不作理論考試；interactive／PBL 保留真實作品編輯與返工，不以通用選擇題代替。學生可見工具名稱，不出現密鑰、帳號設定、供應商選擇器或作者導航。

## 13. 教師開課檢查與未完成門檻

- 課前在學校電腦真正重建本課 M 起點，確認檔案能重開；本稿沒有附上已完成 .blend 資產。
- 確認電腦＋滑鼠和 Astra 工具接駁；手機能看任務不等於能建模。老師若只能投影示範，不宣稱學生完成個人實作。
- 示範只到最小粗模；學生必須保留自己的選擇、指揮 AI、同伴測試及一次由 AI 執行的作品修訂；不能以學生手動操作 Blender 代替 AI 操作目標。
- 本課的 AI 操作者必須在 Blender 以場景燈光算出實際投影；若渲染、設備或工具鏈失敗，保留錯誤並記未完成，禁止改貼剪影圖或生圖，也不切換成學生手動操作。
- 卡住先縮減細節或修局部；不能用生成圖片、填表或聽講替代本課作品。若素材／設備不合格，先完成準備，不虛報通過。
- 設計階段獨立重評為 97.5/100、`SHIP`（僅進入 generation-prep）；學生未實操驗證、未試教，尚無 generation manifest／G2 授權。不得把設計 `SHIP` 當作 OpenMAIC 提交或網站發布許可。

## 14. 可訪問性與窄屏完成規格（待成品測試）

- 核心路徑不使用拖放或只靠顏色／聲音的提示；謎底選擇、預測、單變因調整記錄和觀眾理由可用原生表單及鍵盤完成，Tab／Shift+Tab／Enter／Space 可走完，焦點清楚可見，狀態說明使用 `aria-live` 宣讀。
- 390×844 手機版採單欄，並排影像改為同角度前後逐張切換、可放大；不以暗底和顏色作唯一線索，對比及輪廓另有文字說明，觸控目標至少 55px，不要求橫向捲動。手機可完成預測、指令草擬、結果觀察記錄和遷移；Blender 真投影由校方工作站上的 AI 操作者執行，學生不須在手機操作 Blender。
- 提供靜態輪廓和文字替代，尊重放大／減少動態偏好；替代圖只能解釋任務，不能冒充該組 Blender 場景算出的真實投影。
- 待驗收：桌面與 390×844 真瀏覽器各完成「先猜—複製指令—看實際投影—單變因重試—保存理由—遷移」；鍵盤重走並檢查焦點、標籤、文字替代、朗讀回饋及控制台。此規格不是成品已通過的證據。

### 已被取代的舊稿（禁止輸入 OpenMAIC）

本節是較早候選版本，僅保留修訂脈絡且禁止作生成輸入；唯一供審查及日後生成使用的版本，是下方「## 15. D01-05 多語學生端內容稿（Q16 文案設計 PASS）」。

閱讀選項：繁體中文（香港）、简体中文、English；旁白為分開撰寫的粵語、普通話、英文。完整互動和安全文字隨屏幕語言切換，旁白不跨語種代讀。OpenMAIC 託管 TTS 關閉；以下是文案，不是音頻或渲染證據。

### 九場景六軌引導

| 場景 | 繁中屏幕 | 简中屏幕 | English screen | 粵語口語 | 普通話口語 | English narration |
| --- | --- | --- | --- | --- | --- | --- |
| S1 謎題 | 用簡單形體和一盞燈做影子謎題。先讓觀眾猜，再揭曉。你選謎底，AI 操作 Blender。 | 用简单形体和一盏灯做影子谜题。先让观众猜，再揭晓。你选谜底，AI 操作 Blender。 | Make a shadow riddle with simple shapes and one light. Let the audience guess before the reveal. You choose; AI operates Blender. | 用幾件簡單形體同一盞燈做個影子謎題，先俾人估，再揭曉。謎底由你揀，AI 操作 Blender。 | 用几个简单形体和一盏灯做影子谜题，先让观众猜，再揭晓。谜底由你决定，AI 操作 Blender。 | Make a shadow riddle with simple shapes and one light. Let people guess before revealing the answer. |
| S2 看裝置 | 找出場景中的燈、形體和背板；實際投影由場景燈光計算。 | 找出场景中的灯、形体和背板；真实投影由场景灯光计算。 | Identify the light, shapes, and screen. The scene lighting must compute the actual shadow. | 睇吓場景入面盞燈、幾件形體同背板喺邊；真影子要由場景燈光計出嚟。 | 找出场景里的灯、形体和背板；真实阴影要由场景灯光计算。 | Find the light, shapes, and screen. The scene lighting must create the actual shadow. |
| S3 選謎底 | 選謎底和兩個輪廓線索，不必照抄長耳示範。 | 选择谜底和两个轮廓线索，不必照抄长耳示例。 | Choose an answer and two outline clues. You do not need to copy the long-ear example. | 揀自己嘅謎底同兩條輪廓線索，唔使跟長耳兔示範。 | 选择自己的谜底和两个轮廓线索，不必照着长耳示例做。 | Choose your own answer and two clues. You do not have to copy the long-ear example. |
| S4 先猜 | 預測只移動一件形體後影子會怎樣改變；先固定燈和背板。 | 预测只移动一个形体后影子会怎样变化；先固定灯和背板。 | Predict how the shadow changes when one shape moves. Keep the light and screen fixed. | 先估淨係郁一件形體，個影會點變；盞燈同背板暫時唔好郁。 | 先猜只移动一个形体后影子会怎么变；灯和背板暂时保持不动。 | Predict what changes when one shape moves. Keep the light and screen fixed. |
| S5 建立 | 指揮 AI 建三件形體、一盞燈和背板；保存 v01 並輸出真投影。 | 指挥 AI 建三个形体、一盏灯和背板；保存 v01 并输出真实投影。 | Direct AI to build three shapes, a light, and a screen. Save v01 and export the computed shadow. | 叫 AI 起三件形體、一盞燈同背板，輸出場景計出嘅真影子，存成 v01。 | 请 AI 制作三个形体、一盏灯和背板，输出场景计算的真实阴影并保存 v01。 | Ask AI to build three shapes, one light, and a screen, then save v01 and export the computed shadow. |
| S6 盲猜 | 只展示影子謎面，不展示形體；記錄同伴實際猜測和理由。 | 只展示影子谜面，不展示形体；记录同伴实际猜测和理由。 | Show only the shadow, not the shapes. Record the peer's actual guess and reason. | 淨係俾同學睇影子，唔好先俾佢睇形體；記低佢估乜同點解。 | 只给同伴看影子，不先展示形体；记录他猜什么以及理由。 | Show only the shadow first. Record what your peer guesses and why. |
| S7 修改 | 根據實際猜測，只修改一件形體或一項燈光條件，保存 v02。 | 根据真实猜测，只修改一个形体或一项灯光条件，保存 v02。 | Based on the actual guess, change only one shape or one lighting condition, then save v02. | 按同學真係點估，只改一件形體或者一個燈光條件，存成 v02。 | 根据同伴的真实猜测，只改一个形体或一项灯光条件，保存 v02。 | Use the actual guess to choose one shape or lighting change, then save v02. |
| S8 揭曉 | 先再看謎面，再看同一裝置的結構，對比 v01 和 v02。 | 先再看谜面，再看同一装置的结构，对比 v01 和 v02。 | Revisit the shadow, then reveal the same setup. Compare v01 and v02. | 先再睇影子，跟住睇返同一套裝置點砌，對比兩個版本。 | 先看影子，再揭晓同一套装置的结构，对比两个版本。 | Look at the shadow again, then reveal the same setup and compare both versions. |
| S9 遷移 | 改光源半徑，先說明你要觀察哪條邊，再測試；單次結果不是普遍定律。 | 改变光源半径，先说要观察哪条边，再测试；一次结果不是普遍规律。 | Change the light radius. Name an edge to inspect, then test it; one result is not a universal law. | 改盞燈嘅半徑之前，先講想睇邊條邊，再試；一次結果唔係普遍定律。 | 改光源半径前，先说要观察哪条边，再测试；一次结果不代表普遍规律。 | Before changing the light radius, name an edge to inspect. One test is not a universal law. |

### 操作、互動回饋、求助、評量和告知（三語閱讀）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 匿名 brief（教師收集、不記姓名）：你喜歡先猜影子，還是先看它由甚麼組成？本組用回答決定展示順序，不推廣成全班喜好。 | 匿名 brief（教师收集、不记录姓名）：你喜欢先猜影子，还是先看它由什么组成？本组用回答决定展示顺序，不推断为全班偏好。 | Anonymous brief (teacher collects, no names): Would you rather guess from a shadow first, or see the objects first? Use the answer to choose the reveal order; it does not represent the class. |
| 形體試驗：預測後請 AI 只移動[形體]少許，固定燈、背板和相機，從同一謎面角度輸出真投影。 | 形体测试：预测后请 AI 只移动[形体]一点，固定灯、背板和相机，从相同谜面角度输出真实投影。 | Shape test: after predicting, ask AI to move only [shape] slightly. Keep the light, screen, and camera fixed; export the computed shadow from the same riddle view. |
| 回饋：兩個輪廓是疊在一起還是分開？仍像你選的線索嗎？再試：鎖定燈和背板，只橫移一件形體，同角度再看。 | 反馈：两个轮廓是重叠还是分开？还像你选的线索吗？重试：固定灯和背板，只横向移动一个形体，再从相同角度查看。 | Feedback: are the outlines overlapping or separated? Do they still match your chosen clue? Retry: lock the light and screen, shift one shape sideways, and inspect from the same view. |
| 光源半徑互動：形體和相機固定，只改半徑。若畫面太暗，另開一輪只改亮度並標明；不可把兩個變因混成同一結論。 | 光源半径互动：固定形体和相机，只改半径。如果画面太暗，另开一轮只改亮度并标明；不能把两个变量混成一个结论。 | Light-radius test: keep shapes and camera fixed; change only radius. If too dark, start a separate brightness test and label it; do not mix two variables into one conclusion. |
| 完整修訂指令：同伴猜[實際答案]並指出[實際線索]。我選擇只改[一件形體位置／光源半徑]。保留其他條件與 v01，另存 v02，以相同相機輸出 Blender 計算的真影子。不可用貼圖或生圖代替。 | 完整修改指令：同伴猜[真实答案]并指出[实际线索]。我选择只改[一个形体位置／光源半径]。保持其他条件和 v01，另存 v02，用相同相机输出 Blender 计算的真实阴影。不能用贴图或生成图代替。 | Full revision request: My peer guessed [actual answer] and noticed [actual clue]. I choose to change only [one shape position/light radius]. Keep all other conditions and v01, save v02, and export Blender's computed shadow from the same camera. Do not substitute a texture or generated image. |
| 求助：沒有影子，依次查場景燈、物件位置、背板可見和陰影渲染設定；觀眾猜成別物先記新解讀；太模糊只試小一點光源半徑；設備慢就做一張低解像預覽，無真影仍標未完成。 | 求助：没有阴影，依次检查场景灯、物件位置、背板可见性和阴影渲染设置；观众猜成别的物件时先记录新解读；太模糊就只测试较小光源半径；设备慢时输出一张低分辨率预览，没有真实阴影仍标记未完成。 | Help: if no shadow appears, check the scene light, object positions, screen visibility, and shadow-render settings one at a time. Record an unexpected guess as a new reading. If blurry, test only a smaller light radius. On a slow device, use one low-resolution preview; without a real shadow, mark incomplete. |
| 評量四項：場景可重開且確有計算投影；謎面和揭曉來自同一裝置；我說明單一條件比較限制；我按真實猜測修訂。0＝未展示、1＝需提示、2＝展示並解釋；真投影和實際改版不得 0，四項建議至少 6/8。課堂建議，非官方標準。 | 评价四项：场景可重开且确有计算投影；谜面和揭晓来自同一装置；我说明单一条件比较的限制；我根据真实猜测修改。0＝未展示、1＝需要提示、2＝展示并解释；真实投影和实际修改不能为 0，四项建议至少 6/8。这是课堂建议，不是官方标准。 | Four checks: the scene reopens with a computed shadow; riddle and reveal use the same setup; I explain the limits of one-variable comparison; and I revise from an actual guess. Score 0 = not shown, 1 = with prompting, 2 = shown and explained. A computed shadow and real revision must both score above 0; suggested total 6/8. This is not an official standard. |
| 安全告知：這是低風險數碼藝術，不用實體高熱燈或激光，也不直視強光。校方核實服務年齡條款、資料流、權限和教師監督前，不輸入姓名、人臉、聲音、帳號或家居／校園位置；未知腳本立即停止並告知老師。 | 安全告知：这是低风险数字艺术，不用实体高热灯或激光，也不直视强光。学校核实服务年龄条款、数据流、权限和教师监督前，不输入姓名、人脸、声音、账号或家居／校园位置；遇到未知脚本立即停止并告诉老师。 | Safety notice: this is low-risk digital art. Do not use hot physical lamps or lasers, or stare into bright light. Until the school checks service age terms, data flow, permissions, and supervision, do not enter names, faces, voices, account details, or home/school locations. Stop and tell the teacher if a script is unfamiliar. |
| 介面欄位：我的謎底／輪廓線索／我的預測／固定條件／同伴猜測和理由／本次改的變因／複製給 AI／保存 v01／保存 v02／謎面／揭曉／提交。 | 界面字段：我的谜底／轮廓线索／我的预测／固定条件／同伴猜测和理由／本次修改的变量／复制给 AI／保存 v01／保存 v02／谜面／揭晓／提交。 | Interface fields: My answer / Outline clues / My prediction / Fixed conditions / Peer guess and reason / Variable changed / Copy to AI / Save v01 / Save v02 / Riddle / Reveal / Submit. |

上述舊版多語學生核心文案已由下方 canonical §15 取代；其 Q16 文案審核只適用於下方版本。音頻、實際投影、瀏覽器語言切換都未驗，不可將文案審核冒充生成／運行結果。

## 15. D01-05 多語學生端內容稿（Q16 文案設計 PASS）

閱讀語言：繁體中文（香港）、简体中文、English。旁白語言：分開撰寫的粵語、普通話、英文。完整互動說明、條件和安全文字留在所選屏幕閱讀語言；旁白只作場景引導，絕不跨語種代讀。OpenMAIC 託管 TTS 關閉；未合成、未試聽。

### 九場景六軌引導

| 場景 | 繁中屏幕 | 简中屏幕 | English screen | 粵語口語 | 普通話口語 | English narration |
| --- | --- | --- | --- | --- | --- | --- |
| S1 謎題 | 先看影子再猜：用簡單形體和一盞燈做出自己的影子謎題。你選謎底，AI 操作 Blender。 | 先看影子再猜：用简单形体和一盏灯做出自己的影子谜题。你选谜底，AI 操作 Blender。 | Make a shadow riddle with simple shapes and one light. You choose the answer; AI operates Blender. | 先俾觀眾睇影子估一估，之後先揭曉。謎底同線索由你揀，AI 負責操作 Blender。 | 先让观众看影子猜一猜，再揭晓。谜底和线索由你选择，AI 负责操作 Blender。 | Make a shadow riddle. Let the audience guess from the shadow before revealing the objects. You choose; AI operates Blender. |
| S2 先說第一個想法（不計分） | 燈、形體和相機都改過，影子也變了。現在能確定是哪一項造成嗎？先說直覺，也可說未能判斷；不計分。 | 灯、形体和相机都改过，影子也变了。现在能确定是哪一项造成吗？先说直觉，也可说暂时不能判断；不计分。 | The light, shape, and camera all changed, and so did the shadow. Can you tell which caused it? Share a first thought or say you cannot tell yet; not scored. | 燈、形體同相機都改過，影子又變咗。你估知唔知邊樣造成？講下直覺，唔計分。 | 灯、形体和相机都改了，影子也变了。你觉得能知道是哪项造成的吗？先说直觉，不计分。 | The light, shape, and camera all changed, and so did the shadow. Can you tell which caused it? Share a first thought; this is not scored. |
| S3 選謎底 | 選自己的謎底與兩個輪廓線索；不是照抄長耳示例。 | 选择自己的谜底和两个轮廓线索；不要照抄长耳示例。 | Choose your own answer and two outline clues; do not copy the long-ear example. | 揀你自己嘅謎底，再諗兩條最重要嘅輪廓線索，唔使跟長耳示範。 | 选你自己的谜底，再想两个最重要的轮廓线索，不必照着长耳示例做。 | Choose your own answer and two important outline clues. You do not need to copy the long-ear example. |
| S4 預測 | 預測只移動一件形體後，影子輪廓會如何改變；燈和背板先固定。 | 预测只移动一个形体后，影子轮廓会怎样变化；先固定灯和背板。 | Predict how the shadow outline will change if one shape moves. Keep the light and screen fixed. | 先估淨係郁一件形體，個影會點變；盞燈同背板暫時唔好郁。 | 先猜只移动一个形体后，影子会怎么变；灯和背板暂时保持不动。 | Predict how the shadow changes when one shape moves. Keep the light and screen fixed for now. |
| S5 建裝置 | 指揮 AI 建三個形體、一盞燈和背板，輸出真投影並保存 v01。 | 指挥 AI 建三个形体、一盏灯和背板，输出真实投影并保存 v01。 | Direct AI to build three shapes, one light, and a screen. Export the computed shadow and save v01. | 叫 AI 起三件形體、一盞燈同背板，輸出由場景計出嘅真影子，存成 v01。 | 请 AI 制作三个形体、一盏灯和背板，输出场景计算的真实阴影，保存为 v01。 | Ask AI to build three shapes, one light, and a screen. Export the scene-computed shadow and save v01. |
| S6 盲猜 | 只展示謎面，不展示物件或謎底；記錄同伴實際猜測和理由。 | 只展示谜面，不展示物件或谜底；记录同伴实际猜测和理由。 | Show only the riddle shadow, not the objects or answer. Record the peer's actual guess and reason. | 淨係俾同學睇影子，唔好先揭曉物件；記低佢估乜同點解。 | 只给同伴看影子，不先揭晓物件；记录他猜什么以及理由。 | Show the shadow only. Do not reveal the objects first. Record the peer's guess and reason. |
| S7 修訂 | 根據真實猜測選一件形體或一個燈光條件修改；其他條件保持，保存 v02。 | 根据真实猜测选择一个形体或一个灯光条件修改；其他条件保持不变，保存 v02。 | Choose one shape or one lighting condition to change based on the actual guess. Keep other conditions fixed; save v02. | 聽完同學真實嘅估法，你揀改一件形體或者一個燈光條件；其他嘢保持，存 v02。 | 根据同伴真实的猜测，你选择修改一个形体或一个灯光条件；其他条件不变，保存 v02。 | Use the peer's actual guess to choose one shape or lighting change. Keep everything else fixed and save v02. |
| S8 揭曉 | 先重播謎面，再展示同一裝置的斜視結構，對照 v01 和 v02。 | 先重播谜面，再展示同一装置的斜视结构，对比 v01 和 v02。 | Replay the shadow, then reveal an oblique view of the same setup. Compare v01 and v02. | 再播一次謎面，跟住轉斜角睇返同一套裝置，對比 v01 同 v02。 | 再播放一次谜面，然后从斜角看同一套装置，对比 v01 和 v02。 | Replay the riddle, then reveal the same setup from an oblique view. Compare v01 and v02. |
| S9 遷移 | 光源半徑變大：提出你要看哪一條邊，再實際測試；不把單一結果說成普遍定律。 | 光源半径变大：说出你要观察哪一条边，再实际测试；不要把单一结果说成普遍定律。 | Increase the light radius. Say which edge you will inspect, then test it; one result is not a universal law. | 盞燈嘅半徑加大，你先講想睇邊條邊，再叫 AI 試；一次結果唔係普遍定律。 | 把光源半径调大，先说要观察哪条边，再请 AI 测试；一次结果不能代表普遍规律。 | Increase the light radius. Name an edge to inspect, then test it. One result is not a universal law. |

### 學生操作稿、回饋和完整指令（三語閱讀）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 設計 brief（教師匿名收集並展示，不記姓名）：你喜歡先猜影子，還是先看它由甚麼組成？本組按回答選展示順序，不把一人答案當全班結論。 | 设计 brief（教师匿名收集并展示，不记录姓名）：你喜欢先猜影子，还是先看它由什么组成？本组根据回答选择展示顺序，不把一个人的答案当作全班结论。 | Design brief (collected anonymously by the teacher): Would you rather guess from a shadow first, or see the objects first? Use the answer to choose this team's reveal order; one answer does not represent the class. |
| 單一條件試驗：先預測，然後請 AI 只移動[指定形體]少許，鎖定燈和背板；從同一謎面角度輸出真投影。 | 单一条件测试：先预测，然后请 AI 只移动[指定形体]一点，固定灯和背板；从相同谜面角度输出真实投影。 | One-variable test: make a prediction, then ask AI to move only [named shape] slightly. Keep the light and screen fixed; export the computed shadow from the same riddle view. |
| 回饋：兩個輪廓現在疊在一起，還是分開？它們仍像你選的線索嗎？再試：燈和背板不動，只橫移一件形體，從同一視角比較。 | 反馈：两个轮廓现在重叠还是分开？它们仍像你选的线索吗？重试：灯和背板不动，只横向移动一个形体，从相同视角比较。 | Feedback: do the two outlines overlap or separate now? Do they still match your chosen clues? Retry: keep the light and screen fixed; shift only one shape sideways and compare from the same view. |
| 光源比較：形體和相機固定，只改光源半徑；同伴說出哪條邊較易看，不預填結果。若畫面太黑，另開一輪只調亮度並標明改了第二項。 | 光源比较：固定形体和相机，只改光源半径；由同伴说明哪条边更容易看，不预设结果。如果画面太暗，另开一轮只调亮度并注明改变了第二项。 | Light comparison: keep shapes and camera fixed; change only light radius. Ask a peer which edge is easier to see; do not pre-fill the result. If too dark, start a separate brightness test and label the second changed variable. |
| 半徑互動回饋與重試：先問「哪條邊較易看？你實際見到甚麼？」不預設答案。若學生同時改了半徑和亮度，指出「剛才改了幾樣？」；返回 v01，鎖定形體、相機和亮度，只改半徑，再由同一視角比較並記下觀察。 | 半径互动反馈与重试：先问“哪条边更容易看？你实际观察到什么？”，不预设答案。如果学生同时改了半径和亮度，指出“刚才改了几项？”；返回 v01，固定形体、相机和亮度，只改半径，再从同一视角比较并记录观察。 | Radius-test feedback and retry: ask, “Which edge is easier to see? What did you actually observe?” without suggesting an answer. If both radius and brightness changed, ask, “How many things changed?” Return to v01, lock the shapes, camera, and brightness, change only the radius, then compare from the same view and record the observation. |
| 修訂指令：同伴猜[真實答案]並指出[實際線索]。我決定只改[一件形體的位置／光源半徑]。保留其他條件和 v01，另存 v02，用同一相機輸出 Blender 真投影。不要畫黑色貼圖或用生圖代替。 | 修改指令：同伴猜了[真实答案]并指出[实际线索]。我决定只改[一个形体的位置／光源半径]。保持其他条件和 v01，另存 v02，用相同相机输出 Blender 真实投影。不要画黑色贴图或用生图代替。 | Revision request: My peer guessed [actual answer] and noticed [actual clue]. I choose to change only [one shape position/light radius]. Keep all other conditions and v01; save v02 and export the computed Blender shadow from the same camera. Do not paint a silhouette or use generated art as a substitute. |
| 求助：沒有影子，逐項查場景燈、物件在燈與背板之間、背板可見、渲染陰影設定；猜成別物先記新解讀；影子模糊先只試較小光源半徑；電腦慢用小尺寸單張預覽，沒有真影就標未完成。 | 求助：没有阴影，逐项检查场景灯、物件是否位于灯和背板之间、背板是否可见、渲染阴影设置；猜成别的物件先记录新解读；影子模糊先只测试较小光源半径；电脑慢时用小尺寸单张预览，没有真实阴影就标记未完成。 | Help: if no shadow appears, check the scene light, whether objects sit between light and screen, screen visibility, and shadow settings—one at a time. If guessed as something else, record that reading. If blurry, test a smaller radius only. On a slow computer use one small preview; without a real shadow, mark incomplete. |
| 評量四項：可重開三維裝置且有計算投影；謎面／揭曉來自同一場景；我能說明單一條件比較限制；我按真實猜測指揮 AI 修訂。0＝未展示、1＝需要提示、2＝展示並解釋；真投影和實際改版不可為 0，四項建議至少 6/8。這是課堂建議，不是官方標準。 | 评价四项：三维装置可重新打开且有计算投影；谜面和揭晓来自同一场景；我能说明单一条件比较的限制；我根据真实猜测指挥 AI 修改。0＝未展示、1＝需要提示、2＝展示并解释；真实投影和实际修改不能为 0，四项建议至少 6/8。这是课堂建议，不是官方标准。 | Four checks: the 3D setup reopens and contains a computed shadow; riddle and reveal use the same scene; I explain limits of a one-variable comparison; and I direct AI to revise from an actual guess. Score 0 = not shown, 1 = with prompting, 2 = shown and explained. A computed shadow and real revision must both score above 0; suggested total 6/8. This is not an official standard. |
| 安全告知：這是低風險數碼藝術活動，不用實體高熱燈、激光或直視強光。校方核驗服務年齡條款、資料流、權限及監督前，不輸入姓名、人臉、聲音、帳號、家居／校園位置；未知腳本立即停止並通知老師。 | 安全告知：这是低风险数字艺术活动，不使用实体高热灯、激光或直视强光。学校核验服务年龄条款、数据流、权限和监督前，不输入姓名、人脸、声音、账号、家居／校园位置；遇到未知脚本立即停止并告诉老师。 | Safety notice: this is a low-risk digital art activity. Do not use hot physical lamps, lasers, or stare into bright lights. Until the school checks service age terms, data flow, permissions, and supervision, do not enter names, faces, voices, account details, or home/school locations. Stop and tell the teacher if a script is unfamiliar. |
| 介面欄位：我的謎底／輪廓線索／我的預測／固定條件／同伴猜測與理由／本次只改的變因／複製給 AI／保存 v01／保存 v02／謎面／揭曉／提交。 | 界面字段：我的谜底／轮廓线索／我的预测／固定条件／同伴猜测和理由／本次只改的变量／复制给 AI／保存 v01／保存 v02／谜面／揭晓／提交。 | Interface fields: My answer / Outline clues / My prediction / Fixed conditions / Peer guess and reason / The one variable changed / Copy to AI / Save v01 / Save v02 / Riddle / Reveal / Submit. |

獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS。音頻、Blender 實際投影、瀏覽器語言切換都未驗；不得把文字候選當成作品／試教／runtime 證據。

## 17. OpenMAIC 原生組件藍圖（生成輸入範圍）

結構原型 `pbl-studio`。最終組裝須由 S1 的 OpenMAIC PBL v2 工作台啟動九階段同一項目；調查、簽名互動、評議、修訂和展示頁只是支架，學生須把可核對結果提交回對應里程碑。S2 為不計分起點；本課不設獨立 quiz。托管生成只負責短引導與角色候選；複雜互動、項目狀態及工作台採確定性本地組裝與測試。托管生成不得生成 interactive HTML、PBL 工作區或 JavaScript；web search、image/video generation、hosted TTS 關閉；不得假稱 Blender 已執行。

本機確定性 I1「標記謎底與測試條件」保存學生的燈、物件、背板與猜測意圖；I2「固定條件只改光源半徑」記錄前後參數、同一視角的實際投影和觀眾猜測。系統不判創意謎底對錯；沒真投影或前後條件不一致就標未測試，不以剪影貼圖／生圖補足。

生成候選僅供教師審閱，不接入學生網站、不含學生資料；生成課堂連結可能可由持有連結者打開，審核通過前不分享。本機指令不連模型、不操作 Blender。校方服務、權限隔離、監督和資料流未核實前不開放學生工具活動。通過 G2 後才可提交一次，生成不等於 import／release 通過。
