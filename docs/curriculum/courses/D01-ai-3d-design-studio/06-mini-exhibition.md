# D01-06｜迷你奇想展

版本：v0.4.2 課時定義澄清｜2026-09-28｜design SHIP（97.5/100，僅進入 generation-prep）；播放器與校內時長未實測，尚未生成／發布。
角色分工修訂：學生負責策展、布局與觀看次序的選擇、自然語言指令、觀察與驗收；AI 操作者負責 Blender 內所有建模、移動、測試、保存及導覽視圖輸出。學生不直接操作 Blender。
對象：中一至中二；小五至小六做開放展台。目標完整學習路徑約 30 分鐘；這是包括校內 AI-Blender 操作的總時長目標，不是 OpenMAIC 播放時長，播放器時長尚未知。
工具：Astra（GPT-6 Astra）＋具本機工具能力的 Codex；Blender 4.5 LTS。訂閱、帳號、設備和接駁由學校負責。

## 1. 最後一課仍然要做新作品

S-01 原創虛構委託：「奇想展需要兩件作品和一個清楚的入口；請讓第一次到場的觀眾不用聽解說，也能自己開始探索。」這是本課設計情境，不代表香港學校或展覽已提出此需求。

「把兩件你最想讓人看到的作品，變成一場小小奇想展。你不是把檔案放進資料夾，而是設計觀眾怎樣走近、看懂和想試。」

驅動問題：沒有設計師在旁逐句解說，觀眾還能開始探索嗎？核心版由學生決定展覽主題、取捨兩件作品、入口及觀看次序；第三件是延伸挑戰。可以保留觀眾自由探索，不強制唯一動線。

**必交：新建的微型展覽場景 .blend，兩個展位、入口和一個主焦點，v01／v02，以及入口／焦點／全景三張導覽圖。** 最後作 30 秒現場介紹，不要求錄學生聲音。整理文件或製作 PPT 不能取代新展覽模型；不把前五課原檔壓縮就算第六件作品。
核心版使用兩件既有課程作品或教師預備的匿名低細節副本，建一個單層小展、兩個展位、一個入口／焦點和三張導覽圖；第三展位、額外造景與動畫屬延伸，不計入 30 分鐘核心承諾，也不覆蓋原作品。

**本課學習目標：**（1）按展覽主題挑選兩件核心作品並說明主焦點與取捨；（2）指揮 AI 在 Blender 建立新的展場副本，安排入口、展位與觀看次序，確保原作品不被覆蓋；（3）讓真實觀眾在不聽解說時試看，根據實際反應選一項布局／視線修改，要求 AI 另存 v02 並重開核對。證據包括新場景、三張導覽圖、原始觀眾反應及學生的修改理由；沒有邀到課外觀眾就如實標示為班內試展。第三件展品是核心版完成後的延伸，不列最低達標條件。

最低是單層開放展台，不建整棟博物館，不做網站、遊戲引擎、VR 或電影導覽。兩件核心作品可以用副本降細節展出；第三件及更多展品屬延伸；原檔保留供觀眾另開查看。

## 2. 起點與觀眾安排

M-01 重建例：以相對單位做 14×10 的底板，入口在負 Y；兩個核心展台中心可從 (-3,1)、(3,1) 起步，單台 2×2；第三展位是延伸選項。上述不是消防、通道或建築標準。

連續班核心版：從前課挑兩件作品，不必把全部物件匯入拖慢電腦。把副本整理為分開命名的展品集合；採統一展示尺度，標示為縮放展示，不暗改原作品尺寸。若第三件能在 timebox 內完成匯入和檢查，作為延伸展品。

獨立班沒有任何資產也能起步：用方塊疊成高矮塔、用一球兩角做原創小角色作為兩件核心展品；以長方體拼拱形雕塑是第三件延伸選項。這是 M-02 文字重建支架，不是現成檔案；學生先選一個共同主題並修改兩件展品或其布局。素材是支架創作，不能聲稱是其前五課成果。該獨立版完成時間須另外試教，不預設與連續班相同。

開課前由學校邀請另一班小組或非任課教師，在本課後半段參觀。不需公開上網。若未安排到，只可作同伴內部試展，記「課外觀眾未完成」，不能宣稱已完成整套 PBL 對外展示。觀眾不用姓名，人數與反饋如實記，不預填推薦語。

