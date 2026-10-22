# D01-01｜桌面小怪獸

版本：v0.4.2 課時定義澄清｜2026-09-30 狀態更新｜舊 design/generation SHIP 為歷史階段結果，不代表目前 PBL 成品通過。原 hosted 候選已生成但教學結構不合格；新版本地 PBL v2 ZIP 已組裝，尚未導入 OpenMAIC 真實播放器驗收，學生與校內 AI-Blender 實操均未實操驗證，未發布。
對象：中一至中二；小五至小六可用簡化支架。目標完整學習路徑約 30 分鐘；這是包括校內 AI-Blender 操作的總時長目標，不是 OpenMAIC 播放時長，播放器時長尚未知。
工具：Astra（GPT-6 Astra）＋具本機工具能力的 Codex；Blender 4.5 LTS。學校負責帳號、訂閱、接駁及電腦。本課規劃為開放體驗課，尚未上線。

## 1. 今天的委託，不先上理論

「奇想展要招募一位桌面守護員。不能用現成卡通人物；你能不能指揮 AI 在 Blender 製作一隻轉到側面也有個性的小怪獸？」

這是 S-01 原創虛構委託，不是真有機構招聘。觀眾是同桌／另一組學生；請他看模型後指出最容易記住的一個地方。驅動問題：怎樣用少量形體，讓觀眾從不同角度認出你的設計意圖？

**使用者起點：**建模前先問一位同伴「桌面小角色最值得一眼看出的特徵是甚麼？」匿名記錄後由學生決定採用或不採用；它只是本組 brief，不是香港學生普遍喜好。

**今天必交：AI 在 Blender 操作後產生的一個可編輯原創角色 `.blend`、正／側／斜三視圖，以及 AI 按學生修訂指令產生的前後兩個模型版本。** 主作品不是角色設定表或提示詞。學生負責選擇與判斷，AI 負責 Blender 內所有建模、修改、另存與視圖輸出；學生不直接操作 Blender 物件或參數。最低版本只需身體、兩個辨識特徵、簡單底座；不做毛髮、骨骼、精細雕刻或打印。
核心版限於身體＋兩個特徵＋底座、同一視角前後版本和三張視圖；額外配件／材質屬延伸，不計入 30 分鐘核心承諾，也不能替代核心作品。

學生先選「它想做甚麼」（守書、守鉛筆、怕吵等）和「怎樣讓人看懂」（長耳、扁身、巨眼、背殼等），不是只選顏色。性格沒有唯一正解；造型是否傳達意圖要由觀眾反應檢查。先做一個 20 秒手勢／草圖，再開始造，不填長任務書。

**本課學習目標：**（1）把角色用途和兩個可觀察特徵寫成 AI 能執行的 Blender 建模委託；（2）從正、側、斜視圖判斷設計特徵有沒有被遮擋或偏離意圖；（3）根據同伴觀察提出一項具體修訂，讓 AI 產生新版本，再用相同視角核對。學生不學 Blender 介面、快捷鍵或手動建模；幾何和遮擋是設計判斷的知識，不是軟件操作考核。

## 2. 教師示範起點與 AI 動手路線

M-01 是原創重建例。現已有本機示範素材：起點 2 個物件、完整角色 9 個物件，包括可隨眼睛移動的瞳孔和微笑曲線。用 Blender 場景單位作相對比例，不宣稱真實物件尺寸。身體用球體拉成橢圓，眼睛用小球，耳朵可用拉長球體、圓錐或立方體，底座用扁圓柱。將物件命名 Body、EyeL、EyeR、EarL、EarR、Base，避免全叫 Cube。這些是教師 M 示例，不是學生創作成果；可獨立按文字重建，不要求照抄外觀。

[本機示範包](08-l01-blender-demo.md)是教師講解 AI 操作結果的參考，不提供學生下載後手動建模；[學生短任務卡](09-l01-student-mission.md)供上課直接使用。示範 v02 在學生先提出自己的 AI 修訂指令後再揭示。

製作順序：學生選兩個辨識特徵 → 用自然語言交代 AI 操作者 → AI 在 Blender 建立可編輯粗模並另存 v01、輸出三視圖 → 同伴指出一個看不清的地方 → 學生寫清自己的修訂意圖 → AI 只改指定部件並另存 v02 → 學生核對相同角度的前後差異。學生不需要選 Blender 物件、拖動部件或改參數。可換成原創小機械生物，不必全部做同一隻怪獸。

調查的小問題：「把耳朵拉長，側面會更好認，還是兩隻重疊了？」先猜，再試；保留不奏效版本的截圖也有價值。教師不預填同伴會猜甚麼。

## 3. structureContract｜約 30 分鐘核心創作節奏

`archetype: pbl-studio`。九場景是製作映射，不是九張講義。

表內分鐘均為待驗證的學習路徑 timebox，不是保證完成時限；超時可延續同一作品，不得刪作品產出、觀眾評議或修訂。

