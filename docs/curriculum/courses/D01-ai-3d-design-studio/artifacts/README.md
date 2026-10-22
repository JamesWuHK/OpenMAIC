# D01 暫停時的可恢復產物

狀態：2026-10-23 依使用者指示**暫停 D01 3D 系列**。此目錄只供將來恢復製作與覆核，不是學生網站的已發布課程，不代表教學、模型互動、音頻聽審或作品鏈通過。

- `d01-r03-preview-data.tar.gz`：六課 r03 預覽 JSON 與粵語音頻的基線資料。SHA256 `080f69ab8d2f45607f0f6ce921434cde433486aa911aec60bbf4713f8ce96435`。
- `d01-content-locale-fix.tar.gz`：六課場景 04 的語言修正覆蓋層，對應基線之後的未發布候選。SHA256 `903f1822732be9a04c66a463900ce5e3316e96d7a68617a982c6e359d99b2b7d`。恢復時應先核對其中 `manifest.json` 的 `before` 雜湊再套用，不要把兩個壓縮包當成兩套獨立課程。
- `D01_L01_teacher_monster.blend`／`.png`：第一課的小怪獸教師示例，不是學生作品；`.blend` SHA256 `566ef4ae547f39875af9e4ba30b8dbd652aaeb763f6d6c13cac9eba3e52ed0f6`。
- `D01_L06_teacher_tower.blend`／`.png`：第六課獨立班支架用的積木塔教師示例，不是學生作品；`.blend` SHA256 `04194aeb98ac62c33b4250f90c15087af35369c441ffe69ba317a7b06ab63dc3`。
- `two-assets-reopen-verification.json`：Blender 4.5.14 LTS 重開、微改、另存及再次重開的核驗記錄；SHA256 `895d04f12a3873fdfa0cf2462d9ae7bb715b0390c4b3561b570c7278b5d22cbe`。

教師示例腳本在 `tools/d01/build_l06_tower.py` 和 `tools/d01/verify_two_assets.py`。不要把 QA roundtrip 檔、舊 Docker 鏡像、服務憑證或伺服器設定當成發行產物。恢復 D01 時先讀 `13-series-completion-plan.md` 及 `docs/curriculum/reviews/D01-06-two-teacher-assets-2026-10-23.md`；依最新成品重新作獨立內容審核，再測試真實模型與 OpenMAIC 播放器。
