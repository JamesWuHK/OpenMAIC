# D01 本機 OpenMAIC 播放器音頻驗收

日期：2026-10-12。精確批次：20261012-r02。範圍僅限播放器旁白運行；不是課程教學品質、模型對話、PBL 作品或發布驗收。

六課每課九個場景，對應九段新 MP3。全部 54 段以 ffmpeg 輸出 null 完整解碼（退出 0、stderr 無解碼錯誤）。ffprobe 時長如下；時長只有錄音，不含学生在外部 AI／Blender 工具中創作、同伴評議或展示。

| 課堂 | MP3 合計秒數 | 真實播放器通過場景 | 最小被觀察到的 currentTime |
| --- | ---: | ---: | ---: |
| D01-01 | 144.79 | 9/9 | 0.201776 |
| D01-02 | 140.83 | 9/9 | 0.210044 |
| D01-03 | 137.86 | 9/9 | 0.214656 |
| D01-04 | 141.70 | 9/9 | 0.211419 |
| D01-05 | 137.78 | 9/9 | 0.212166 |
| D01-06 | 139.18 | 9/9 | 0.212338 |

## 實測方法與邊界

使用 Playwright CLI 的 d01-series 隔離會話，開啟本機真正 OpenMAIC classroom URL。以實際「Play」「Next scene」控制逐場景播放。HTMLMediaElement.play 記錄实际媒體 URL、playing 事件、currentTime、playbackRate 與播放 rejection。

每段都核對精確 preview ID／檔名，playing=true，currentTime>0.2，playbackRate=1，播放 error=null。這證明每段可在本機播放器開始播放、不是只驗 HTTP 或 MP3 檔案存在。測試沒有在瀏覽器再次加速，避免對服務端錄音疊加倍速。媒體取自目前營運的教師語音服務；API 不回傳 voice/rate metadata，不能以播放器 rate=1 反推錄音合成速率。

各段經最短播放檢查即轉到下一場，因此不代表人類完整聆聽過每段、自然口音與節奏已獲教師認可，也未觸發講完之後的 AI 討論以冒充 PBL 全流程。字幕／畫面順序、普通話及英文音軌、手機播放、完整片段同步、教學評量、保存恢復和正式發布仍是不同門檻。

本機 full-mode preview 的 stage-meta sidecar 返回 404（未配置 agent runtime），仍可從 filesystem classroom 載入；此項已記錄，沒有以虛構公開權限來消除 console 訊息。PBL 教練的實際 Plan 模型請求另返回訂閱無效或過期；不因旁白通過而宣稱對話／討論可用。

生成來源、文字／音頻 SHA-256 見每課 media/service-speech-manifest.json；候選 JSON 哈希見 output/d01-openmaic-candidates/preview-batch-20261012-r02.json。原始 hosted 課堂與 class.wanli.ai 課程登記均未改寫。