| 場景 | 環節／組件 | 學習路徑分鐘 | 學生動作與證據 |
| --- | --- | ---: | --- |
| L01-S1 | PBL 項目主線／驅動問題與作品簡報 | 2 | 進入 PBL v2 工作台，以「多角度能否認出角色」為主線，九個里程碑由此啟動並保存同一作品 |
| L01-S2 | 準備度／不計分起點 | 1 | 看正面與側面線索，說第一個想法或「未能判斷」；不計分、不考術語，記入 PBL 起點 |
| L01-S3 | 按需概念支架 | 2 | 只提供角度遮擋與模型缺件的檢查方法；學生回到自己的項目判斷，不進行連續講授 |
| L01-S4 | 簽名互動／多視角角色檢查 | 3 | 選特徵並預測視角變化，取得可見回饋後將決定帶回 PBL |
| L01-S5 | 調查／AI 原型指令 | 8 | 設定同角度比較，指揮 AI 建 v01 並輸出正、側、斜視；未執行不得聲稱已有結果 |
| L01-S6 | 同伴評議／證據缺口 | 3 | 挑戰「看不見等於不存在」的推論，提出需檢查的角度或模型證據，不作計分測驗 |
| L01-S7 | 學生修訂／v01→v02 | 6 | 由學生決定只改一項，核對同條件下的版本差異和未驗證部分 |
| L01-S8 | 作品展示／證據交付 | 3 | 在同一 PBL 項目提交可編輯模型、三視圖、版本差異和證據邊界 |
| L01-S9 | 反思遷移 | 2 | 把角色縮成小圖示，依新尺寸和角度決定保留哪個輪廓特徵及如何驗證 |

PBL 項目主線：OpenMAIC PBL v2 工作台在 S1 開場，按序保存驅動問題、準備度、簡報、調查、原型、評議、修訂、展示和遷移九個里程碑；互動頁只作項目支架，需把結果提交回對應里程碑。六功能：目標／成果與驅動問題 S1；激活 S2；主動建構 S4/S5；反饋修訂 S6/S7；評量證據 S1 的項目記錄與 S5–S8；遷移 S9。全課不放獨立答案測驗。30 分鐘仍是未經試教的整體路徑目標；不得以縮短回饋或修訂換取通過。

## 4. interactionContract｜兩個由學生指揮 AI 完成的操作

**課堂邊界：**以下 I1／I2 是課堂中由學生提出設計決定、教師監督、AI 操作者在 Blender 執行的工作流，不是現有 OpenMAIC 播放器內的 Blender 互動；學生不操作 Blender 介面。

### I1｜指揮 AI 修正被遮住的耳朵〔簽名互動〕

目的：用形體表達，而非增加無用細節。初始是只有身體的粗模。學生選兩個特徵，使用自然語言指揮 AI 操作物件位置、大小或輪廓；狀態為 featureChoice、learnerPrompt、operatorAction、blendVersion、viewEvidence、viewerGuess。可見結果是 AI 生成的同一角色在正、側、斜角度呈現不同輪廓；學生檢查而不直接編輯模型。

故意錯例 M-02：兩隻耳朵都在，從側視角看有一部分互相重疊；這不一定錯，要問是否符合學生原本意圖。反饋：「左耳仍在，只是這個角度被右耳擋住一部分。你想讓觀眾看到多少？」第二提示：請 AI 只移動左耳並保留其他物件。重試：要求 AI 以相同視角重新輸出，學生比較前後。證據：一次預測、一條指令、AI 生成的兩張同角度對比、觀眾實際回應；不要求觀眾猜中一個制式性格詞。

### I2｜指揮 AI 讓被遮住的瞳孔多露出來

目的：分辨平面截圖看似正確與立體遮擋。M-03 中兩隻眼睛及瞳孔均完整存在；從正面看，左瞳孔有一部分被身體遮住。學生用自然語言要求 AI 在 Blender 微調眼睛位置，AI 輸出修訂版與相同角度圖；狀態為 learnerPrompt、operatorAction、eyeTransform、inspectionView、revisionVersion。可見結果為瞳孔部分可見、遮擋減少，或眼睛有意地離身漂浮；不把遮擋描述成缺件，學生不親自移動模型。

反饋：「現在看見了，但它是否浮在身體前面？」第二提示：要求 AI 小幅修改、保留其他物件，再輸出正面與側面。重試：保留前版，只改眼睛，再核對正側面。證據：AI 產生的 v01／v02 `.blend`、同角度截圖、學生的修訂指令；AI 說「已修復」不算證據。若學生有意設計浮空眼睛，只要能清楚說明且多視角一致，可接受，不能把審美偏好判錯。

## 5. 卡住時才打開的救援卡

每卡 30–90 秒，不串成理論講座。

- AI 找不到物件：請 AI 先列出場景物件名稱並截圖核對，再指定物件；學生不進入 Blender 物件清單操作。
- 模型好像變形：要求 AI 同時輸出固定正、側、斜角，判斷是觀看角度改變還是物件幾何被改；不要求學生操作 Blender 相機或記三軸名稱。
- AI 一次加太多東西：退回身體＋兩個特徵，保留可獨立選取的部件。細節多不是分數高。
- 出圖很慢：先用可讀的工作視圖截圖交三視圖；必須來自真實模型，不以生圖代替。

教師只在學生遇到以上問題時補必要概念。旁白及講解全課設計上限 8 分鐘。

## 6. 給 Astra 的製作請求

學生先口頭說明方括號兩項，AI 不代選；由 AI 實際操作 Blender：

