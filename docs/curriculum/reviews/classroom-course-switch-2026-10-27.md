# 課堂切換沿用上一課：2026-10-27 修復記錄

## 根因與重現

現役應用鏡像 `sha256:3cb7e1618906851847e12a4602611b233cb54915f7f9cba040d1f29067ab9181`，源碼標籤 `8dc9efc25637e5dfadfcf6df69237f678fe58ee1`。

在香港服務器的受限 Chromium 容器內，先打開卡甘課，點返回系列、返回所有系列、再點中文課。地址已變為 `/classroom/hk-c01-01-debatable-claim`，畫面仍是卡甘；網絡記錄只有卡甘課堂 API 請求。直接讀取中文課 API 則返回正確 ID 和內容，證明目錄和後端資料未串課。

`loadFromStorage` 在目標課沒有本地副本時保留 shared stage。`runClassroomLoad` 原本只用 `!getCurrentStage()` 判斷是否讀取服務器，舊 stage 存在便跳過目標課請求。

## 已部署的入口修復

在 `class.wanli.ai` 的 Caddy 配置中，只對 `/classroom/*` 上游請求移除 `RSC` 頭。Next 客戶端遇到 HTML 回應會採取完整頁面導航，使每次進入課堂建立新 document，載入對應課程，避免沿用上一課的 shared stage。切課會完整重新載入頁面。

- 正式改動前，以本機 loopback `18130` 的隔離 Caddy 容器驗證；桌面、手機各六門非諾獎課連續導航，畫面顯示各自內容。
- 配置校驗成功後，2026-10-27 11:52 HKT 平滑 reload 既有 Caddy。Web 與 Caddy 的 ID、鏡像、StartedAt、RestartCount 均與基線相同，沒有重啟應用。
- 數學站原有配置完整保留，公開數學站及 learner health HTTP 200。
- 現役配置 SHA256：`5be0df89df16433f09c8f3b9168bcede6dae3621a925fca05546626da235c988`。
- 上述為 reload 當時的整份配置指紋。終檢發現其他維護已移除數學站的臨時手動 TLS 行，現整份配置為 `0835ade6b799292809e92a86ddd6c80b9e3c36d00ee8730db5b882c863b4d433`；`class.wanli.ai` 區塊仍與本輪驗收候選完全一致。保留該數學站變更，未覆蓋或恢復它。
- 正式域名 12 門課 × 桌面／手機兩種尺寸，**24/24 通過**。每次均由課程／系列入口點入，核對 URL、API 中的 stage ID 和實際可見課件標記；六門非諾獎課持續同一 context 切換。諾獎課逐課以獨立 context 從卡甘課開始導航，避免長鏈測試保留的資源影響驗收。最終結果見 `output/classroom-switch-20261027/public-browser-proof.json` 和服務器 `browser-proof/final.json`。
- 初次驗收有兩類測試假設不適用：一般課程的 stage name 不顯示為可見標題，應核對實際可見課件文字；重訪已緩存課程不一定再次請求課堂 API。修正判據後，一次長鏈測試在第五課等待可見標題超時；該課直接打開及第四課→第五課獨立重測均成功，最後 24 格驗收完成。保留這些失敗邊界，不把它們改寫為首次即全部通過。

## 源碼修復與構建邊界

已準備按 `stage.id === classroomId` 校驗的 loader 修復、錯誤 payload 防護和四個單元回歸用例，另補連續切課的瀏覽器用例。分支 `codex/classroom-course-switch-20261027` 從現役精確源碼開始，未夾帶其他課程內容候選。

已在香港現有工具鏡像的隔離容器執行 `tests/classroom/load-classroom.test.ts`：**47/47 通過**，含上述四項。使用唯讀既有源碼及單獨覆蓋的兩個待測文件，依賴鎖文件與候選相同；涉及的 store、classroom、utils、types、registry 文件與現役基線相比無差異。容器限定 384 MiB 物理內存、640 MiB 內存加 swap、0.5 CPU、無網絡，未在 Mac 執行測試或構建。此結果不是完整 TypeScript／應用鏡像構建驗收。

GitHub workflow dispatch 返回 `Actions has been disabled for this repository`。未更改倉庫 Actions 或賬單設定。因此上述 loader 源碼變更尚未構建入現役鏡像；此次公開修復由入口配置生效，不能聲稱已部署新應用鏡像。主工作區同步 loader 和代理改動，以免下一次發布遺漏。

## 回退與證據

服務器目錄 `/opt/openmaic-learner/releases/classroom-switch-20261027` 保存 `Caddyfile.before`、`Caddyfile.candidate`、`baseline.json`、`applied.json` 和瀏覽器驗收。現役配置已有後續數學站維護，**不得整份恢復 Caddyfile.before**。若需撤回本修復，只移除 `@classroom_entry` matcher 和與其對應、含 `header_up -RSC` 的 reverse_proxy 段；保留其他配置，先校驗再平滑 reload，並核對服務身份和公開入口。

本輪未更改課件 JSON、媒體、公開白名單、模型配置或題目內容，故沒有用工程導航驗收替代課程獨立內容審核。
