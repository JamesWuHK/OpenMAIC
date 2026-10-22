# D01-06 兩件教師示例展品：素材驗證，非課堂放行

日期：2026-10-23（香港時間）。結論：**兩件不同的教師示例 `.blend` 已在 Blender 4.5.14 LTS 重開、微改並再次重開；已存入暫停歸檔，但尚未附入第六課發行包，不能宣稱整課或學生作品鏈通過。**

| 示例 | 本機位置 | SHA256 | 驗證結果 |
| --- | --- | --- | --- |
| 原創雙耳小怪獸，來自 D01-01 教師示例 | `output/d01-l01-blender/20260923-r01/D01_L01_v02.blend` | `566ef4ae547f39875af9e4ba30b8dbd652aaeb763f6d6c13cac9eba3e52ed0f6` | 9 個可編輯 mesh、無外部 linked library／未打包圖片依賴、微改保存後重開成功 |
| 原創彩色積木塔，供 D01-06 獨立班支架 | `output/D01_L06_teacher_tower.blend`；預覽 `output/D01_L06_teacher_tower.png` | `.blend` `04194aeb98ac62c33b4250f90c15087af35369c441ffe69ba317a7b06ab63dc3`；`.png` `1452f999746a6b0850cceeda1e3ea9e1f3ab7c7a765d942dc77efe4dd5e618b3` | 7 個可編輯 mesh、無外部 linked library／未打包圖片依賴、微改保存後重開成功 |

驗證記錄：`output/two-assets-reopen-verification.json`，SHA256 `895d04f12a3873fdfa0cf2462d9ae7bb715b0390c4b3561b570c7278b5d22cbe`。本輪在已授權的 8 GB 構建機獨立目錄使用 Blender 官方 4.5.14 Linux 便攜包，先核對官方 SHA256；未用付費第三方 3D 服務、未改正式網站。兩件都是 Codex 製作／預備的教師示例，絕不是學生本人作品，也沒有真實觀眾試展證據。

恢復後下一關：把兩件資產連同來源及教師使用說明附入 D01-06 課包，獨立內容審核者按最新成品重新覆核，之後才做第六課播放器／作品鏈實測。原有 D01 六課品質結論繼續 **BLOCK**。2026-10-23 使用者已指示暫停這個系列，不繼續生成／發布。

構建機 `openmaic-build-20261022-06e1472` 已於本輪驗證與取回證據後發出停止請求，並核實為 `stopped`。AWS Lightsail 停止仍計費，刪除前不得稱已停費；機內尚有以往測試目錄，故未擅自刪除。