```text
你是本課的 AI Blender 操作者。請用學校已批准的本機工具在 Blender 4.5 LTS 製作低複雜度、可編輯的原創角色粗模。學生只會用自然語言下指令，不會直接操作 Blender 物件或輸入參數。
它想做：[我的角色用途]；最重要的兩個特徵：[我的選擇]。
先用約 6–10 個基本形體，只造粗模，部件分開並命名；兩眼兩耳都要完整存在。輸出正、側、斜三視圖。
不要做貼圖下載、毛髮、骨骼或最終精修。
只在本課指定資料夾另存 v01，不覆蓋原有檔案。不要要求學生開啟 Blender 操作。
展示正、側、斜視後停下，讓學生以口述／文字檢查並決定下一個改動；不要替學生選設計方向或撰寫反思。
如未能執行 Blender，清楚告訴我，不要用圖片聲稱模型已完成。
```

修訂請求：「同伴從［角度］看到［具體情況］。我的意圖是［選擇］。請你只在 Blender 調整［部件］，保留其他物件與 v01，另存 v02，並輸出相同角度供我比較。」學生至少作出並說明一次設計決策，再驗收 AI 的輸出；不得要求學生手動改物件，也不能把選擇、測試和反思全部交給 AI。

## 7. 怎樣算做到了

教師和同伴用作品現場驗收，不以術語小測代替。四項各 0–2：教師／AI 操作者確認檔案能重開且部件仍可編輯；兩個特徵有學生意圖；學生能指出一處多視角檢查；有針對反饋的實際改版。0＝未見，1＝有但需協助，2＝能展示並說明。建議總分至少 6/8，且檔案和改版兩項不得 0；這是本團隊試教判準，不是驗證量表。學生不用親自選取 Blender 部件。

教師隨機指一件部件，請學生說出一條讓 AI 修改或保留它的具體指令，並根據 AI 輸出說明是否接受；不要求學生在 Blender 親手移動物件。退出挑戰不另交文章：把作品縮成小圖，說出要保留哪個特徵及理由。合理答案可不同，必須用 AI 產出的作品證據支持。

## 8. 分層、觀眾及設計簽名

高小：身體＋兩種特徵，不加複雜配件；初中：不同角度表達同一意圖；進階：讓剪影也有辨識度。不以更多細節逼慢同學。兩人一機每 10 分鐘輪換「AI 指令者／輸出觀察員」，兩人都要提出一次修訂並檢查 AI 的結果，不輪流操作 Blender。

高小必做：從特徵圖卡選兩項，用句框完成一條建模指令並口述一處視角差異；初中必做：自行寫指令並用兩個視角支持一項修訂。每人單獨留下自己的指令、指認的遮擋證據及「保留／修改」理由；閱讀吃力者可口述或用圖卡，標準不因書寫能力降低。

AI 老師只追問想讓觀眾認出甚麼；AI 操作者依學生指令在 Blender 建立／修改模型；AI 同學扮演「我只看懂正面」的質疑者。真正同伴的反應另取，不讓 AI 虛構觀眾評價。

`designSignature`：玩具工作桌、可旋轉角色和三視圖並列；動效只顯示物件／視角變化。與最接近的已發布 T02-01 機械人感知課相比：操作是形體和遮擋而非感知閾值；版式是多視圖工作桌而非規則鏈；成果是可編輯角色而非規則卡。可重用播放器／可訪問控件，不重用雷達儀表、距離告警或感知教案。禁用品牌角色、只有換色的互動、純 AI 成品展示。

## 9. 畫面與口語分軌

- 畫面：轉到側面再看看：你想讓人認出的特徵，還看得到嗎？
- 粵語：轉去側邊睇吓先。你隻小怪獸最特別嗰個位，仲見唔見到？唔見咗就郁一郁，再俾同學估。
- 普通話：转到侧面看看。你的小怪兽最特别的地方，还看得见吗？调整一下，再请同学猜。

繁中、简中、English 學生閱讀文案及粵語、普通話、英文獨立旁白稿已完成；獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS（見 §15–§16 及總審核）。新版本地候選已合成 7 段香港粵語 `zh-HK-WanLungNeural`、`+20%` 旁白並通過檔案解碼；尚未人耳抽聽或在 OpenMAIC 玩家驗證。普通話稿不是粵語稿，亦不作缺音軌回退。靜音可完成任務。

## 10. 作品交接、私隱與保存