## 3. structureContract｜邊建展場邊接待

`archetype: pbl-studio`。

表內分鐘均為待驗證的學習路徑 timebox，不是保證完成時限；超時可延續同一作品，不得刪作品產出、觀眾評議或修訂。

| 場景 | 環節／組件 | 學習路徑分鐘 | 學生動作與證據 |
| --- | --- | ---: | --- |
| L06-S1 | PBL 項目主線／驅動問題與作品簡報 | 2 | 進入 PBL v2 工作台，以「觀眾能否找到入口和焦點」為主線，保存同一展場的九階段證據 |
| L06-S2 | 準備度／不計分起點 | 1 | 看設計預期與觀眾第一眼不一致情境，說最想先知道甚麼；不計分，記入項目起點 |
| L06-S3 | 按需概念支架 | 2 | 需要時參考設計者預期、真實反應和小樣本推論限制，再回到展場項目 |
| L06-S4 | 簽名互動／入口與焦點選擇 | 3 | 選兩件展品和入口視角，預測第一眼並取得可見回饋 |
| L06-S5 | 調查／AI 原型指令 | 8 | 指揮 AI 建展場副本 v01，輸出入口視角並記錄真實盲看；無觀眾時如實標未完成 |
| L06-S6 | 同伴評議／證據缺口 | 3 | 挑戰設計者的自我判斷，指出還缺哪項真實觀眾證據；不虛構反應 |
| L06-S7 | 學生修訂／v01→v02 | 6 | 根據實際反應由學生決定只改一項布局，核對前後版本 |
| L06-S8 | 作品展示／證據交付 | 3 | 在同一 PBL 項目提交展場副本、入口、焦點及觀眾反饋證據 |
| L06-S9 | 反思遷移 | 2 | 換一件主焦點，指出入口視角要改哪一項及需取得甚麼新證據 |

PBL 項目主線：OpenMAIC PBL v2 工作台在 S1 開場，按序保存驅動問題、準備度、簡報、調查、原型、評議、修訂、展示和遷移九個里程碑；互動頁只作項目支架，結果需提交回對應里程碑。六功能：目標／成果與驅動問題 S1；激活 S2；主動建構 S4/S5；反饋修訂 S6/S7；評量證據 S1 項目記錄及 S5–S8；遷移 S9。全課不放獨立答案測驗。30 分鐘仍是未經試教的整體路徑目標；觀眾時間須預約，不把等候佔用實作時段。

## 4. interactionContract｜沒有解說也想探索

**課堂邊界：**以下 I1／I2 是課堂中由學生提出設計決定、教師監督、AI 操作者在 Blender 執行的工作流，不是現有 OpenMAIC 播放器內的 Blender 互動；學生不操作 Blender 介面。

### I1｜十秒第一眼〔簽名互動〕

學生選入口相機和焦點，給觀眾先看約十秒，不問「你有看到中間那件嗎」之類誘導問題；state＝entranceView、exhibitLayout、focalChoice、firstSelectedExhibit、viewerReason。可見結果是觀眾先注意到哪件、想做甚麼，和設計意圖比較。

錯例 M-03：老師說主展品在中央，實際被前方高展台擋住。反饋：「觀眾說先看到的是甚麼？他站在哪個位置？」第二提示：只移一個擋視線的展位或改相機，再給另一位觀眾看。重試不保證選擇一致；證據是兩版入口圖和原話，不能用十秒反應算普遍喜好。

### I2｜換個位置，還能看懂嗎？

學生選定兩個觀看位置，指揮 AI 移一個展位或改展示方向，再檢查標示和視線；state＝learnerPrompt、viewpoints、exhibitOrientation、cueVisibility、revisionDecision。可見結果是從另一邊看能否辨認入口、主題和謎題的操作方法。

錯例：影子謎底在入口就曝光，觀眾沒有先猜的機會；或操作提示只有大段文字。反饋指出體驗在哪一步斷掉。第二提示：把揭曉轉向另一面或調整先後，不追加一大頁解釋。重試讓觀眾自己選看法，不由設計師代操作。證據：改前／後一對視圖，觀眾嘗試和學生取捨。若不展影子作品，改為本組真正展品的觀看／互動問題，不硬套。

## 5. 需要時才給的策展救援

