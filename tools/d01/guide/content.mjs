export const MINUTES=[2,1,2,3,8,3,6,3,2];
export const COPY={
 'zh-HK':{
  pageTitle:'桌面小怪獸 · 創作工房',brand:'萬里 AI 課堂',series:'AI 3D 創作工房 / 第 01 課',local:'本機試作 · 未發布',
  title:'你設計，AI 在 Blender 造。',subtitle:'用清楚的指令，讓 AI 操作 Blender 做出小怪獸；你負責選擇、檢查和決定怎樣改。',
  meta:'中一至中二（待試教） · 全程目標約 30 分鐘；播放器時長待測 · Astra + Blender',language:'閱讀語言',tasks:'創作路線',minute:'分鐘',
  stages:[
   ['接任務','你設計，AI 來操作。','設計一隻原創桌面小怪獸；你決定用途和兩個特徵，再用語言指揮 AI 在 Blender 建模。','帶走的不是一張 AI 圖：是 AI 在 Blender 建立、可繼續修改的 3D 角色。'],
   ['看示例','先看 AI 操作的結果長怎樣。','切換正面、右側、斜角示例。留意從不同角度看，哪些部分會被遮住。','這是教師製作的示例模型，不是本頁即時連接 AI 或 Blender。'],
   ['選方向','你作主，AI 才開工。','給角色一個用途，再選兩個真正影響造型的特徵。','例如：提醒我休息的守衛；一高一低的耳朵、側面也看得到的眼睛。可以完全不同，不能只有換色。'],
   ['指揮 AI','先猜，再下建模指令。','先猜右側視角中左耳會被遮住多少，再看示例。複製耳朵或眼睛的指令，交給學校配置好的 AI 操作者在 Blender 執行。','本頁不會把滑桿改動冒充為 AI 操作。AI 產生結果後，請它輸出同角度圖供你檢查。'],
   ['做初稿','把你的想法交給 AI 操作。','填寫用途和兩個特徵，複製建模委託給學校配置好的 Astra／Codex 工具鏈；由 AI 在 Blender 建模並另存 v01。','目標約在全程第 16 分鐘完成可檢查的 AI 粗模；這是待試教的階段 timebox，不是倒數或成績。工具不可用時保留未完成狀態。'],
   ['同伴評議','先不解說，請同伴看 AI 的輸出。','讓同伴看 AI 輸出的正面、側面、斜角，請他指出一個看不清的特徵。記一個具體觀察，不記姓名。','沒有同伴？可用固定提問自查，但要標記未完成真人回饋，不能當作同伴真的試過。'],
   ['指揮修訂','你決定改甚麼，AI 執行。','根據回饋寫明要改的一處與設計理由，請 AI 在 Blender 保留 v01、只改指定部件並另存 v02，再輸出相同角度。','此階段規劃 6 分鐘，仍待試教驗證。你負責決策和驗收，AI 負責 Blender 操作；不要求你手動改模型。'],
   ['展示','讓作品替你說話。','展示 AI 產生的 v01、v02 和三視圖，用 20 秒指出：你下了甚麼修訂指令，為甚麼。','下方是教師的原創示範，不是你的 AI 成品，也不是唯一標準答案。'],
   ['帶走作品','縮小到圖示，還認得出嗎？','假如小怪獸要變成小小的桌面圖示，你會要求 AI 保留哪個特徵？用輸出的三視圖說明你的判斷。','帶走 AI 在 Blender 產生的 .blend、三張圖和修訂指令。網頁不能讀取或驗證你的作品。'],
  ],
  view:'觀察角度',views:{front:'正面',side:'右側',oblique:'斜角'},modelLabel:'可切換三個角度的小怪獸練習模型',modelTag:'M / 原創練習模型',
  modelNote:'本頁 M 教師示例，以網頁幾何重建；不是 AI 即時生成或 Blender 輸出。',fallback:'這個瀏覽器未能啟用即時 3D，現顯示教師示例圖。本頁不連接 AI／Blender，也不能完成或驗證 AI 操作。',
  help:'需要提示才打開',hint:'不用進入 Blender 操作。告訴 AI：「請先列出場景物件名稱，輸出正、側、斜三視圖；只修改我指定的部件，保留其他物件並另存新版本。」',
  purpose:'它的工作',purposePh:'例如：提醒我休息的桌面守衛',features:'兩個辨識特徵',featuresPh:'例如：高低耳朵、側面露出的眼睛',
  privacy:'不要填姓名、學校、帳號或密鑰。',prediction:'還沒轉之前，你猜左耳有多少部分會被右耳遮住？',one:'露出一部分',two:'大部分被遮',
  ear:'01 / 耳朵部分重疊',eye:'02 / 瞳孔部分遮擋',earMove:'請 AI 調整左耳',eyeMove:'請 AI 調整左眼',toward:'往前',away:'往後',
  coordinate:'示例 Y 值（不是公分）',checkEar:'從右側檢查耳朵',checkEye:'從正面檢查眼睛',reset:'重試這一題',practice:'可再試一次，舊紀錄會保留。',
  feedback:{
   'ear:hidden':'左耳完整存在，只是這個角度幾乎全被右耳擋住。微調位置，看看能露出多少，再比較角度。',
   'ear:partly-hidden':'左耳仍露出一部分；右耳遮住了其餘部分。微調位置看看能否多露出一些，再回正面比較。',
   'ear:separated':'從右側現在能清楚看到兩隻耳朵。回正面比較輪廓和表情的取捨，沒有唯一標準答案。',
   'eye:hidden':'左眼和瞳孔都在；只是從正面看，瞳孔幾乎被身體完全擋住。小幅向前移，找回可見的一部分。',
   'eye:partly-hidden':'左瞳孔仍露出一部分，身體遮住了其餘部分。小幅向前移，看看能否多露出一點，同時讓眼睛留在角色上。',
   'eye:floating':'瞳孔看得見，但眼睛已離身太遠。若目標是貼身眼睛，移回一點；想做漂浮眼睛也可以，但要是你有意的選擇。',
   'eye:attached':'這條正面檢查線看到瞳孔，眼睛也仍與身體相交。再轉側面確認造型；這不是完整碰撞或美感檢查。',
   'ear:wrong-view':'先切換到「右側」，再檢查耳朵。','eye:wrong-view':'先切換到「正面」，再檢查眼睛。',
   'ear:unavailable':'即時 3D 不可用，未記為通過。','eye:unavailable':'即時 3D 不可用，未記為通過。',
  },
  history:'最近的嘗試',noHistory:'還未按檢查。先試一個想法。',result:{hidden:'幾乎全被遮住','partly-hidden':'仍有部分被遮',separated:'兩隻清楚可見',floating:'離身太遠',attached:'清楚可見，仍貼着身體','wrong-view':'待切換角度',unavailable:'3D 不可用'},
  starter:'下載起步 .blend',rough:'下載示範 v01',roughPending:'示範 v01 的 Blender 檔與舊渲染仍待同步修訂；先用起步檔建立你自己的 v01。',reference:'看示範 v02',referenceLocked:'先從正確角度試過耳朵及眼睛，才揭曉示範 v02；不要求一次答對。',
  aiOperatorNotice:'本頁不連接 AI 或 Blender。複製指令後，交給學校配置好的 AI 操作者；由 AI 在 Blender 執行，你負責檢查輸出。',aiEarInstruction:'請 AI 只調整左耳，保持兩隻耳朵都存在、其他部件不動；另存新版本並輸出右側及正面圖。',aiEyeInstruction:'請 AI 微調左眼，確保眼睛本體仍可辨認且不缺件；保留其他部件，另存新版本並輸出正面及側面圖。',aiRevisionInstruction:'請 AI 根據你的同伴觀察和設計理由，只修改一個指定部件；保留 v01，另存 v02 並輸出相同角度。',requestEar:'複製耳朵修訂指令給 AI',requestEye:'複製眼睛修訂指令給 AI',requestRevision:'複製我的修訂指令給 AI',aiRequestCopied:'指令已複製。這不代表已傳送、已執行或已生成 Blender 檔。',aiRequestCopyFailed:'未能複製，請選取指令後手動複製。',onePart:'一個指定部件',noRevisionReason:'學生尚未填寫修訂理由。',noPeerNote:'尚未填寫同伴觀察。',
  promptTitle:'交給 AI 操作 Blender 的建模委託',promptHint:'課前由學校配置好能操作 Blender 的 Astra／Codex 本機工具鏈。只允許 AI 在指定課程資料夾建立檔案。下方文字不會自動發送，本頁也不會連接 Blender。',
  promptMissing:'先在「選方向」填用途和兩個特徵，再產生給 AI 的建模委託。',copy:'複製 AI 建模委託',copied:'已複製；請貼到學校配置好的 AI 操作者。',copyFailed:'未能複製。請選取上方文字後手動複製。',
  draft:'我已查看 AI 操作產生的 v01 三視圖（自評）',ownEdit:'我已決定並向 AI 說明一項修訂（自評）',revision:'AI 已按我的指令在 Blender 另存 v02（自評）',pictures:'我已查看 AI 輸出的正、側、斜三視圖（自評）',
  peer:'同伴從 AI 輸出看見甚麼？',peerPh:'例如：側面左耳被右耳遮住一部分。若未試玩，寫「待真人回饋」。',reason:'我要求 AI 改甚麼，為甚麼？',reasonPh:'一句即可，也可留待課堂口述。',
  coach:'固定教練提問 · 不是即時 AI',coachText:'「如果你不告訴我這是甚麼，我可以從側面認出你最重要的特徵嗎？請用模型指給我看。」',
  photos:'真實 Blender 渲染 / 原創示範',before:'v01 · 修改前',after:'v02 · 示例修改後',photosNote:'以下是舊比例的 Blender v02 原創示範，不是學生測試成果；新版角色與挑戰素材尚待重建。舊 v01 圖片暫不展示。',
  transfer:'我的縮圖取捨',transferPh:'我會要求 AI 保留哪個特徵？縮小後從輸出圖實際看到甚麼？',export:'下載我的練習紀錄',exportNote:'JSON 只含本頁選擇與自評，不含 3D 模型，也不證明 AI 已操作 Blender。作品須另交 AI 在 Blender 產生的 .blend＋三張圖。',
  evidence:'作品交付自查',selfReport:'以上只由你勾選，系統沒有讀取或驗證任何 .blend。請教師或同伴打開你的檔案覆核。',
  prev:'上一步',next:'下一個任務',end:'回到展示',saved:'紀錄只存在此瀏覽器',saveError:'無法本機儲存；離頁前請下載紀錄。',corrupt:'舊紀錄不能安全讀取，已保留原資料。本次不覆寫；離頁前請下載新紀錄。',
  record:'下載紀錄',audio:'本候選沒有語音、即時 AI 或 Blender 連線；手機可閱讀任務，AI 操作 Blender 需學校配置的電腦工具鏈。',step:'任務',visited:'已看角度',resetDone:'已回到這一題的起點。嘗試紀錄保留。',
 },
 'zh-CN':{
  pageTitle:'桌面小怪兽 · 创作工坊',brand:'万里 AI 课堂',series:'AI 3D 创作工坊 / 第 01 课',local:'本地试作 · 未发布',
  title:'你设计，AI 在 Blender 造。',subtitle:'用清楚的指令让 AI 操作 Blender 做出小怪兽；你负责选择、检查和决定怎样改。',
  meta:'中一至中二（香港；待试教） · 全程目标约 30 分钟；播放器时长待测 · Astra + Blender',language:'阅读语言',tasks:'创作路线',minute:'分钟',
  stages:[
   ['接任务','你设计，AI 来操作。','设计一只原创桌面小怪兽；你决定用途和两个特征，再用语言指挥 AI 在 Blender 建模。','带走的不是一张 AI 图：是 AI 在 Blender 建立、可继续修改的 3D 角色。'],
   ['看示例','先看 AI 操作的结果长怎样。','切换正面、右侧、斜角示例。留意从不同角度看，哪些部分会被遮住。','这是教师制作的示例模型，不是本页即时连接 AI 或 Blender。'],
   ['选方向','你作主，AI 才开工。','给角色一个用途，再选两个真正影响造型的特征。','例如：提醒我休息的守卫；一高一低的耳朵、侧面也看得到的眼睛。可以完全不同，不能只有换色。'],
   ['指挥 AI','先猜，再下建模指令。','先猜右侧视角中左耳会被遮住多少，再看示例。复制耳朵或眼睛的指令，交给学校配置好的 AI 操作者在 Blender 执行。','本页不会把滑杆改动冒充为 AI 操作。AI 产生结果后，请它输出同角度图供你检查。'],
   ['做初稿','把你的想法交给 AI 操作。','填写用途和两个特征，复制建模委托给学校配置好的 Astra／Codex 工具链；由 AI 在 Blender 建模并另存 v01。','目标约在全程第 16 分钟完成可检查的 AI 粗模；这是待试教的阶段 timebox，不是倒计时或成绩。工具不可用时保留未完成状态。'],
   ['同伴试玩','先不解说，请同伴认一认。','给同伴看正面、侧面、斜角，请他指出一个看不清的特征。记一个具体观察，不记姓名。','没有同伴？可先用下方固定提问自查，但要标记未完成真人反馈，不能当作同伴真的试过。'],
   ['指挥修订','你决定改什么，AI 执行。','根据反馈写明要改的一处与设计理由，请 AI 在 Blender 保留 v01、只改指定部件并另存 v02，再输出相同角度。','此阶段规划 6 分钟，仍待试教验证。你负责决策和验收，AI 负责 Blender 操作；不要求你手动改模型。'],
   ['展示','让作品替你说话。','展示 AI 产生的 v01、v02 和三视图，用 20 秒指出：你下了什么修订指令，为什么。','下方是教师的原创示范，不是你的 AI 成品，也不是唯一标准答案。'],
   ['带走作品','缩小到图标，还认得出吗？','假如小怪兽要变成小小的桌面图标，你会要求 AI 保留哪个特征？用输出的三视图说明你的判断。','带走 AI 在 Blender 产生的 .blend、三张图和修订指令。网页不能读取或验证你的作品。'],
  ],
  view:'观察角度',views:{front:'正面',side:'右侧',oblique:'斜角'},modelLabel:'可切换三个角度的小怪兽练习模型',modelTag:'M / 原创练习模型',
  modelNote:'按示例参数重建的网页模型，简化光影；不是读取 .blend。',fallback:'这个浏览器未能启用实时 3D。现显示 Blender 示范图；练习不会自动通过。请换支持 WebGL 的电脑浏览器，或先读任务。',
  help:'需要提示才打开',hint:'不用进入 Blender 操作。告诉 AI：「请先列出场景物件名称，输出正、侧、斜三视图；只修改我指定的部件，保留其他物件并另存新版本。」',
  purpose:'它的工作',purposePh:'例如：提醒我休息的桌面守卫',features:'两个辨识特征',featuresPh:'例如：高低耳朵、侧面露出的眼睛',privacy:'不要填姓名、学校、账号或密钥。',
  prediction:'Before turning: how much of the left ear do you think the right ear will cover?',one:'Some',two:'Most',ear:'01 / Partly overlapped ears',eye:'02 / Partly covered pupil',earMove:'Adjust the left ear',eyeMove:'Adjust the left eye',toward:'Forward',away:'Backward',
  coordinate:'示例 Y 值（不是厘米）',checkEar:'从右侧检查耳朵',checkEye:'从正面检查眼睛',reset:'重试这一题',practice:'可再试一次，旧记录会保留。',
  feedback:{
   'ear:hidden':'左耳完整存在；从这个角度看，右耳几乎把它全部挡住了。微调位置，让左耳露出一部分再比较。',
   'ear:partly-hidden':'左耳仍露出一部分，右耳挡住了其余部分。微调位置，看看能否多露出一点，再比较正面。',
   'ear:separated':'从右侧现在能清楚看到两只耳朵。回正面比较轮廓取舍；这不是整个轮廓的自动评分，也没有唯一标准答案。',
   'eye:hidden':'左眼和瞳孔都在；从正面看，瞳孔几乎被身体完全挡住。小幅向前移，让它露出一部分。',
   'eye:partly-hidden':'左瞳孔仍露出一部分，身体挡住了其余部分。小幅向前移，看看能否多露出一点，同时让眼睛留在角色上。',
   'eye:floating':'瞳孔看得见，但眼睛已离身太远。若目标是贴身眼睛，移回一点；想做漂浮眼睛也可以，但要是你有意的选择。',
   'eye:attached':'这条正面检查线看到瞳孔，眼睛也仍与身体相交。再转侧面确认造型；这不是完整碰撞或美感检查。',
   'ear:wrong-view':'先切换到“右侧”，再检查耳朵。','eye:wrong-view':'先切换到“正面”，再检查眼睛。','ear:unavailable':'实时 3D 不可用，未记为通过。','eye:unavailable':'实时 3D 不可用，未记为通过。',
  },history:'最近的尝试',noHistory:'还未按检查。先试一个想法。',result:{hidden:'几乎全被遮住','partly-hidden':'仍有部分被遮',separated:'两只均清楚可见',floating:'离身太远',attached:'清楚可见且仍相连','wrong-view':'待切换角度',unavailable:'3D 不可用'},
  starter:'教师素材',rough:'AI 制作 v01',roughPending:'示例 v01 的文件与旧渲染暂不同步，不提供给学生使用。课堂由已配置的 AI 操作 Blender，另存学生自己的 v01。',reference:'看教师示例 v02',referenceLocked:'这是教师示例，不是学生成果。',onePart:'一个指定部件',noRevisionReason:'学生还没有填写修改理由。',noPeerNote:'还没有填写同伴观察。',
  aiOperatorNotice:'本页不连接 AI 或 Blender。复制指令后，交给学校配置好的 AI 操作者；由 AI 在 Blender 执行，你负责检查输出。',aiEarInstruction:'请 AI 只调整左耳，保持两只耳朵都存在、其他部件不动；另存新版本并输出右侧及正面图。',aiEyeInstruction:'请 AI 微调左眼，确保眼睛本体仍可辨认且不缺件；保留其他部件，另存新版本并输出正面及侧面图。',aiRevisionInstruction:'请 AI 根据你的同伴观察和设计理由，只修改一个指定部件；保留 v01，另存 v02 并输出相同角度。',requestEar:'复制耳朵修订指令给 AI',requestEye:'复制眼睛修订指令给 AI',requestRevision:'复制我的修订指令给 AI',aiRequestCopied:'指令已复制。这不代表已传送、已执行或已生成 Blender 文件。',aiRequestCopyFailed:'未能复制，请选取指令后手动复制。',
  promptTitle:'交给 AI 操作 Blender 的建模委托',promptHint:'课前由学校配置好能操作 Blender 的 Astra／Codex 本地工具链。只允许 AI 在指定课程文件夹建立文件。下方文字不会自动发送，本页也不会连接 Blender。',
  promptMissing:'先在“选方向”填写用途和两个特征，再生成给 AI 的建模委托。',copy:'复制 AI 建模委托',copied:'已复制；请粘贴到学校配置好的 AI 操作者。',copyFailed:'未能复制。请选取上方文字后手动复制。',
  draft:'我已查看 AI 操作产生的 v01 三视图（自评）',ownEdit:'我已决定并向 AI 说明一项修订（自评）',revision:'AI 已按我的指令在 Blender 另存 v02（自评）',pictures:'我已查看 AI 输出的正、侧、斜三视图（自评）',
  peer:'同伴真的看见什么？',peerPh:'例如：侧面只看到一只耳朵。若未试玩，写“待真人反馈”。',reason:'我改了什么，为什么？',reasonPh:'一句即可，也可留待课堂口述。',
  coach:'固定教练提问 · 不是实时 AI',coachText:'“如果你不告诉我这是什么，我可以从侧面认出你最重要的特征吗？请用模型指给我看。”',
  photos:'真实 Blender 渲染 / 原创示范',before:'v01 · 修改前',after:'v02 · 示例修改后',photosNote:'以下是旧比例的 Blender v02 原创示范，不是学生测试成果；新版角色与挑战素材尚待重建。旧 v01 图片暂不展示。',
  transfer:'我的缩图取舍',transferPh:'我会要求 AI 保留哪个特征？缩小后从输出图实际看到什么？',export:'下载我的练习记录',exportNote:'JSON 只含本页选择与自评，不含 3D 模型，也不证明 AI 已操作 Blender。作品须另交 AI 在 Blender 产生的 .blend＋三张图。',
  evidence:'作品交付自查',selfReport:'以上只由你勾选，系统没有读取或验证任何 .blend。请教师或同伴打开你的文件复核。',
  prev:'上一步',next:'下一个任务',end:'回到展示',saved:'记录只存在此浏览器',saveError:'无法本地储存；离页前请下载记录。',corrupt:'旧记录不能安全读取，已保留原数据。本次不覆盖；离页前请下载新记录。',
  record:'下载记录',audio:'本候选没有语音或实时 AI；手机可试操作，Blender 实作需电脑。',step:'任务',visited:'已看角度',resetDone:'已回到这一题的起点。尝试记录保留。',
 },
 en:{
  pageTitle:'Desk Creature · Make Studio',brand:'Wanli AI Classroom',series:'AI 3D Make Studio / Lesson 01',local:'Local prototype · Unpublished',
  title:'You design. AI builds in Blender.',subtitle:'Give clear instructions for AI to operate Blender. You choose, inspect the result and decide what should change.',
  meta:'S1–S2 (to be piloted) · ~30 min whole-path target; player time unmeasured · Astra + Blender',language:'Reading language',tasks:'Your making route',minute:'min',
  stages:[
   ['Meet the brief','You design; AI operates Blender.','Design an original desk creature. Choose its purpose and two features, then direct AI in natural language to model it in Blender.','You take away more than an AI picture: an editable 3D character created in Blender by AI.'],
   ['See an example','See what an AI-operated result looks like.','Switch between the front, right and angled example views. Notice which parts are occluded from different viewpoints.','This is a teacher-made example, not a live connection to AI or Blender on this page.'],
   ['Make choices','You decide. Then AI can help.','Give your creature a job and choose two features that really affect its shape.','For example: a break-time guardian, with uneven ears and eyes visible from the side. Your idea can be completely different. Colour alone is not enough.'],
   ['Direct AI','Predict, then give a modelling instruction.','Predict how much of the left ear is occluded from the right view, then inspect the example. Copy an ear or eye instruction for the school-configured AI operator to execute in Blender.','This page does not pass off slider changes as AI work. Ask AI to export the same view so you can inspect its result.'],
   ['Make v01','Give your idea to the AI operator.','Enter the purpose and two features. Copy the brief to the school-configured Astra/Codex toolchain; AI models in Blender and saves v01 separately.','The target is a checkable AI rough model at about minute 16 of the whole learning path. This stage timebox is untested, not a countdown or grade. If the tool is unavailable, mark the task incomplete.'],
   ['Partner test','No explanation. Let them look.','Show a partner the front, side and angled views. Ask for one feature that is hard to recognise. Note an observation, not their name.','No partner yet? Use the fixed question below for self-checking. Mark real feedback as pending; do not invent a partner response.'],
   ['Direct a revision','You choose the change; AI carries it out.','Use feedback to name one part to revise and explain why. Ask AI to preserve v01, change only that part in Blender, save v02 and export the same views.','This stage is planned for 6 minutes and remains untested. You direct and review the revision; AI operates Blender. You are not expected to edit the model manually.'],
   ['Show your work','Let your creature do the talking.','Show AI-generated v01, v02 and three views. In 20 seconds, name the revision instruction you gave and why.','The images below are teacher-made examples, not your AI result or a single correct answer.'],
   ['Take it further','Tiny icon. Still recognisable?','If your creature became a tiny desktop icon, which feature would you ask AI to preserve? Explain your decision using the exported views.','Take the AI-generated Blender .blend, three images and your revision instruction. This page cannot read or verify your work.'],
  ],
  view:'Viewpoint',views:{front:'Front',side:'Right',oblique:'Angled'},modelLabel:'Practice creature with three selectable viewpoints',modelTag:'M / Original practice model',
  modelNote:'Rebuilt from example parameters with simplified lighting; not a .blend reader.',fallback:'Live 3D is unavailable in this browser. A Blender reference image is shown instead. No exercise is marked as passed. Try a WebGL-capable computer browser, or read the tasks first.',
  help:'A hint, only if you need it',hint:'You do not need to operate Blender. Tell AI: “List the scene object names, export front, side and angled views, change only the part I specify, preserve the rest and save a new version.”',
  purpose:'Its job',purposePh:'For example: a desk guardian that reminds me to take breaks',features:'Two recognisable features',featuresPh:'For example: uneven ears and eyes visible from the side',privacy:'No names, schools, accounts or secret keys.',
  prediction:'Before turning: how much of the left ear do you think the right ear will cover?',one:'Some',two:'Most',ear:'01 / Partly overlapped ears',eye:'02 / Partly covered pupil',earMove:'Adjust the left ear',eyeMove:'Adjust the left eye',toward:'Forward',away:'Backward',
  coordinate:'Example Y value (not centimetres)',checkEar:'Check ear from right',checkEye:'Check eye from front',reset:'Retry this challenge',practice:'Try again. Earlier attempts stay in your record.',
  feedback:{
   'ear:hidden':'The left ear is present; the right ear covers almost all of it from this viewpoint. Nudge it and look for the part that shows.',
   'ear:partly-hidden':'Part of the left ear is visible; the right ear covers the rest. Nudge it to reveal a little more, then compare the front.',
   'ear:separated':'Both ears are clear from the right. Compare the front: what trade-off did the move make? There is no single correct design.',
   'eye:hidden':'The left eye and pupil are present. From the front, the pupil is almost fully covered by the body. Nudge it forward to reveal some of it.',
   'eye:partly-hidden':'Part of the left pupil is visible; the body covers the rest. Nudge it forward to reveal a little more while keeping the eye on the character.',
   'eye:floating':'The pupil is visible, but the eye is too far from the body. Move it back for an attached eye. Floating eyes can be a creative choice, if intentional.',
   'eye:attached':'This front-view line reaches the pupil and the eye still intersects the body. Check the side view too. This is not a complete collision or aesthetics test.',
   'ear:wrong-view':'Switch to Right before checking the ear.','eye:wrong-view':'Switch to Front before checking the eye.',
   'ear:unavailable':'Live 3D is unavailable. No pass recorded.','eye:unavailable':'Live 3D is unavailable. No pass recorded.',
  },history:'Recent attempts',noHistory:'No checks yet. Try an idea first.',result:{hidden:'Almost fully covered','partly-hidden':'Still partly covered',separated:'Both clearly visible',floating:'Too far away',attached:'Clear and still attached','wrong-view':'Change view first',unavailable:'3D unavailable'},
  starter:'Teacher material',rough:'AI-generated v01',roughPending:'The example v01 file and old renders are out of sync and are not offered to learners. The configured AI operates Blender and saves each learner’s v01.',reference:'View teacher example v02',referenceLocked:'This is a teacher example, not a learner result.',onePart:'one named part',noRevisionReason:'You have not entered a revision reason yet.',noPeerNote:'No peer observation has been entered yet.',
  aiOperatorNotice:'This page is not connected to AI or Blender. Copy the instruction to the school-configured AI operator. AI executes it in Blender; you inspect the output.',aiEarInstruction:'Ask AI to adjust only the left ear, keep both ears present and leave other parts unchanged. Save a new version and export right-side and front views.',aiEyeInstruction:'Ask AI to adjust the left eye slightly, keeping the eye identifiable and present. Preserve other parts, save a new version and export front and side views.',aiRevisionInstruction:'Ask AI to change only one named part based on your peer observation and design reason. Preserve v01, save v02 separately and export the same views.',requestEar:'Copy ear revision instruction for AI',requestEye:'Copy eye revision instruction for AI',requestRevision:'Copy my revision instruction for AI',aiRequestCopied:'Instruction copied. It has not been sent or executed, and no Blender file has been generated.',aiRequestCopyFailed:'Copy failed. Select and copy the instruction manually.',
  promptTitle:'Brief for AI to operate Blender',promptHint:'The school must configure a local Astra/Codex toolchain that can operate Blender. AI may create files only in the designated course folder. This text is not sent automatically; this page has no Blender connection.',
  promptMissing:'Enter a purpose and two features in Make choices before creating your AI brief.',copy:'Copy AI modelling brief',copied:'Copied. Paste it into the school-configured AI operator.',copyFailed:'Copy failed. Select the text above and copy it manually.',
  draft:'I reviewed the AI-generated v01 views (self-report)',ownEdit:'I chose and explained one revision to AI (self-report)',revision:'AI saved v02 in Blender following my instruction (self-report)',pictures:'I reviewed AI-exported front, side and angled views (self-report)',
  peer:'What did your partner actually see?',peerPh:'For example: only one ear visible from the side. No test yet? Write “real feedback pending”.',reason:'What did I change, and why?',reasonPh:'One sentence is fine. You can also explain aloud in class.',
  coach:'Fixed coaching question · Not live AI',coachText:'“Without you explaining the character, can I recognise its most important feature from the side? Show me with the model.”',
  photos:'Actual Blender renders / Original example',before:'v01 · Before',after:'v02 · Example revision',photosNote:'This is the older-proportioned v02 Blender example, not a student result. The revised character and challenge assets still need rebuilding; old v01 images are withheld.',
  transfer:'My tiny-icon trade-off',transferPh:'Which feature would you ask AI to preserve? What do you actually see in the exported view?',export:'Download my practice record',exportNote:'The JSON contains page choices and self-reports, not a 3D model; it does not prove AI operated Blender. Submit the AI-generated .blend and three views separately.',
  evidence:'Your hand-in checklist',selfReport:'These are your own checkmarks. No .blend has been read or verified. Ask a teacher or partner to open and review your files.',
  prev:'Previous',next:'Next task',end:'Back to showcase',saved:'Saved only in this browser',saveError:'Local saving failed. Download your record before leaving.',corrupt:'An old record could not be safely read and has been kept intact. This session will not overwrite it. Download your new record before leaving.',
  record:'Download record',audio:'No audio or live AI in this prototype. Try the web exercises on a phone; use a computer for Blender.',step:'Task',visited:'Views explored',resetDone:'This challenge is back at its starting position. Attempts were kept.',
 }
};