開課前置：須遵守[系列未成年人課堂工具與資料保護協議](00-series-index.md#52-未成年人課堂工具與資料保護前置協議)，由校方確認年齡條款、資料流、工作站權限、教師監督與回滾；文件內 prompt 不是系統安全控制。任一條件未確認，就不收學生輸入、不執行 Blender 工具，並如實標示實作未完成。

`portfolioInput`：不需要前課或素材；從本課 M-01 原始形體起步。
`portfolioOutput`：AI 在 Blender 產生的角色 v01／v02 .blend、正面／側面／斜視三張圖、一次同伴原話與學生的修訂指令／理由；文字記錄最多兩句。
`nextUse`：可把角色的耳朵、眼睛等原創造型用在第二課收納站，也可選完全不同角色。
`conceptRevisit`：從多個角度檢查；大形體與辨識特徵；修改一個變量再觀察。

本課檔名用 `G03_D01_L01_v01.blend`、`v02.blend`；圖片同前綴。只能操作本課指定資料夾，保留舊版，不覆蓋他人作品。提示詞不是權限沙箱；學校事前限制檔案及工具權限，不執行來源不明腳本、不關閉安全防護、不裝未知插件。AI 出錯保留錯誤、回復可用版；未完成就如實標記，不編造已生成或測試成功。

只用組別代號，不上傳學生姓名、人臉、聲音、學校平面圖、帳號畫面或家庭位置。文字、角色、形體與示意圖全部原創，不使用官方圖文、供應商示範作品或品牌角色。M 是課堂設定，S 是虛構任務，均不可代表香港現況；實際觀察另記，不能預填。成果是數碼創作／概念，不作工程安全、打印可用性或專業用途保證。

## 11. 一手研究依據與準確性邊界

核對快照：2026-09-22（前版已讀官方正文，今次不聲稱重新實測）。

1. [OpenAI Astra 創作案例](https://developers.openai.com/blog/architectural-visualization-with-astra) → R-01：以工具建立及修改可編輯場景的案例；不等於任何聊天頁面都可執行。
2. [Blender 4.5 Transform](https://docs.blender.org/manual/en/4.5/scene_layout/object/properties/transforms.html) → R-02：物件有位置、旋轉及縮放等可編輯變換；具體遮擋須看實際場景。
3. [Blender 腳本安全](https://docs.blender.org/manual/en/4.5/advanced/scripting/security.html) → R-03：腳本須在受控權限下使用。

以上只作研究依據，教學表述與視覺重新創作。軟件行為有來源，不代表本課提示詞、學校電腦效能、約 30 分鐘完成率或學生興趣已驗證。不可把 M 示例或 AI 回答寫成實測結果。

## 12. OpenMAIC 單課製作指令

本課約 30 分鐘只指整條學習路徑（OpenMAIC 引導＋校內受監督 AI-Blender 活動）的設計目標；不得將其當成播放器 runtime。課件生成後分別計量播放器活動時間和課內工具活動的實際總時間；未計時試教前不公開承諾 30 分鐘。

只製作 D01-01「桌面小怪獸」的候選引導，一課一文檔；不得生成其餘課或把本稿 13 節逐節朗讀。以第 1 節任務和作品開場，九場景採 `pbl-studio`。約 30 分鐘是全程學習路徑目標，不是 OpenMAIC 播放 runtime；課件生成後另測玩家活動時間，校內試教另測端到端總時長，兩者未取得證據前不得對外承諾 30 分鐘。最多兩張短說明頁，單次救援提示最長 90 秒，全課單向講解設計上限 8 分鐘。保留第 4 節 I1、I2 的初始狀態、具體失敗、反饋、重試和前後證據。時間表是未驗證設計目標；若生成耗時超標，先縮小模型範圍或讓作品跨課延續，不刪除 PBL 產出、反饋和修訂。

託管只做原創引導、按需提示和教練式討論候選。模型、動畫和投影必須在 Blender 真正執行；不讓學生按「完成」後就自動判通過。可編輯工作區的來源是本機 .blend；未來網站狀態或提交組件需另做確定性實作與驗證，不聲稱播放器已接通 Blender。

功能：Web 關（資料閉合）；image 關（教學關鍵圖須來自實際原創模型）；生成 video 關（不冒充 Blender 輸出）；託管 TTS 關（後續獨立語軌）；agents／discussion 開候選（各有任務，不能替學生選）；quiz 僅保留操作中誤區和離堂遷移，不作理論考試；interactive／PBL 保留真實作品編輯與返工，不以通用選擇題代替。學生可見工具名稱，不出現密鑰、帳號設定、供應商選擇器或作者導航。

## 13. 教師開課檢查與未完成門檻

- 課前由教師在學校電腦確認 AI 操作者可開啟教師 M 起點、按自然語言指令修改副本並輸出視圖；學生不操作 Blender。本機 Blender 4.5.14 已通過不代表學校設備／工具接駁也通過。示範檔不含嵌入腳本，無需開啟自動執行。
- 確認電腦＋滑鼠和 Astra 工具接駁；手機能看任務不等於能建模。老師若只能投影示範，不宣稱學生完成個人實作。
- 示範只到最小粗模；學生必須保留自己的選擇、指揮 AI、同伴測試及一次由 AI 執行的作品修訂。若 AI 操作鏈未接通，課堂只能標示未完成 Blender 實作，不可改成學生手動操作來冒充原定教學流程。
- 卡住先縮減細節或修局部；不能用生成圖片、填表或聽講替代本課作品。若素材／設備不合格，先完成準備，不虛報通過。
- 歷史設計階段獨立重評曾為 97.5/100、`SHIP`，只允許進入 generation-prep；後續 generation review 曾授權並提交一個 D01-01 hosted 候選（job `dRctH0E-cv`／classroom `ieDmKjpXBs`），但該原稿未通過當前 PBL 主線門，不能當作修正版。2026-09-30 的本地確定性 PBL v2 候選尚未導入播放器；學生實操、真人試教、校方工具服務安全證據及課時仍未驗證。

## 14. 可訪問性與窄屏完成規格（待成品測試）

- 核心路徑不使用拖放或只靠顏色／聲音的提示；所有選擇、場景切換、複製指令及提交欄位以原生按鈕、單選、標籤和文字輸入完成，Tab／Shift+Tab／Enter／Space 可走完，焦點清楚可見，反饋使用 `aria-live` 宣讀。
- 390×844 手機版採單欄：先選用途與特徵，再展示可複製指令和同角度比較；觸控目標至少 55px，視圖示例可逐張切換，不要求橫向捲動。手機完成 OpenMAIC 的選擇、指令草擬、反饋及個人學習記錄；Blender 由校方工作站上的 AI 操作者執行，學生不須在手機操作 Blender。
- 正／側／斜視角除圖像外，另有文字標籤和「左耳／右耳／兩眼仍存在」檢查提示；使用者可放大頁面，動效遵從減少動態偏好。無圖像時保留文字任務，不把示例當作學生輸出。
- 待驗收：桌面與 390×844 真瀏覽器各完成「先預測—複製 AI 指令—記錄實際視圖觀察—提出 v02 修訂—離堂遷移」；以鍵盤重走相同路徑，檢查焦點、朗讀標籤、回饋與控制台。此規格不是成品已通過的證據。

## 15. D01-01 九場景閱讀稿與三條獨立口語稿

使用規則：屏幕文案與語音稿分開存放，不把粵語稿交給普通話音色，也不要求 TTS 逐字朗讀屏幕內容。§15 提供九場景的繁中、简中、English 閱讀引導與三條獨立口語稿；§16 補齊互動回饋、救援卡、可複製指令、評量和告知。獨立審核判定本課 Q16 文案設計通過。語音可跳過；靜音也能完成所有任務。OpenMAIC 生成時關閉託管 TTS；合成後仍須分軌試聽和 runtime 驗收。

### S1｜接任務與學習目標

- 繁中屏幕：本課會學用多視角分辨特徵是被遮擋還是模型缺件。你的設計你作主；AI 操作 Blender。最後交可編輯角色、三視圖和一次有理由的修訂。
- 简中屏幕：本课会学习用多个视角分辨特征是被遮挡还是模型缺件。设计由你作主，AI 操作 Blender。最后提交可编辑角色、三视图和一次有理由的修改。
- English screen: Learn to use multiple views to tell whether a feature is hidden or missing. You make the design choices; AI operates Blender. Deliver an editable character, three views, and one reasoned revision.
- 粵語口語：今課會學用幾個角度分清楚，特徵係畀嘢遮住，定係模型真係冇做。設計由你決定，AI 操作 Blender；最後交角色、三視圖同一次有理由嘅修改。
- 普通話口語：这节课会学习用多个角度判断特征是被遮挡还是模型里确实没有。设计由你决定，AI 操作 Blender；最后提交角色、三视图和一次有理由的修改。
- English narration: Learn to use several views to tell whether a feature is occluded or really missing. You make the design choices; AI operates Blender. Deliver the character, three views, and one reasoned revision.

### S2｜先說第一個想法（不計分）

- 繁中屏幕：先看正面與側面。側面看不到左耳時，你的第一個想法是甚麼？也可以說「未能判斷」。這不是考試、不計分；稍後用核心概念和作品證據核對。
- 简中屏幕：先看正面和侧面。侧面看不到左耳时，你的第一个想法是什么？也可以说“暂时不能判断”。这不是考试、不计分；稍后用核心概念和作品证据核对。
- English screen: Compare the front and side views. If the left ear is not visible from the side, what is your first thought? “I can’t tell yet” is fine. This is not a test and is not scored; we will check it against the concept and evidence later.
- 粵語口語：側面睇唔到左耳，你第一個諗法係乜？答「而家未肯定」都得。呢度唔係考試，唔計分；學完檢查方法再返嚟核對。
- 普通話口語：侧面看不到左耳时，你第一反应是什么？回答“现在还不能确定”也可以。这不是考试，不计分；学完检查方法后再回来验证。
- English narration: What is your first thought when the left ear is not visible from the side? “I can’t tell yet” is fine. This is not a test; we will check again after learning the method.

### S3｜選方向

- 繁中屏幕：先選角色用途，再選兩個看得見的特徵；不要只改顏色。
- 简中屏幕：先选角色用途，再选两个看得见的特征；不要只改颜色。
- English screen: Choose a purpose and two visible features. A colour change alone is not a design feature.
- 粵語口語：佢想幫你做乜？再揀兩個真係會改變外形嘅特徵。你可以揀長耳、背殼或者一高一低嘅角，唔使跟示範。
- 普通話口語：它想帮你做什么？再选两个确实会改变外形的特征。可以是长耳朵、背壳或高低不同的角，不必照着示例做。
- English narration: What would your creature do? Choose two features that change its shape, such as long ears, a shell, or uneven horns. Your design does not have to match the example.

### S4｜先猜，再指揮

- 繁中屏幕：查看右側面前，先預測左耳會露出多少；之後用相同角度核對。
- 简中屏幕：查看右侧面前，先预测左耳会露出多少；之后用相同角度核对。
- English screen: Before checking the right-side view, predict how much of the left ear will remain visible.
- 粵語口語：未睇右側面之前，你估左耳會露幾多？先揀一個預測，再叫 AI 郁指定部件；睇返同一個角度有咩變化。
- 普通話口語：看右侧面之前，你猜左耳会露出多少？先留下预测，再请 AI 按你的指示调整指定部件，并用同一角度比较变化。
- English narration: Before you inspect the side view, predict how much of the left ear will show. Record your prediction, ask AI to change only the named part, and compare from the same angle.

### S5｜做初稿

- 繁中屏幕：把用途和兩個特徵交給 AI；要求它另存 v01 並輸出正、側、斜三視圖。
- 简中屏幕：把用途和两个特征交给 AI；要求它另存 v01 并输出正面、侧面和斜角三视图。
- English screen: Give AI your purpose and two features. Ask it to save v01 and export front, side, and oblique views.
- 粵語口語：而家將你揀嘅用途同特徵講畀 AI 聽。由 AI 喺 Blender 起粗模、另存 v01，再輸出三個角度。未有真檔案之前，唔好當佢已經完成。
- 普通話口語：现在把你选的用途和特征告诉 AI。由 AI 在 Blender 制作粗模、另存 v01，再输出三个角度。没有真实文件前，不要把它当作已经完成。
- English narration: Now tell AI your chosen purpose and features. AI should build a rough model in Blender, save v01, and export three views. Do not count it as complete until the files actually exist.

### S6｜同伴評議

- 繁中屏幕：先不解說，請同伴看三視圖；記錄他實際指出的一處，不寫姓名。
- 简中屏幕：先不解释，请同伴看三视图；记录他实际指出的一处，不写姓名。
- English screen: Without explaining, show a peer the three views. Record one thing they actually notice; do not record their name.
- 粵語口語：先唔好講角色設定，俾同學睇三張圖。問佢第一眼留意到乜，記低實際觀察就得，唔使寫名，亦唔好估佢會點答。
- 普通話口語：先不要解释角色设定，把三张图给同伴看。问他第一眼注意到什么，只记录实际观察，不写姓名，也不要预设他的回答。
- English narration: Do not explain your character yet. Show the three views to a peer and ask what they notice first. Record only what they actually say, without a name.

### S7｜指揮修訂

- 繁中屏幕：選一處要改的地方，說明原因；請 AI 保留 v01，另存 v02 並輸出相同角度。
- 简中屏幕：选一处要修改的地方，说明原因；请 AI 保留 v01，另存 v02 并输出相同角度。
- English screen: Choose one change and explain why. Ask AI to keep v01, save v02, and export the same views.
- 粵語口語：同學睇唔清邊個位？你揀一樣要改嘅，講清楚原因。叫 AI 保留 v01、只改指定部件、另存 v02，再用同一角度比較。
- 普通話口語：同伴看不清哪个地方？由你选择一项修改并说明原因。请 AI 保留 v01，只改指定部件，另存 v02，再用相同角度比较。
- English narration: What was hard for your peer to see? You choose one change and explain why. Ask AI to preserve v01, change only that part, save v02, and export matching views.

### S8｜展示

- 繁中屏幕：並排展示你的 v01 和 v02；指出實際改了甚麼，以及理由。
- 简中屏幕：并排展示你的 v01 和 v02；指出实际改了什么，以及理由。
- English screen: Show your own v01 and v02 side by side. Point out what changed and why.
- 粵語口語：將你自己嘅 v01 同 v02 擺埋一齊。指住實際改動嘅位置，講一講點解要咁改。老師示範唔係你嘅作品。
- 普通話口語：把你自己的 v01 和 v02 并排展示。指出实际改动的位置，并说明为什么这样修改。教师示例不是你的作品。
- English narration: Put your own v01 and v02 side by side. Point to the actual change and explain your reason. The teacher’s example is not your work.

### S9｜帶走作品與遷移

- 繁中屏幕：如果角色縮成小圖示，你會保留哪個特徵？用三視圖說明你的選擇。
- 简中屏幕：如果角色缩成小图标，你会保留哪个特征？用三视图说明你的选择。
- English screen: If your character became a small icon, which feature would you keep? Use the three views to explain.
- 粵語口語：如果隻小怪獸縮到好細，你最想保留邊個特徵？用你真正嘅三視圖講理由，再帶走 .blend 同兩個版本。
- 普通話口語：如果小怪兽缩得很小，你最想保留哪个特征？用你真实的三视图说明理由，并带走 .blend 和两个版本。
- English narration: If your creature were reduced to a tiny icon, which feature would you keep? Use your actual views to explain, then take your .blend file and both versions with you.

## 16. Q16 補件：學生可見材料的閱讀語言覆蓋矩陣（文案設計 PASS）

語言功能分開：繁體中文（香港）、简体中文、English 是畫面閱讀選項；粵語、普通話、English 是各自撰寫的旁白選項。旁白只讀本課 §15 對應場景稿，不把粵語畫面文案交給普通話音色；互動標籤和可複製指令不靠旁白才能理解。以下材料是 OpenMAIC 作者應採用的學生可見版本，不是教師規劃全文。畫面切換時所有按鈕、欄位、提示、回饋和作業欄須同步換語；切換不改變學生已輸入內容。粵語口語不另造第四種書面作業版本。

### S4｜被遮住的耳朵：互動文字

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 先預測左耳在右側視圖會露出多少：全部／一部分／看不到。請 AI 只調整左耳，保留其他部件；輸出前後相同角度。 | 先预测左耳在右侧视图会露出多少：全部／一部分／看不到。请 AI 只调整左耳，保留其他部件；输出修改前后相同角度。 | Predict how much of the left ear will show in the right-side view: all, partly, or not at all. Ask AI to adjust only the left ear, keep every other part, and export matching before-and-after views. |
| 第一次反饋：耳朵仍在，只是從這個角度被遮住一部分。這符合你的原意嗎？ | 第一次反馈：耳朵还在，只是从这个角度被遮住了一部分。这符合你的原意吗？ | The ear is still there; this view partly hides it. Does that match your intention? |
| 再試提示：只移動左耳少許，保留大小、身體和右耳；用同一角度再看。 | 重试提示：只移动左耳一点，保留大小、身体和右耳；再从同一角度检查。 | Try again: move only the left ear a little. Keep its size, the body, and the right ear unchanged; check from the same view. |

### S4｜瞳孔遮擋：互動文字

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 兩隻眼睛和瞳孔都在。選擇：保留部分遮擋／讓瞳孔多露出一點。請 AI 只調整眼睛位置，再看正面和側面。 | 两只眼睛和瞳孔都在。选择：保留部分遮挡／让瞳孔多露出一点。请 AI 只调整眼睛位置，再看正面和侧面。 | Both eyes and pupils are present. Choose: keep the partial occlusion, or reveal a little more of the pupil. Ask AI to adjust only the eye position, then inspect front and side views. |
| 第一次反饋：現在看得更清楚了；側面看起來仍貼在身體上嗎？ | 第一次反馈：现在看得更清楚了；从侧面看，它还贴在身体上吗？ | It is easier to see now. From the side, does it still look attached to the body? |
| 再試提示：保留身體與另一隻眼，只微調這隻眼；輸出正面、側面同角度比較。 | 重试提示：保留身体和另一只眼，只微调这只眼；输出正面、侧面作同角度比较。 | Try again: keep the body and the other eye unchanged. Adjust only this eye, then export matching front and side views. |

### S5｜可複製的 Blender 委託

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 我設計的角色用途是：[由我填]；兩個辨識特徵是：[由我填]。請在 Blender 4.5 LTS 製作低細節、可編輯的原創粗模，部件分開命名；兩眼兩耳都要存在。只保存到本課資料夾為 v01，不覆蓋其他檔案。輸出正面、右側面、斜角三視圖後停下，等我檢查。不要替我選設計，不要用圖片代替 .blend；若不能執行 Blender，請明說。 | 我设计的角色用途是：[由我填写]；两个辨识特征是：[由我填写]。请在 Blender 4.5 LTS 制作低细节、可编辑的原创粗模，部件分开命名；两只眼睛和两只耳朵都必须存在。只保存到本课文件夹为 v01，不覆盖其他文件。输出正面、右侧面、斜角三视图后停下，等我检查。不要替我选择设计，也不要用图片代替 .blend；如果不能运行 Blender，请说明。 | My character's purpose is [my choice], with these two defining features: [my choices]. In Blender 4.5 LTS, create a low-detail, editable original rough model with separately named parts; both eyes and both ears must exist. Save v01 only in this lesson folder without overwriting other files. Export front, right-side, and oblique views, then stop for my review. Do not choose the design for me or substitute an image for the .blend file. If Blender cannot be operated, say so. |

### S6–S7｜同伴觀察與修訂

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 同伴只看三視圖，不先聽角色設定。記錄一項實際觀察，不寫姓名、不猜答案。 | 同伴只看三视图，不先听角色设定。记录一项实际观察，不写姓名、不预设答案。 | Show a peer the three views without explaining the character first. Record one actual observation, without a name or a guessed response. |
| 修訂指令：同伴在[角度]看不清[部件]。我的設計意圖是[由我填]。請只調整[指定部件]，保留其他物件和 v01，另存 v02，輸出同一角度讓我比較。 | 修改指令：同伴从[角度]看不清[部件]。我的设计意图是[由我填写]。请只调整[指定部件]，保留其他物件和 v01，另存 v02，并输出相同角度让我比较。 | Revision request: My peer could not see [part] from [view]. My intention is [my choice]. Adjust only [named part], keep every other object and v01, save as v02, and export the same view for comparison. |
| 驗收：我能指出改動位置、說明理由，並比較同角度的 v01／v02。若 .blend 不能重開或只有圖片，作品未完成。 | 验收：我能指出修改位置、说明理由，并比较同角度的 v01／v02。如果 .blend 不能重新打开，或只有图片，作品就未完成。 | Check: I can point to the change, explain why, and compare v01/v02 from the same view. If the .blend cannot be reopened or only an image exists, the work is not complete. |

### S4–S9｜按需救援卡與評量欄

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 找不到部件：請 AI 列出場景物件名稱並輸出截圖；不要自行進入 Blender 操作。 | 找不到部件：请 AI 列出场景物件名称并输出截图；不要自己进入 Blender 操作。 | Part not found: ask AI to list the scene objects and show a screenshot. Do not operate Blender yourself. |
| 看不出角度差異：請 AI 用固定正面、右側面和斜角重新輸出；先判斷是視角改變還是模型真的改了。 | 看不出角度差异：请 AI 用固定正面、右侧面和斜角重新输出；先判断是视角变化还是模型真的改变了。 | Views are unclear: ask AI to export fixed front, right-side, and oblique views. First decide whether the view changed or the model did. |
| AI 一次加太多東西：請它退回「身體＋兩個特徵＋底座」，只保留我選的設計。 | AI 一次加了太多东西：请它退回“身体＋两个特征＋底座”，只保留我选的设计。 | Too many details: ask AI to return to a body, two features, and a base, keeping only your chosen design. |
| 出圖很慢：請 AI 先從真正模型輸出可讀的工作視圖；圖片不能代替 .blend。 | 导出图片太慢：请 AI 先从真实模型输出清晰的工作视图；图片不能代替 .blend。 | Export is slow: ask AI to produce clear working views from the actual model first. An image cannot replace the .blend file. |
| 評量四項：可重開 .blend；兩個特徵來自我的選擇；我能指出一項多視角觀察；我按實際回饋完成一次修訂。每項 0＝未見、1＝有但需協助、2＝能展示並說明；建議至少 6/8，而且檔案可重開與實際改版兩項都不可為 0。這是本課建議檢視線，不是香港標準。 | 评价四项：.blend 可重新打开；两个特征来自我的选择；我能指出一项多视角观察；我根据实际反馈完成一次修改。每项 0＝未看到，1＝有证据但需要帮助，2＝能展示并说明；建议至少 6/8，而且文件可重开和实际修改这两项都不能为 0。这是本课建议检查线，不是香港标准。 | Four checks: the .blend reopens; both features reflect your choices; you identify one multi-view observation; and you make one revision based on actual feedback. Score 0 = not shown, 1 = shown with help, 2 = demonstrated and explained. Suggested threshold: at least 6/8, with neither reopening the file nor making a real revision scoring 0. This is a lesson suggestion, not a Hong Kong standard. |
| 離堂：如果角色縮成小圖示，我會保留[特徵]，因為[理由]；這是我的判斷，不需猜教師答案。 | 离堂：如果角色缩成小图标，我会保留[特征]，因为[理由]；这是我的判断，不用猜老师想要的答案。 | Exit reflection: If the character became a small icon, I would keep [feature] because [reason]. This is my judgment; there is no teacher answer to guess. |

### 全課必要告知與介面欄位

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 你只用自然語言指揮 AI；AI 在校方指定工作站操作 Blender。未經學校確認工具年齡條款、資料流、權限及教師監督前，不輸入真名、照片、聲音、帳號或學校位置資料，也不執行工具操作。遇到未批准服務或未知腳本，立即停止並通知教師。 | 你只用自然语言指挥 AI；AI 在学校指定的工作站操作 Blender。学校确认工具年龄条款、数据流、权限和教师监督前，不输入真实姓名、照片、声音、账号或学校位置资料，也不执行工具操作。遇到未批准的服务或未知脚本，立即停止并告诉老师。 | You direct AI in natural language; AI operates Blender on a school-designated workstation. Until the school has checked age terms, data flow, permissions, and teacher supervision, do not enter real names, photos, voices, account details, or school-location data, and do not run tools. Stop and tell your teacher if a service is unapproved or a script is unfamiliar. |
| 介面標籤：我的用途／辨識特徵／我的預測／同伴實際觀察／我的修訂理由／複製給 AI／保存 v01／保存 v02／重新開始（保留舊版）／提交作品。 | 界面标签：我的用途／辨识特征／我的预测／同伴实际观察／我的修改理由／复制给 AI／保存 v01／保存 v02／重新开始（保留旧版）／提交作品。 | Interface labels: My purpose / Defining features / My prediction / Peer observation / My reason for revising / Copy to AI / Save v01 / Save v02 / Start again (keep earlier versions) / Submit work. |
| 粵語旁白只用 §15 的粵語口語稿，普通話旁白只用 §15 的普通話稿，英文旁白只用英文稿。§16 的完整操作文字以所選閱讀語言顯示，不由任一旁白音色跨語種代讀。 | 粤语旁白只用 §15 的粤语口语稿，普通话旁白只用 §15 的普通话稿，英文旁白只用英文稿。§16 的完整操作文字以所选阅读语言显示，不用其他语言音色代读。 | Cantonese narration uses only the Cantonese scripts in §15; Mandarin narration uses only the Mandarin scripts; English narration uses only the English scripts. Full instructions in §16 remain on screen in the selected reading language and are not read in another language. |

教師只在 §16 的救援卡被觸發時展示，評量逐項標準會向學生顯示；兩者均有三語文字。獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS。§14 真瀏覽器切換、音頻合成試聽和播放器測試仍未做；此 PASS 不代表音頻或學生端 runtime 通過。

## 17. OpenMAIC 原生組件藍圖（生成輸入範圍）

結構原型 `pbl-studio`。最終組裝須由 S1 的 OpenMAIC PBL v2 工作台啟動九階段同一項目；調查、簽名互動、評議、修訂和展示頁只是支架，學生須把可核對結果提交回對應里程碑。S2 為不計分起點；本課不設獨立 quiz。托管生成只負責短引導與角色候選；複雜互動、項目狀態及工作台採確定性本地組裝與測試。托管生成不得生成 interactive HTML、PBL 工作區或 JavaScript；web search、image/video generation、hosted TTS 關閉；不得假稱 Blender 已執行。

確定性本機 I1「多視角辨識選擇」保存學生的角色用途、特徵、理由及實際正／側視觀察；I2「同角度修訂比較」只准改一項特徵，保存 v01/v02 與比較理由。本地工作台提供缺項提示、修訂重試和裝置內保存；創作選擇不判唯一正解。工作台輸出的只是交給 AI 操作者的指令草稿，不連模型、不控制 Blender。

本次生成候選僅供教師審閱、不含學生資料、不接入學生網站；生成課堂連結可能可由持有連結者打開，審核通過前不分享。校方核實年齡條款、資料流、權限隔離及監督前不開放學生工具活動。G2 通過後每份 manifest 只提交一次，生成仍不代表 import／release 通過。
