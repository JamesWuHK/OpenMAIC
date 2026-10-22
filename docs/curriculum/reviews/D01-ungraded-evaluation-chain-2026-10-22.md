# D01 不計分起點：整條評量鏈修復候選

日期：2026-10-22。狀態：程式及回歸案例已修改；未執行測試、未提交／推送／部署。

## 現場發現

逐一讀取六份 `data/classrooms/d01-0N-pbl-review-20261021-r03.json`：每課只有 `readiness-check` 的任務明確標記 `assessmentMode=ungraded-reflection`。原型、評議、修訂、展示等其餘八階段沒有這個豁免。

先前主分支只在 task evaluator 拒絕評分。繼續追蹤程式發現：

1. `buildAdvanceProjectPatch` 對所有普通專案的已完成里程碑設定 `shouldEvaluateMilestone=true`，未排除不計分階段。
2. 前端收到該旗標後呼叫 milestone evaluator；該 evaluator 沒有不計分防護，會呼叫模型並可能保存 `stars`。
3. 最終報告 prompt 會讀取舊階段星級及所有任務的錯誤／概念掌握／closing quality，使舊的不恰當起點評量繼續影響成就判斷。

這是源碼中確認的遺漏路徑，不聲稱已在新鏡像或真實學生會話中重現。先前公網 task score=100 是另有實測的舊鏡像問題。

## 修復範圍

- 新增統一 `assessment-policy.ts`：只有明確 authored flag 才豁免。空階段、缺失任務、普通任務不自動豁免；只有所有任務均明確不計分的非空階段才豁免整個階段。
- advance patch 不再觸發起點的 task 或整個起點階段的 milestone 評量。保留正常的狀態快照及推進資料。
- milestone evaluator 增加服務端防護，直接呼叫同樣只得到 done，不呼叫模型／不保存評星。
- 混合階段仍評價普通作品任務；不把起點的舊錯誤、掌握度或舊評量當成評分材料。
- 最終報告保留起點的參與時間、發言和完成記錄，但排除其錯誤、掌握度和舊星級；明確要求不能因初始不確定扣分或加分。保留原型、修訂和展示的作品證據要求。
- 沒有刪除學生提交／歷史資料、變更六課 JSON、放寬後續作品評量或呼叫付費服務。

## 待執行回歸

新增／擴充案例涵蓋：

- 明確豁免／空階段不豁免／混合階段保留評量。
- 服務端任務及整階段不呼叫模型、不寫分數或星級。
- advance patch 不連鎖觸發起點評量，但普通作品評量仍存在。
- 最終報告忽略歷史起點星級及假掌握度，保留後續原型的真實證據；不刪歷史資料。
- 精確鏡像 smoke 對 task 與 milestone 分別要求只出現一個 done，拒絕 token、tool、evaluation、error。

目前僅完成格式解析、腳本語法及 `git diff --check`。未跑 Vitest、TypeScript、瀏覽器、鏡像或生產檢查；不得標為 PASS／SHIP。

待確認使用者的 Dot／Grok Linux runner 後，在該環境執行：

```sh
pnpm exec vitest run tests/pbl/v2/assessment-policy.test.ts tests/pbl/v2/advance-patch.test.ts tests/pbl/v2/evaluator.test.ts tests/pbl/v2/eval-prompts.test.ts tests/pbl/v2/ungraded-reflection.test.ts
pnpm exec tsc --noEmit
```

再以精確鏡像跑 API 邊界與六課完整提交／完成／恢復流程。測試成功不能取代音訊、作品鏈、手機／鍵盤和獨立教學驗收。

## 資源限制

使用者改要求自己的 Linux self-hosted runner。沒有新啟動 GitHub hosted job，也沒有在本機啟動測試、服務、構建或瀏覽器。現有 run `39745583310` 的最新終態尚未取得：GitHub core API 現場 remaining=0，未重複輪詢或更換憑證繞過限制。不要推送目前構建分支觸發另一個 hosted run；先確定 runner 與切換流程。