export function makePrompt(s) {
  const c=COPY[s.lang];if(!s.purpose.trim()||!s.features.trim())return c.promptMissing;
  const details=`Purpose: ${s.purpose}. Design features: ${s.features}.`;
  if(s.lang==='en')return `You are the AI operator for Blender 4.5 LTS, using only the school-approved local toolchain. The learner directs you in natural language and will not operate Blender directly. ${details} Create an original, editable rough model from 6–10 separately named simple shapes. Keep both eyes and both ears present. Work only in the designated course folder. Save a new v01 without overwriting files. Export front, right-side and three-quarter views. Stop and ask the learner to inspect the result and decide what to revise; do not create v02 or write their reflection. Do not install add-ons, download assets or run untrusted embedded scripts. If Blender or the required tools are unavailable, say no Blender file was created.`;
  if(s.lang==='zh-CN')return `你是 Blender 4.5 LTS 的 AI 操作者，只能使用学校批准的本地工具链。学生用自然语言指挥你，不会直接操作 Blender。${details}请用 6–10 个分别命名的简单形体，制作原创、可编辑的粗模；两只眼睛和两只耳朵都必须存在。只在指定课程文件夹工作，另存为新的 v01，不覆盖已有文件。输出正面、右侧和斜角视图后暂停，请学生检查并决定下一步修改；不要创建 v02，也不要代写反思。不要安装插件、下载素材或运行来源不明的嵌入脚本。如果 Blender 或所需工具不可用，请明确说明没有生成 Blender 文件。`;
  return `你是 Blender 4.5 LTS 的 AI 操作者，只可使用學校批准的本機工具鏈。學生以自然語言指揮你，不會直接操作 Blender。用途：${s.purpose}。設計特徵：${s.features}。請用 6–10 個分別命名的簡單形體，製作原創、可編輯的粗模；兩隻眼睛和兩隻耳朵都必須存在。只在指定課程資料夾工作，另存為新的 v01，不覆寫已有檔案。輸出正面、右側及斜角視圖後暫停，請學生檢查並決定下一步修改；不要建立 v02，也不要代寫反思。不要安裝插件、下載素材或執行來源不明的嵌入腳本。如果 Blender 或所需工具不可用，請明確說明沒有生成 Blender 檔案。`;
}