- 全部都想放：核心版先選兩件最能回應主題的；第三件只有核心版本已完成且有時間時才加入。展示有所取捨不是刪學習成果，原檔仍保留。
- 模型匯入太大／太小：只在展示副本調比例，明示不是實物比例；不回寫收納站的原始尺寸。
- 不知焦點在哪：先看入口視圖，改位置、遮擋或大小；不靠閃光、音效或只有顏色。
- 打開檔案缺物件：確認展品數據在交付檔中、沒有依賴找不到的外部路徑，再由另一人重開驗證；不要只驗自己的預覽。

每卡最多 90 秒，全課單向講解上限 8 分鐘。未驗證的匯入流程要在試教前做好，不讓學生花一課修環境。

## 6. Astra 請求

```text
我要做一個原創微型展覽場景，主題：[我的主題]。
我選的兩件核心展品：[作品名或本課M-02重建物]；主焦點：[我的選擇]。第三件只在核心版通過後加入。
Blender 4.5 LTS，單層開放展台，先有入口與兩個核心展位，不做建築外殼；時間充裕再加第三展位。
只使用我指定的本課文件，另建展示副本，保留原始作品不覆蓋。
先出兩種粗布局，讓我選一種並指出要移動的展位；由你在 Blender 執行後保存 v01，不要要求我操作 Blender。
不要代寫觀眾反饋、讚賞或我的導覽心得；不要發布任何內容到網上。
只在本課指定資料夾工作，未重開驗證就標未驗證。
```

修訂：「觀眾先注意［實際回應］，但我想讓他先理解［自己的意圖］。請只按我的決定調整［布局／方向／線索］，另存 v02，讓觀眾再次嘗試。」

## 7. 這次評作品，不評誰最會背講稿

四項各 0–2：教師／AI 操作者確認新展覽檔能重開且有兩個核心展位；主題、選品與布局有學生決策；觀眾能實際嘗試且學生能指出一個問題；有針對反饋指揮 AI 修改模型。0 未見、1 需協助、2 能展示並說明；建議 6/8，新場景與改版不得 0。課外觀眾是否參與另記，不用高分掩蓋未完成。

導覽只需「我想讓你先看＿＿；你們剛才＿＿；所以我改了＿＿」。學生可以現場指模型和口述，不由 AI 代寫漂亮長稿。作品未完也可展示有根據的修正，不要求虛構成功。

遷移：下次觀眾換成較小的小朋友，指出一個操作／視覺門檻並現場改一處。這是新的設計假設，不冒充已調查幼童能力。

## 8. 支架、角色和設計簽名

高小使用單平面展台、兩個核心展位和 AI 輸出視角；初中加入入口／焦點的多視角比較；進階設計不同觀眾的兩種布局。不另加網站製作。慢組簡化展台，不取消觀眾反饋或 AI 返工。

高小必做：以主題卡挑兩件核心展品、用圖示排入口與焦點並口述理由；初中必做：自行完成展覽 brief，說明選品取捨及觀眾次序。每人各自留一項策展選擇、一條 AI 指令、一項真實觀眾觀察及一條修訂理由；無須長篇導覽稿或錄音。連續班可用前課副本；獨立班以本課文字起點重建兩件核心展品，第三件作延伸，最低作品和評價標準不變，該版時長仍待試教。

AI 老師問主題和取捨；助教只查文件／物件完整性；AI 同學當練習觀眾提出疑惑，正式驗收仍需真實人。兩人一機均要講一個決策、改一件展位。

`designSignature`：策展沙盤、入口視角及觀眾路徑；相較已發布 T02-01，操作由閾值規則轉為觀眾選擇和布局，構圖由規則鏈轉為展位全景／近景，成果由規則卡轉為新的可編輯展覽。相對 D01-03，目標是觀眾理解和體驗順序，不只是角色通過。禁止假觀眾推薦語、品牌博物館仿作、用文件整理冒充第六件作品。共用播放器基建，不搬雷達或感知視覺。

## 9. 畫面與口語分軌

- 畫面：觀眾第一次來，知道從哪裏開始、看甚麼、玩甚麼嗎？
- 粵語：你唔喺旁邊解畫，觀眾仲知唔知由邊度開始？等佢自己揀先，再睇吓邊個位要改。
- 普通話：如果你不在旁边解释，观众还知道从哪里开始吗？先让他自己选择，再看看哪个地方需要修改。

