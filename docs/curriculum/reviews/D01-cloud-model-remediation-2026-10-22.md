# D01 雲端模型修復及遠程 PBL 冒煙

日期：2026-10-22。範圍：既有學生端模型設定；不是課程發布或六課驗收完成。

## 實際變更

- AWS `default` 身分、Lightsail `openmaic-learner-hk` / `ap-east-1` 及短期 SSH 均現場驗證成功。
- 起初 `docker compose config` 輸出看似內嵌環境，但原 Compose 實際引用 `learner.env`。兩次寫入前斷言拒絕了錯誤來源假設，未改檔、未重啟。
- 最終只修改 `/opt/openmaic-learner/learner.env`：
  - `DEFAULT_MODEL=openrouter:minimax/minimax-m3.1-flash:free`。
  - `OPENROUTER_MODELS=minimax/minimax-m3.1-flash:free`。
  - 保留既有 `chat-adapter`，新增 `pbl-v2-runtime` 指向同一免費模型，兩者 `thinking.mode=disabled`。
  - 刪除運行設定中的 `DOUBAO_API_KEY`、`DOUBAO_BASE_URL`、`DOUBAO_MODELS`。未撤銷供應商端 Key。
- 修改後完整解析 Compose，與預期結構逐項相等；非目標設定、Key、掛載及其他服務均不變。
- 原環境檔僅在伺服器受限備份：`/opt/openmaic-learner/.rollback-model-config/learner-before-openrouter-20261022T074722Z.env`，目錄 0700／檔案 0600。不要拷入 Git、報告或本地。回滾可還原該檔並只 recreate `openmaic`；回滾會恢復已失效 Ark 配置，僅在新配置導致回歸時採用。
- 只執行 `docker compose ... up -d --no-build --no-deps --force-recreate openmaic`；沒有構建鏡像、修改課程目錄／JSON／媒體或觸碰另一台伺服器。
- Web image 保持 `sha256:3590e1d9a3388301e6e5fd47a6f4bf9c015b95b66b46a9ad8de6dbfa60219220`；新 StartedAt `2026-10-22T07:47:24.272380378Z`，restart 0；內部與公開 `/api/health` 通過，`/courses` HTTP 200。
- Caddy container ID 與啟動時間未改。每次短期 SSH 私鑰／證書已移除。沒有秘密進入報告或程式。

## 六課遠程 PBL 開場：接口通過，不等於教學通過

`node scripts/qa-d01-cloud-pbl.mjs` 直接對現有雲端 API 提交六課空白候選 project template；未提交真實學生資料、未傳 `x-model`、未傳模型 Key。沒有建立或發布課堂，也沒有啟動本地服務／瀏覽器／構建。

證據：`output/d01-cloud-qa/pbl-api-2026-10-22T07-48-44-341Z.json`，含每個來源精確 SHA、完整回答、SSE patches 和時間。

| 課堂 | HTTP／SSE | 首 token | 全回覆 |
| --- | --- | ---: | ---: |
| D01-01 | 200、done、無 error | 19.171 s | 20.119 s |
| D01-02 | 200、done、無 error | 13.521 s | 14.710 s |
| D01-03 | 200、done、無 error | 11.173 s | 12.421 s |
| D01-04 | 200、done、無 error | 17.754 s | 19.521 s |
| D01-05 | 200、done、無 error | 15.446 s | 17.020 s |
| D01-06 | 200、done、無 error | 16.229 s | 17.756 s |

每課都有對應項目主題的繁體中文教練回答，未再收到安全分類字串。首字延時仍高；這些值是 API 開場，不是討論首段語音延時，不可宣稱低延時通過。部分回答仍使用 Instructor 英文介面名，逐句語言／年齡適配亦須複核。

## 明確 BLOCK：不計分起點仍被線上評量打分

- 另以 D01-01 原始 `assessmentMode=ungraded-reflection` 的準備度任務作合成測試，只提交「我還未能判斷／需要更多角度與模型／未執行 Blender」的初始想法。
- 雲端 `/api/pbl/v2/evaluate` 不帶模型參數，HTTP 200，20.879 s，產生 `evaluation` patch，`score: 100`，最後 done。
- 這違反不計分起點契約。不能因回饋鼓勵學生或模型認為「符合要求」就接受分數。
- 目前 checkout 的 `lib/pbl/v2/agents/evaluator.ts` 在偵測 `ungraded-reflection` 後直接 yield done，不呼叫模型／不存分數；此防護已在 `c44f0f5a` 中。線上仍跑舊 image，單純改模型不能帶入此程式修復。
- 遠程回歸腳本現支援 `node scripts/qa-d01-cloud-pbl.mjs --readiness`，要求此路徑沒有 evaluation patch；腳本語法檢查通過。新增模式留待精確新鏡像部署後執行，未偽報通過。
- 課程仍保持 BLOCK；還需實際 PBL 提交／恢復、v01→評議→學生 v02→展示、Blender 檔案、D01-06 兩展品、音訊、手機／鍵盤及教學驗收。

## 本機清理與下一步

- 按使用者經協調 session 傳達的資源要求，使用既有 Playwright CLI 分別 close `discussion-20261020` 與 `d01-goal-review`；兩個 daemon、兩個 Chrome 及指定 renderer PID 全部確認退出。未用 close-all，未刪使用者檔案，未開新瀏覽器。此前的 next dev 保持停止。
- `learner.env.example` 和其回歸測試已跟隨雲端配置修正，避免後續部署重新使用隨機路由／遺漏 PBL。這批修改未提交；未重新啟動本地測試或構建。
- 下一步為已合併程式修復準備雲端構建／精確鏡像驗收，不在本機或 2 GB 正式機構建。GitHub 操作必須明確 `-R JamesWuHK/OpenMAIC`；本 checkout 的 `gh repo view` 無參數會選上游 THU-MAIC/OpenMAIC，不能據此對上游操作。
