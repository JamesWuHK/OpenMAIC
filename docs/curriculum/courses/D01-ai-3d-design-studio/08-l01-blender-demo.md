# 第一課｜小怪獸實作示範包

日期：原資產 2026-09-23；修訂記錄 2026-09-28。原本地 Blender 4.5.14 LTS 檔案曾執行、渲染及重開驗證；本次只修改了生成腳本，沒有 Blender 可用來重建資產，因此目前圖像與 `.blend` 仍是舊版，不可把它們當成本次修改後的產物。

**學生使用界線：** 舊 v01 正面圖會讓人以為少了一隻眼，暫停派發 v01 `.blend` 與 v01 圖。兩眼、兩耳均應完整存在；新版練習僅表現視角遮擋。新版 Blender 素材待本機重建、逐角度目視確認後再恢復派發。尚未試教、未生成 OpenMAIC 課件、未發布網站。

這是教師用的 M 類原創示範，不是學生作品，也不是全班應照抄的標準答案。Astra 是課程指定模型；本次證據是 Codex 編寫並執行本機 bpy 腳本，不宣稱已驗證任意 Astra 自由提示詞、學校接駁或學生完成率。

## 教師用示例與 AI 操作演示

![修改後的斜視圖](../../../../output/d01-l01-blender/20260923-r01/v02-three-quarter.png)

| 用途 | 教師／AI 操作者檔案 | 何時展示 |
| --- | --- | --- |
| 教師 M 起點：身體＋底座 | [v00 起點模型](../../../../output/d01-l01-blender/20260923-r01/D01_L01_v00_starter.blend) | 教師示範 AI 如何按學生的自然語言要求開啟及另存副本；不派發學生直接操作 |
| 舊版挑戰（暫停派發） | [v01 舊模型](../../../../output/d01-l01-blender/20260923-r01/D01_L01_v01.blend) | 新素材重建及確認兩眼兩耳完整前不展示，教師也不作現行課堂指示 |
| 一種局部修改示範 | [v02 參考模型](../../../../output/d01-l01-blender/20260923-r01/D01_L01_v02.blend) | 學生先提出自己的 AI 修訂指令後再揭示；不是唯一設計答案 |

三份檔案均只有本機可編輯幾何／材質與拍攝環境，不含嵌入腳本或外連素材。製作腳本另放 tools/d01；使用模型不需要執行腳本。

## 教師展示 AI 操作流程（五分鐘候選）

1. 暫勿開舊 v01；以網頁靜態示例觀察「兩耳部分重疊」及「瞳孔部分遮擋」，它不是 AI 即時操作。
2. 明確指出：兩隻耳、兩隻眼都在模型上；被另一形體遮住，不代表部件不存在。
3. 教師示範學生如何用自然語言提出局部修訂，並由 AI 操作者在 Blender 對教師副本執行；學生觀察 AI 操作和輸出，不使用滑鼠／Transform 面板修改幾何。
4. AI 每次只改一處，再輸出相同角度比較；學生不用背座標概念，也不輸入 Blender 參數。
5. 學生口述或輸入「我請 AI 改咗＿＿，因為＿＿」，由教師／AI 操作者保存示範檔；不要求學生另存或操作 Blender。

操作時只由教師或受控 AI 操作者使用 Blender 的物件清單／Transform 面板；這些不是學生的學習操作目標。學校應配置 AI 工具的檔案權限並驗證實際接駁。本輪沒有實測學生用語言指揮 AI 的成功率或課堂時間。

## 教師才看的改動對照

| 物件 | v01 | v02 | 可觀察變化 |
| --- | --- | --- | --- |
| EyeL | Y = -0.18 | Y = -0.68 | 埋在身體裏的眼睛露出，子物件 PupilL 跟隨 |
| EarL | Y = 0 | Y = -0.48 | 右側視角可分辨兩個耳形 |

只改了這兩件物件的 Y 位置，形狀、顏色和其他物件保持相同。改完仍須回正面看：前移的耳朵會改變正面樣子。這是新的設計取捨，不是「數值對了就一定最好看」。學生可採用不同位置、不同形態，或有意保留重疊，只要能清楚說明意圖並檢查。

對照圖：

- 正面：[v01](../../../../output/d01-l01-blender/20260923-r01/v01-front.png) ／ [v02](../../../../output/d01-l01-blender/20260923-r01/v02-front.png)
- 右側：[v01](../../../../output/d01-l01-blender/20260923-r01/v01-side.png) ／ [v02](../../../../output/d01-l01-blender/20260923-r01/v02-side.png)
- 斜視：[v01](../../../../output/d01-l01-blender/20260923-r01/v01-three-quarter.png) ／ [v02](../../../../output/d01-l01-blender/20260923-r01/v02-three-quarter.png)

## 已做的技術驗證

- 真正保存並在新的 Blender 程序重開三個 .blend；起點有 2 個學生可編輯物件，兩個完整版本各有 9 個。
- 完整版本有 8 個 mesh 和 1 條可編輯微笑曲線；攝影燈、相機、地面另放 02_Render_Studio，不算學生作品部件。
- 檢查無嵌入腳本、無外連 library、無物件動畫／driver，原始檔案雜湊在重開後未改變。
- 用兩條指定觀察射線核對眼睛和耳朵的遮擋前後；這不是完整可見度、碰撞或觀眾辨識率測試。
- 在 QA 副本將 EyeR 移動 -0.08，驗證瞳孔跟隨，保存後重開仍保持改動，再在記憶體復原。QA_only_edit_roundtrip.blend 不是學生派發檔。
- 六張 640×640 圖均經實際渲染與視覺檢查。整段本機建模、存檔、六圖渲染約 38.47 秒；不包含環境準備、腳本撰寫或學生操作，不能寫成「學生一分鐘完成」。

證據：[建立清單及雜湊](../../../../output/d01-l01-blender/20260923-r01/build-evidence.json)、[重開／修改驗證](../../../../output/d01-l01-blender/20260923-r01/reopen-verification.json)。

## 還不能聲稱甚麼

沒有完成學生鼠標操作試教、學校電腦性能測試、自然語言提示詞成功率測試、完整三語稿、配音、OpenMAIC 課件或網站發布。此包只把第一課的「可做、可改、可比較」先做成真實素材，不把本機技術 PASS 當教學成效。

下一輪試教記錄：學生多久能選中物件、轉視角、做一次局部修改；是否能從自己的意圖出發選特徵；同伴反饋能否導向真正改版。未取得實際資料，不預填結果。

## 製作可重現性

腳本：[build_l01_blender.py](../../../../tools/d01/build_l01_blender.py)、[verify_l01_blender.py](../../../../tools/d01/verify_l01_blender.py)。使用學校已安裝的 Blender 4.5 LTS，在獨立新資料夾執行；腳本拒絕覆蓋現有產物，不需要任何 API key。

```bash
blender --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python tools/d01/build_l01_blender.py -- \
  --output "$PWD/output/d01-l01-blender/new-run" --samples 24

blender --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python tools/d01/verify_l01_blender.py -- \
  --assets "$PWD/output/d01-l01-blender/new-run"
```

官方依據（2026-09-23）：[Blender 4.5 發行檔](https://download.blender.org/release/Blender4.5/)、[Scene.ray_cast](https://docs.blender.org/api/4.5/bpy.types.Scene.html)、[保存操作 API](https://docs.blender.org/api/4.5/bpy.ops.wm.html)。教學文字、角色和圖均原創。臨時執行檔 SHA-256 與官方 4.5.14 arm64 清單一致；這不是正式安裝或跨版本相容性測試。