繁中、简中、English 學生閱讀文案及粵語、普通話、英文獨立旁白稿已完成；獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS（見 §15 及總審核）。音頻尚未合成、試聽或接入播放器；粵語目標語速 1.2 倍，只在一層加速。靜音可完成任務，不用普通話讀粵語文案，也不在缺音軌時跨語種替代。

## 10. 作品交接、私隱與保存

開課前置：須遵守[系列未成年人課堂工具與資料保護協議](00-series-index.md#52-未成年人課堂工具與資料保護前置協議)，由校方確認年齡條款、資料流、工作站權限、教師監督與回滾；文件內 prompt 不是系統安全控制。任一條件未確認，就不收學生輸入、不執行 Blender 工具，並如實標示實作未完成。

`portfolioInput`：連續班自選前課兩件核心原創作品，不必全塞入；獨立班可從本課基本形體小展品中重建兩件核心展品。
`portfolioOutput`：新的展覽場景 v01／v02 .blend、入口／焦點／全景三張導覽圖、學生 30 秒導覽（現場口述即可，不必錄音）、真實觀眾反饋。
`nextUse`：作校內分享或後續學生自選主題展起點；公開上網、收集資料或打印均另作安排，不在本課自動執行。
`conceptRevisit`：觀眾視角、選擇與視覺層次；作品重新組合；接受回饋、修訂和交接。

本課檔名用 `G03_D01_L06_v01.blend`、`v02.blend`；圖片同前綴。只能操作本課指定資料夾，保留舊版，不覆蓋他人作品。提示詞不是權限沙箱；學校事前限制檔案及工具權限，不執行來源不明腳本、不關閉安全防護、不裝未知插件。AI 出錯保留錯誤、回復可用版；未完成就如實標記，不編造已生成或測試成功。

只用組別代號，不上傳學生姓名、人臉、聲音、學校平面圖、帳號畫面或家庭位置。文字、角色、形體與示意圖全部原創，不使用官方圖文、供應商示範作品或品牌角色。M 是課堂設定，S 是虛構任務，均不可代表香港現況；實際觀察另記，不能預填。成果是數碼創作／概念，不作工程安全、打印可用性或專業用途保證。

## 11. 一手研究依據與準確性邊界

核對：PBLWorks 2026-09-23；Blender／Astra 沿用 2026-09-22 官方資料快照。

1. [PBLWorks 設計原則](https://www.pblworks.org/gold-standard/pbl-project-design) → 教學依據：學生決策、觀眾及回饋修訂的重要性；本課安排為原創設計，未獲其認證。
2. [Blender Transform](https://docs.blender.org/manual/en/4.5/scene_layout/object/properties/transforms.html) → R-01：可調整展品位置、方向及比例；要保留原始檔案。
3. [OpenAI Astra 案例](https://developers.openai.com/blog/architectural-visualization-with-astra) → 工具協助可編輯場景的參考，不支持本課完成率。
4. [Blender 腳本安全](https://docs.blender.org/manual/en/4.5/advanced/scripting/security.html) → 本機資料與腳本權限邊界。

以上只作研究依據，教學表述與視覺重新創作。軟件行為有來源，不代表本課提示詞、學校電腦效能、約 30 分鐘完成率或學生興趣已驗證。不可把 M 示例或 AI 回答寫成實測結果。

## 12. OpenMAIC 單課製作指令

本課約 30 分鐘只指整條學習路徑（OpenMAIC 引導＋校內受監督 AI-Blender 活動）的設計目標；不得將其當成播放器 runtime。課件生成後分別計量播放器活動時間和課內工具活動的實際總時間；未計時試教前不公開承諾 30 分鐘。

只製作 D01-06「迷你奇想展」的候選引導，一課一文檔；不得生成其餘課或把本稿 13 節逐節朗讀。以第 1 節任務和作品開場，九場景採 `pbl-studio`。約 30 分鐘是全程學習路徑目標，不是 OpenMAIC 播放 runtime；課件生成後另測玩家活動時間，校內試教另測端到端總時長，兩者未取得證據前不得對外承諾 30 分鐘。最多兩張短說明頁，單次救援提示最長 90 秒，全課單向講解設計上限 8 分鐘。時間尚待學校設備計時試教；如生成超時，允許同一作品跨課延續，不刪作品、觀眾反饋或修改。

託管只做原創引導、按需提示和教練式討論候選。模型、動畫和投影必須在 Blender 真正執行；不讓學生按「完成」後就自動判通過。可編輯工作區的來源是本機 .blend；未來網站狀態或提交組件需另做確定性實作與驗證，不聲稱播放器已接通 Blender。

功能：Web 關（資料閉合）；image 關（教學關鍵圖須來自實際原創模型）；生成 video 關（不冒充 Blender 輸出）；託管 TTS 關（後續獨立語軌）；agents／discussion 開候選（各有任務，不能替學生選）；quiz 僅保留操作中誤區和離堂遷移，不作理論考試；interactive／PBL 保留真實作品編輯與返工，不以通用選擇題代替。學生可見工具名稱，不出現密鑰、帳號設定、供應商選擇器或作者導航。

## 13. 教師開課檢查與未完成門檻

- 課前在學校電腦真正重建本課 M 起點，確認檔案能重開；本稿沒有附上已完成 .blend 資產。
- 確認電腦＋滑鼠和 Astra 工具接駁；手機能看任務不等於能建模。老師若只能投影示範，不宣稱學生完成個人實作。
- 示範只到最小粗模；學生必須保留自己的選擇、指揮 AI、同伴測試及一次由 AI 執行的作品修訂；不能以學生手動操作 Blender 代替 AI 操作目標。
- 本課的 AI 操作者必須能安全複製指定展品、在 Blender 新建展場並另存，不覆蓋原作；若來源路徑、匯入或重開失敗，停止並標未完成，不要求學生手動匯入／佈展補救。
- 卡住先縮減細節或修局部；不能用生成圖片、填表或聽講替代本課作品。若素材／設備不合格，先完成準備，不虛報通過。
- 設計階段獨立重評為 97.5/100、`SHIP`（僅進入 generation-prep）；學生未實操驗證、未試教，尚無 generation manifest／G2 授權。不得把設計 `SHIP` 當作 OpenMAIC 提交或網站發布許可。

## 14. 可訪問性與窄屏完成規格（待成品測試）

- 核心路徑不使用拖放或只靠顏色／聲音的提示；展品取捨、入口／焦點、觀眾次序與修訂選擇可用原生表單及鍵盤完成，Tab／Shift+Tab／Enter／Space 可走完，焦點清楚可見，完成狀態由 `aria-live` 宣讀。
- 390×844 手機版採單欄；入口、焦點、全景三視角逐張切換及放大，不讓兩件展品被壓成無法辨認的縮圖；觸控目標至少 55px，不要求橫向捲動。手機完成策展選擇、AI 指令草擬、觀眾反應記錄和修訂決定；展場副本由校方工作站上的 AI 操作者在 Blender 產生，學生不須在手機操作 Blender。
- 展品名稱、視角和觀眾觀察同時以文字標示；不同版面不可只以色彩編碼。提供靜態替代和減少動態選項，不把示意平面圖標作已生成模型或真實消防／建築規範。
- 待驗收：桌面與 390×844 真瀏覽器各完成「選兩件—設定第一眼—看真人反應—提出一項改版—再次檢查—遷移」；鍵盤重走，檢查焦點、標籤、朗讀回饋和控制台。此規格不是成品已通過的證據。

## 15. D01-06 多語學生端內容稿（Q16 文案設計 PASS）

畫面閱讀語言為繁體中文（香港）、简体中文、English；旁白為分開撰寫的粵語、普通話及英文。核心只有兩件展品；第三件只屬延伸。完整操作與安全文字按閱讀語言顯示，旁白不跨語種代讀。OpenMAIC 託管 TTS 關閉；本文不是音頻、展覽作品或真實觀眾證據。

### 九場景六軌引導

| 場景 | 繁中屏幕 | 简中屏幕 | English screen | 粵語口語 | 普通話口語 | English narration |
| --- | --- | --- | --- | --- | --- | --- |
| S1 策展委託 | 把兩件核心作品變成一場小展。即使你不解說，觀眾也能找到入口和開始探索嗎？ | 把两件核心作品变成一场小展。即使你不解说，观众也能找到入口并开始探索吗？ | Turn two core works into a mini-exhibition. Can visitors find the entrance and explore without your explanation? | 揀兩件核心作品整個小展。你唔喺隔籬解畫，觀眾仲搵唔搵到入口同開始探索？ | 选两件核心作品做一个小展。即使你不在旁边解释，观众还能找到入口并开始探索吗？ | Curate two core works into a mini-exhibition. Can visitors explore without you explaining? |
| S2 先說第一個想法（不計分） | 設計師覺得中央展品最突出，但觀眾先看了別處。你最想先知道甚麼？先說直覺，也可說未能判斷；不計分。 | 设计师觉得中央展品最突出，但观众先看了别处。你最想先知道什么？先说直觉，也可说暂时不能判断；不计分。 | The designer expects the central work to stand out, but visitors look elsewhere first. What would you want to know? Share a first thought or say you cannot tell yet; not scored. | 設計師覺得中間嗰件最搶眼，但觀眾先睇咗其他地方。你最想先知乜？講下直覺，唔計分。 | 设计师觉得中央展品最突出，但观众先看了别处。你最想先知道什么？先说直觉，不计分。 | The designer expects the central work to stand out, but visitors look elsewhere first. What would you want to know? This is not scored. |
| S3 選品取捨 | 選兩件最能代表主題的作品，說明為何選它們；第三件是延伸。 | 选择两件最能代表主题的作品，说明为什么选它们；第三件属于拓展。 | Choose two works that best express your theme and explain why. A third is an extension. | 揀兩件最代表你個主題嘅作品，講吓點解；第三件有時間先加。 | 选两件最能表达主题的作品并说明理由；第三件有时间再加。 | Choose two works that best express your theme and explain why. Add a third only if time allows. |
| S4 第一眼 | 從入口視角先猜觀眾會注意哪件作品；一次比較兩種布局。 | 从入口视角先猜观众会注意哪件作品；一次比较两种布局。 | From the entrance, predict which work visitors notice first. Compare two layouts. | 由入口望入去，你估觀眾第一眼會睇邊件？試吓比較兩種擺法。 | 从入口看进去，你猜观众第一眼会看哪件？比较两种摆法。 | From the entrance, predict which work visitors notice first. Compare two layouts. |
| S5 建展場 | 指揮 AI 新建單層展台、入口和兩個展位；另存可編輯 v01。 | 指挥 AI 新建单层展台、入口和两个展位；另存可编辑 v01。 | Direct AI to build a new open, single-level stand with an entrance and two display spots. Save editable v01. | 叫 AI 新起一個開放單層展台，有入口同兩個展位，另存可編輯 v01。 | 请 AI 新建开放式单层展台、入口和两个展位，另存为可编辑 v01。 | Ask AI to build a new open, single-level stand with an entrance and two display spots. Save editable v01. |
| S6 觀眾預覽 | 不解說，請觀眾自行選起點並說一個疑惑；只記錄真實反應。 | 不解释，请观众自己选择起点并说一个疑问；只记录真实反应。 | Without explaining, let a visitor choose a starting point and share one question. Record the actual response. | 先唔好解說，俾觀眾自己揀由邊度睇，再請佢講睇完有咩唔明；照實記低。 | 先不要解释，让观众自己选从哪里开始，并说一个疑问；如实记录。 | Do not explain first. Let the visitor choose where to start and share one question. Record it faithfully. |
| S7 開展前修改 | 從真實反應中選一個布局問題，指揮 AI 只改一項，保存 v02 並重開。 | 从真实反应中选择一个布局问题，指挥 AI 只改一项，保存 v02 并重新打开。 | Choose one layout issue from real feedback. Ask AI to change only that, save v02, and reopen it. | 按觀眾真實反應揀一個布局問題，叫 AI 淨係改一樣，存 v02 再重開。 | 根据观众的真实反应选一个布局问题，请 AI 只改一项，保存 v02 并重新打开。 | Choose one layout issue from actual feedback. Ask AI to change only that, save v02, and reopen it. |
| S8 小展導覽 | 觀眾再試一次；用 30 秒說明一個實際改動，不讓 AI 代寫觀眾稱讚。 | 观众再试一次；用 30 秒说明一项实际修改，不让 AI 代写观众赞赏。 | Let visitors try again. In 30 seconds, explain one real change; do not invent praise. | 俾觀眾再試一次，你用三十秒講清楚改咗邊度；唔好叫 AI 作好評。 | 让观众再试一次，用三十秒讲清楚实际改了哪里；不要让 AI 编赞美。 | Let visitors try again. Explain one real change in thirty seconds; do not invent compliments. |
| S9 交棒 | 換成較小的觀眾：指出一項要重查的操作或視覺門檻，不假稱已調查。 | 换成更小的观众：指出一个要重新检查的操作或视觉门槛，不要声称已调查。 | For a younger audience, name one access or visual issue to recheck. Do not claim it was tested. | 如果下次俾年紀細啲嘅同學睇，邊個位要再檢查？呢個係新假設，唔係已調查。 | 如果下次给年纪更小的同学看，哪个操作或视觉点要重新检查？这是新假设，不是已调查结果。 | For a younger audience, what should you recheck? This is a new assumption, not a tested finding. |

### 核心學生操作文案（三語閱讀）

| 繁體中文（香港） | 简体中文 | English |
| --- | --- | --- |
| 匿名觀眾 brief（教師收集、不記姓名）：如果只看兩件作品，你想先看哪一件？本組用答案作布局假設，不代表全班喜好。 | 匿名观众 brief（教师收集、不记录姓名）：如果只看两件作品，你想先看哪一件？本组用答案形成布局假设，不代表全班偏好。 | Anonymous visitor brief (collected by teacher, no names): If you could see only two works, which would you view first? Use this as a layout hypothesis; it does not represent the class. |
| 布局試驗：先選兩件核心展品、入口和焦點。請 AI 保留原作，只建展示副本；從入口和斜角輸出兩種布局。不要匯入第三件取代核心。 | 布局测试：先选择两件核心展品、入口和焦点。请 AI 保留原作，只建立展示副本；从入口和斜角输出两种布局。不要导入第三件来取代核心作品。 | Layout test: choose two core works, an entrance, and a focal point. Ask AI to preserve originals and build display copies only; export two layouts from entrance and oblique views. Do not replace either core work with a third. |
| 回饋：觀眾先看哪件？他站在哪裏？入口、主題和下一步行動是否清楚？只記錄實際回答，不填推薦語。 | 反馈：观众先看哪件？他站在哪里？入口、主题和下一步行动是否清楚？只记录真实回答，不编推荐语。 | Feedback: which work did the visitor notice first, and where were they standing? Were the entrance, theme, and next action clear? Record only the actual response; do not invent a testimonial. |
| 再試：只移動一個展位或改一個方向，保留另一件展品、入口和其他條件；讓另一位觀眾從相同入口視角再試。不同人可能有不同選擇。 | 重试：只移动一个展位或改变一个朝向，保持另一件展品、入口和其他条件不变；让另一位观众从相同入口视角再试。不同人可能有不同选择。 | Retry: move one display spot or change one orientation only, keeping the other work, entrance, and conditions fixed. Ask another visitor to try from the same entrance view. People may choose differently. |
| 完整修訂指令：觀眾站在[位置]先看到[真實觀察]。我想讓他先理解[我的主題意圖]。請只調整[一個展位／方向／線索]，保留原作和 v01，另存 v02；輸出入口、焦點、全景三個視角並確認可重開。不要編造觀眾反饋或覆蓋原檔。 | 完整修改指令：观众站在[位置]先看到[真实观察]。我希望他先理解[我的主题意图]。请只调整[一个展位／朝向／线索]，保留原作和 v01，另存 v02；输出入口、焦点、全景三个视角并确认可重新打开。不要编造观众反馈或覆盖原文件。 | Full revision request: From [location], the visitor first noticed [actual observation]. I want them to understand [my theme intention] first. Change only [one display spot/orientation/cue], preserve the originals and v01, save v02, export entrance, focal, and overview views, and verify it reopens. Do not invent feedback or overwrite originals. |
| 求助：想放全部作品時先保留兩件核心，第三件只作延伸；太大就用明確標示的低細節展示副本，不改原檔；焦點不清先由入口視圖查遮擋；缺物件就查路徑及打包，不聲稱預覽已驗。 | 求助：想展示全部作品时先保留两件核心，第三件只是拓展；模型太大时使用明确标注的低细节展示副本，不改原文件；焦点不清先从入口视图检查遮挡；物件缺失就检查路径和打包，不要声称预览已验证。 | Help: keep two core works; a third is optional. If files are large, use clearly labeled low-detail display copies without changing originals. If the focal point is unclear, inspect from the entrance. If an object is missing, check paths and packaging; a preview alone is not verification. |
| 評量四項：新展場可重開且有兩個核心展位；選品和布局由我決定；觀眾真正嘗試且有實際觀察；我按反饋指揮 AI 改版。0＝未展示、1＝需提示、2＝展示並解釋。新場景與實際改版不得 0，四項建議至少 6/8；這是本課建議，非官方標準。 | 评价四项：新展场可重新打开且有两个核心展位；选品和布局由我决定；观众真正尝试并留下实际观察；我根据反馈指挥 AI 修改。0＝未展示、1＝需要提示、2＝展示并解释。新场景和实际修改不能为 0，四项建议至少 6/8；这是本课建议，不是官方标准。 | Four checks: the new scene reopens with two core spots; I chose the works and layout; a real visitor tried it and gave an actual response; and I directed AI to revise from that feedback. Score 0 = not shown, 1 = with prompting, 2 = shown and explained. The new scene and real revision must both score above 0; suggested total 6/8. This is not an official standard. |
| 安全與誠實告知：只用匿名或去識別回應，不錄學生聲音、不發布網上、不上傳姓名、人臉、學校平面圖、帳號或家庭位置。校方核驗工具條款、資料流、權限及教師監督前，不執行 AI 工具。課外觀眾未到場就標示「班內試展」。 | 安全与诚信告知：只用匿名或去标识化反馈，不录学生声音、不发布到网上、不上传姓名、人脸、学校平面图、账号或家庭位置。学校核验工具条款、数据流、权限和教师监督前，不运行 AI 工具。校外观众未到场就标注“班内试展”。 | Safety and honesty: use anonymous or de-identified responses only; do not record student voices, publish online, or upload names, faces, school floor plans, account details, or home locations. Do not run AI tools before the school checks terms, data flow, permissions, and supervision. If no outside visitor attends, label it an in-class preview. |
| 介面欄位：展覽主題／兩件核心作品／入口／主焦點／我的布局假設／觀眾實際選擇／觀眾原話（匿名）／我想改的一項／複製給 AI／保存 v01／保存 v02／提交。 | 界面字段：展览主题／两件核心作品／入口／主焦点／我的布局假设／观众实际选择／观众原话（匿名）／我想修改的一项／复制给 AI／保存 v01／保存 v02／提交。 | Interface fields: Exhibition theme / Two core works / Entrance / Focal point / My layout hypothesis / Visitor's actual choice / Anonymous visitor quote / One change I choose / Copy to AI / Save v01 / Save v02 / Submit. |

獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS。音頻、展場副本重開、觀眾試展和真瀏覽器語言切換均未驗，不能把規劃當成作品或 runtime 通過。

## 17. OpenMAIC 原生組件藍圖（生成輸入範圍）

結構原型 `pbl-studio`。最終組裝須由 S1 的 OpenMAIC PBL v2 工作台啟動九階段同一項目；調查、簽名互動、評議、修訂和展示頁只是支架，學生須把可核對結果提交回對應里程碑。S2 為不計分起點；本課不設獨立 quiz。托管生成只負責短引導與角色候選；複雜互動、項目狀態及工作台採確定性本地組裝與測試。托管生成不得生成 interactive HTML、PBL 工作區或 JavaScript；web search、image/video generation、hosted TTS 關閉；不得假稱 Blender 已執行。

本機確定性 I1「兩件作品與主焦點策展」保存學生選品、入口與觀看次序；I2「同一入口視角盲測修訂」在真實觀眾試看後只改一項布局，再比較 v01/v02。記錄實際觀察，不預填偏好、不把第三件列為核心；AI 只依學生決定在 Blender 建場、保存副本。

生成候選僅供教師審閱，不接入學生網站、不含學生資料；生成課堂連結可能可由持有連結者打開，審核通過前不分享。本機指令只是待執行草稿。校方未核驗服務、年齡條款、資料流、權限及回滾前，不開放學生工具活動。通過 G2 後逐課提交一次，生成不等於 import／release 通過。