export function makeRevisionPrompt(s,kind) {
  const note=s.reason.trim()||(s.lang==='en'?'No revision reason entered yet.':s.lang==='zh-CN'?'学生还没有填写修订理由。':'學生尚未填寫修訂理由。');
  const peer=s.peer.trim()||(s.lang==='en'?'No peer observation entered yet.':s.lang==='zh-CN'?'还没有填写同伴观察。':'尚未填寫同伴觀察。');
  const part=kind==='ear'?(s.lang==='en'?'the ear':s.lang==='zh-CN'?'耳朵':'耳朵'):kind==='eye'?(s.lang==='en'?'the eye':s.lang==='zh-CN'?'眼睛':'眼睛'):(s.lang==='en'?'one named part':s.lang==='zh-CN'?'一个指定部件':'一個指定部件');
  const challenge=kind!=='revision';
  if(s.lang==='en')return challenge
    ? `You are the AI operator for Blender 4.5 LTS. The learner directs you in natural language and does not operate Blender. Use only the teacher-provided M example file in the designated course folder. Confirm that it exists; if it does not, stop and ask rather than inventing a source model. Make a separate practice copy and revise only ${part}. Learner's prediction/observation: ${peer} Learner's design reason: ${note} Keep both eyes and both ears present, leave all other parts unchanged, and export front, right-side and three-quarter views. Never overwrite the teacher source. Report completion only if the new .blend and images were actually created.`
    : `You are the AI operator for Blender 4.5 LTS. The learner does not operate Blender; they make the design decision and inspect your result. Revise only ${part}. Learner's observation: ${peer} Learner's reason: ${note} First confirm the learner's v01 is available in the designated course folder; if not, stop and ask rather than inventing a model. Preserve v01, create a separate v02, keep both eyes and both ears present, and export the same front, right-side and three-quarter views for comparison. Do not claim success unless the .blend and images were actually created.`;
  if(s.lang==='zh-CN')return challenge
    ? `你是 Blender 4.5 LTS 的 AI 操作者。学生用自然语言指挥你，不操作 Blender。只使用指定课程文件夹里由教师提供的 M 示例文件；先确认文件确实存在，如找不到就停止询问，不要虚构源模型。复制出独立练习版本，只调整${part}。学生的预测／观察：${peer}学生的设计理由：${note}两只眼睛和两只耳朵都要保留，其他部件不动，并输出正面、右侧和斜角视图。不要覆盖教师源文件。只有实际生成新 .blend 和图片后才报告完成。`
    : `你是 Blender 4.5 LTS 的 AI 操作者。学生不操作 Blender；学生作设计决定并检查你的结果。只修改${part}。学生的观察：${peer}学生的设计理由：${note}先确认指定课程文件夹中确实有学生的 v01；如找不到就停止并说明，不要虚构模型。保留 v01，另存独立的 v02；两只眼睛和两只耳朵都须存在；输出相同的正面、右侧、斜角视图供比较。只有在实际生成 .blend 和图片后才报告完成。`;
  return challenge
    ? `你是 Blender 4.5 LTS 的 AI 操作者。學生以自然語言指揮你，不操作 Blender。只使用指定課程資料夾內由教師提供的 M 示例檔；先確認檔案確實存在，如找不到便停止詢問，不要虛構來源模型。複製成獨立練習版本，只調整${part}。學生的預測／觀察：${peer}學生的設計理由：${note}兩隻眼睛和兩隻耳朵都要保留，其他部件不動，並輸出正面、右側及斜角視圖。不要覆寫教師來源檔。只有實際生成新 .blend 和圖片後才報告完成。`
    : `你是 Blender 4.5 LTS 的 AI 操作者。學生不操作 Blender；學生作設計決定並檢查你的結果。只修改${part}。學生的觀察：${peer}學生的設計理由：${note}先確認指定課程資料夾中確實有學生的 v01；如找不到便停止並說明，不要虛構模型。保留 v01，另存獨立的 v02；兩隻眼睛和兩隻耳朵都須存在；輸出相同的正面、右側、斜角視圖供比較。只有實際生成 .blend 和圖片後才報告完成。`;
}
