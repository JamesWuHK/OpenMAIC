# D01 r03：橋接與本地模型實測

日期：2026-10-22（香港）。結論：部分工程門已改善，完整課程仍 BLOCK；沒有發布、托管生成或聲稱學生成效。

## 精確範圍

- 批次 `20261021-r03`，本機 `d01-01-pbl-review-20261021-r03` 至 `d01-06-pbl-review-20261021-r03`。
- 候選及來源 SHA：`output/d01-openmaic-candidates/20261021-r03/preview-batch-20261021-r03.json`。
- 瀏覽器為實際 OpenMAIC 作者模式播放器，不是學生端精確發布鏡像；不得據此通過 learner-shell 門。
- 測試只輸入標為 QA／未執行 Blender 的合成記錄，未冒充學生作品或真實觀察。

## 修正及已取得證據

1. `lib/learner/d01-portfolio-bridge.mjs` 原本只接受 `hk-d01-*` 路由；真實預覽 ID 未被接受。新增六個精確 r03 預覽路由白名單，不放行任意 draft。
2. 原型草稿曾按物件插入順序套欄位名稱，缺少或重排欄位會錯標。改為按明確欄位 key 對應標籤；限制 milestone 必須屬於當前課。
3. `node --test tests/scripts/d01-portfolio-bridge.test.mjs tests/scripts/d01-local-components.test.mjs`：14/14 PASS。新路由與錯標反例修正前失敗、修正後通過。
4. 六課 scene 04 在真實瀏覽器逐一填入各課 QA 記錄、出現已保存、整頁刷新後讀回完全相同文字。D01-01 又於新標籤頁讀回先前內容。
5. D01-01 scene 05 三欄填入固定條件、單一改動及未測試預測，點保存後整頁刷新，第一欄讀回 `QA 合成記錄：固定相機角度及模型，尚未在 Blender 執行。`。其餘支援場景尚未逐一驗收。
6. `node scripts/audit-d01-series.mjs output/d01-openmaic-candidates/20261021-r03`：六課 PASS，每課 9 場景、首場 PBL、9 里程碑、6 橋接互動、0 獨立 Quiz、slide 比例 2/9。這是結構門，不是 PBL 全流程證據。

## 模型現場發現與本地調整

- 起初 `/api/server-providers` 實際只公布舊 doubao / deepseek-v4-flash；`.env.local` 仍有過期 Plan 設定，不能沿用舊記錄宣稱已切換。
- 從本聊天中使用者此前提供的 Key 在記憶體提取；沒有寫入程式、文件或工具輸出。使用者此前已授權 OpenRouter 免費路由用於課堂互動。
- 本地程序首先切到 `openrouter/free`，API 確認只有 OpenRouter 與 Edge TTS；真實 PBL open-task HTTP 200，但教練內容只有 `User Safety: safe`。判定教學功能失敗，不以 200 通過。
- 官方模型 API 當日列出以下指定模型為零 prompt／completion 價格。只發送不含個資的合成教學問題：
  - `google/gemma-4-31b-it:free`：429，828 ms，未採用。
  - `minimax/minimax-m3.1-flash:free`：200，2951 ms，返回繁體中文觀察及檢查問題。這只是候選連線測試，不是全面教學評估／PBL 或 TTS 延遲。
- 新增 `scripts/run-d01-openrouter-preview.mjs`，要求由程序環境提供 Key，固定上列已實測免費對話模型，覆蓋舊 Ark 值與 PBL runtime route，保留 TTS。只用於本地 QA，不修改線上或 `.env.local`。
- `tests/scripts/d01-preview-env.test.mjs`：2/2 PASS，檢查免費指定模型、舊配置隔離、無 Key 拒絕啟動。
- 第一階段「驅動問題」合成產出已在 UI 填寫並點提交；其後本地服務退出（工具返回 exit 0，未取得明確原因），所以提交／評量／恢復暫不計 PASS。重新啟動時加入子程序退出 code/signal 記錄，以便定位。

## 仍必須完成

完整實際 PBL 提交與重開、調查匯入、原型→評議→學生 v02→展示；六課所有支援互動的錯誤／重試／語言／恢復；兩件 D01-06 可重開展品；Blender 執行與證據；精確學生端鏡像的桌面／390px／鍵盤／音訊／控制台；多語音軌及人工試聽；重新教學審核與授課計時。

## 後續現場更新：本機釋放與 AWS 通道恢復

- 收到協調訊息要求降低本機記憶體占用、不再啟動本地服務／構建／瀏覽器驗收。已核對 PID 36971／36978 均不存在，3000 無監聽；本 session 預覽程序返回 exit 0、signal null。協調 session 已確認按使用者要求停止此鏈，故不再把這次退出當作應用崩潰。沒有自行再次啟動。
- 本機最新快照：磁碟可用約 15 GiB；`memory_pressure` 顯示 29% free（瞬時值，不當作回收量）。沒有刪除 Docker、學生資料或使用者文件。
- 本 session 的舊 AWS 登入請求的確到期，但之後重新查 `aws sts get-caller-identity --profile default --region ap-east-1` 已成功，身分為目標帳戶 root。不能再沿用「憑證過期」作為目前阻礙。
- Lightsail `openmaic-learner-hk` / `ap-east-1` 為 running。實際短期 SSH 握手與只讀容器檢查成功，`/opt/openmaic-learner/docker-compose.learner-static.yml` 存在，磁碟可用 14.51 GiB。臨時 SSH 憑證已刪除。
- Web image：`sha256:3590e1d9a3388301e6e5fd47a6f4bf9c015b95b66b46a9ad8de6dbfa60219220`；StartedAt `2026-10-21T15:27:58.305298828Z`，running、restart 0、無 OOM。Caddy StartedAt `2026-09-13T10:26:05.371849197Z`，running、restart 0、無 OOM。本次未改任何容器。
- 線上環境的 `chat-adapter` 已明確指定 `openrouter:minimax/minimax-m3.1-flash:free`，OpenRouter Key 已配置；但 `DEFAULT_MODEL=doubao:deepseek-v4-flash` 且舊 Ark Key 仍存在，未為 PBL 指定新路由。需要確認並修正 PBL 的預設解析，不能因討論已切換就宣稱所有模型功能都已切換。
- `https://class.wanli.ai/` HEAD 返回 302 到 `/courses`，僅證明網站入口，未作新的完整瀏覽器驗收。
- 下一步只做雲端輕量檢查／設定修復，先保留精確回滾；不要重新啟動本地重資源步驟，不在 2 GB 線上主機構建。
- 收尾：本 session 的過期 AWS 登入頁已關閉；本地 QA 頁已變成瀏覽器 `data:` 錯誤頁，工具 URL 政策拒絕關閉操作，未嘗試繞過。頁面未再進行驗收，不保留為交付頁。本輪沒有仍需等待的登入、測試、構建或預覽程序；程式和記錄保留。

來源：本地執行結果與瀏覽器 DOM/AX 狀態；[OpenRouter 免費路由說明](https://openrouter.ai/openrouter/free)、[官方模型目錄 API](https://openrouter.ai/api/v1/models)（2026-10-22）。
