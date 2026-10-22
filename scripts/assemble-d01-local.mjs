#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildD01LessonHtml, buildD01ProjectStepHtml, D01_LESSONS } from './lib/d01-local-components.mjs';

const lessons = {
  'D01-01': {
    slug: 'desk-creature', title: '桌面小怪獸', theme: '多視角角色設計',
    mission: '為奇想展設計一個原創桌面角色。由你決定用途和兩個辨識特徵；AI 操作 Blender，你檢查正面、側面與斜角，再決定要不要修改。',
    learningOutcome: '你會用正面、側面和斜角檢查特徵是被遮住，還是真的沒有建出來。',
    question: '怎樣用少量形體，讓觀眾從不同角度認出你的設計意圖？',
    concept: '角色部件仍存在，不代表每個角度都看得見。比較遮擋時固定模型和視角；再檢查實際場景，才分辨視覺重疊與部件缺失。',
    source: 'R｜Blender 4.5 Transform 說明物件位置、旋轉與縮放可分開編輯；本課由此設計「只改一項、同角度比較」，不把遮擋推斷成模型缺件。',
    activationPrompt: '正面看得到左耳，側面卻看不到。你第一眼會怎樣解釋？也可以回答「我還不能判斷」。',
    activationSpeech: '第一眼睇唔到左耳，你會點諗？可以話未能判斷，呢度唔計分。學完多視角檢查，再返嚟驗證。',
    misconception: '從一個角度看不見眼睛或耳朵，不一定代表模型少了部件；先查角度、遮擋和原始模型。',
    investigate: '先留下預測，再指揮 AI 只修改一項，要求保留舊版並用相同視角輸出。作品要有可編輯 .blend、三視圖和 v01／v02。',
    transfer: '把角色縮成小圖示，你會保留哪個輪廓特徵？說明理由，並指出甚麼視角證據會令你改變選擇。',
    pblTitle: '桌面角色設計卡', pblOutput: '.blend 粗模、正／側／斜三視圖、v01／v02、一次實際觀察和學生修訂理由。',
    discussion: 'AI 同學說：「正面看不到左耳，所以它一定不在模型裡。」請指出這個結論還缺甚麼檢查；不要把同伴猜測當成真實觀察。',
    speech: ['今日你做設計師，AI 係 Blender 操作者。你決定用途同特徵，最後用作品證據決定要唔要修改。', '遮住一隻眼或者一隻耳，唔等於少咗一隻。先睇多個角度，再核對模型。'],
  },
  'D01-02': {
    slug: 'monster-organizer', title: '怪獸收納站', theme: '尺寸、入口與取放測試',
    mission: '把桌面小怪獸變成可用的收納站。你決定物件如何分區，AI 在 Blender 製作和移動物件；你要分開驗證放入和取出。',
    learningOutcome: '你會分開檢查外部尺寸、內部可用空間、入口和實際取出路徑。',
    question: '外形看起來放得下，是否代表兩件物品都真的放得進、取得出？',
    concept: '外圍尺寸、內部可用空間和取出路徑是不同問題；畫面看似容得下，不能代替逐件實際安置與取出檢查。',
    source: 'R｜Blender 4.5 Units 與 Transform 文件支持明確尺度及查看物件變換；不會替課堂證明容量、無碰撞或打印安全。',
    activationPrompt: '外面看起來夠大，但道具卡住拿不出來。你會先看哪裏？先講直覺，不用尺寸術語。',
    activationSpeech: '個盒外面睇落夠大，但件文具攞唔出。你會先睇邊度？呢度唔計分，學完再返嚟核對。',
    misconception: '外部尺寸夠大，不代表內部容量、入口或取出路徑一定可用；數碼目視檢查也不是精密碰撞驗證。',
    investigate: '固定兩件課堂模擬道具的尺寸，要求 AI 輸出俯視與側視；先測放入，再逐件測取出，不偷偷縮小道具。',
    transfer: '換一件不同尺寸的道具，說明你會先檢查哪個入口或內部阻擋，再要求 AI 只改一處。',
    pblTitle: '收納站取放測試卡', pblOutput: '可編輯空心收納站 .blend、兩件分開命名道具、放入與取出視圖、v01／v02 和一項功能取捨。',
    discussion: 'AI 同學說：「外面有 130 毫米，所以兩件道具一定放得下。」請指出還要查看的內部尺寸或實際路徑。',
    speech: ['收納站唔係睇外形就算。你要分開檢查放入同取出，AI 負責喺 Blender 執行。', '課堂尺寸係模擬設定，唔係香港文具標準，亦唔係精密碰撞認證。'],
  },
  'D01-03': {
    slug: 'pocket-hideout', title: '口袋秘密基地', theme: '入口、目的地與可見路線',
    mission: '設計一個小角色能找到入口、到達目的地，又讓訪客看懂的迷你基地。你選入口和路線，AI 操作 Blender。',
    learningOutcome: '你會用角色的實際寬度，檢查入口、轉彎和最窄通道。',
    question: '俯視圖上一條線看似暢通，角色真的能走過最窄的位置嗎？',
    concept: '路線是一條線，角色卻有寬度；轉彎、入口和最窄通道都要依同一個角色尺寸檢查，局部抽查也不能證明全程無相交。',
    source: 'R｜Blender 4.5 Transform 與 Units 文件支持檢查場景物件尺寸／位置並先約定尺度；玩具比例不是建築安全或無障礙認證。',
    activationPrompt: '地上畫了路線，但角色比最窄的空位還寬。你覺得角色一定走得通嗎？先說理由，不計分。',
    activationSpeech: '畫咗條路，角色就一定行得到？先睇下個窄位，講下你點諗，呢度唔計分。',
    misconception: '線沒有寬度，角色有；只檢查幾個位置也不能保證整條路徑都不相交。',
    investigate: '先選入口和目的地，再指揮 AI 沿路線輸出俯視及斜視；在最窄處觀察角色兩側，不偷偷縮小角色。',
    transfer: '把目的地換到另一側，重新檢查入口、轉向空間和一處最窄位置；如未執行要標記未測試。',
    pblTitle: '秘密基地路線圖', pblOutput: '新建可編輯基地 .blend、俯視路線、入口視圖、最窄處檢查和一次 AI 執行的布局修訂。',
    discussion: 'AI 同學說：「地板上畫了路線，所以角色一定走得到。」請說明線與角色的寬度差別。',
    speech: ['先定入口同目的地，再睇角色真正有幾闊。畫咗條線唔等於條路行得通。', '只抽查幾點唔可以證明全程無相交，未試就要寫未測試。'],
  },
  'D01-04': {
    slug: 'five-second-story', title: '五秒小劇場', theme: '關鍵時刻與動畫節奏',
    mission: '把「想要—遇阻—有變化」做成一段五秒短動畫。你決定故事與關鍵動作，AI 操作 Blender 時間軸。',
    learningOutcome: '你會用關鍵時刻和實際重播，檢查觀眾是否看得清故事變化。',
    question: '重要動作前後留多少時間，觀眾才看得清故事變化？',
    concept: '關鍵幀只記錄選定時刻的屬性，中間變化受插值和時間間隔影響；有幀不等於動作自然，需實際播放並由觀眾檢查節奏。',
    source: 'R｜Blender 4.5 Keyframes 與 Output Format 說明關鍵幀及幀率概念；課堂示例時長和觀眾感受仍須按實際作品驗證。',
    activationPrompt: '動畫裏有個重要變化一閃而過。你猜觀眾可能會漏看甚麼？先分享想法，不計分。',
    activationSpeech: '有一下重要變化一閃而過，你估觀眾會睇漏乜？先講下想法，呢度唔計分，之後再睇時間點。',
    misconception: '兩個不同的關鍵幀不保證動作自然；靜態分鏡或把播放器放慢也不能代替修改時間軸並實際播放。',
    investigate: '在 24 fps、1–120 幀的課堂示例中先預測，再請 AI 只改一個中間時間點，播放前後兩版並看中段。',
    transfer: '若故事只能保留三秒，你會縮短哪段、保留哪個瞬間？指出實際播放中支持判斷的畫面。',
    pblTitle: '五秒動畫節奏卡', pblOutput: '可重開的 .blend 時間軸、可播放 v01／v02、關鍵時刻接觸表和一次按實際觀眾反應作的修改。',
    discussion: 'AI 同學說：「我把影片播放器放慢，觀眾就看得懂。」請分辨播放速度與作品時間軸。',
    speech: ['你係小導演，決定故事變化；AI 喺 Blender 改時間軸。', '五秒同 120 幀係課堂設定，唔代表真實物理。要實際播放先知道節奏清唔清楚。'],
  },
  'D01-05': {
    slug: 'shadow-riddle', title: '影子猜謎機', theme: '真實投影與單一變因',
    mission: '製作一個先看影子、再揭曉立體形體的原創謎題。你決定謎底線索，AI 在 Blender 調整形體和燈光。',
    learningOutcome: '你會固定其他條件、一次只改一項，再用同一視角比較真實投影。',
    question: '要知道哪個改動令影子改變，為甚麼一次只改一項？',
    concept: '投影由場景中的物件、光源與視角共同影響；一次同時改多個條件，就無法把差異歸因於其中一項。',
    source: 'R｜Blender 4.5 Light Objects 文件指出光源位置／大小會影響陰影特徵；具體畫面仍受場景與渲染設定影響，剪影貼圖不是真投影。',
    activationPrompt: '燈光、物件和相機都改過，影子也變了。現在能確定是哪一項造成嗎？先說你的想法，不計分。',
    activationSpeech: '燈、物件同相機一齊改過，影子變咗。你估而家可唔可以知道邊樣造成？呢度唔計分。',
    misconception: '剪影貼圖不是場景算出的真實投影；同時改燈光、物件和視角，就不能分辨是哪項造成變化。',
    investigate: '鎖定物件、相機和亮度，只改一項光源條件，從同一視角輸出真正投影；若工具未執行，標記未測試。',
    transfer: '同一謎底換另一位觀眾，記錄對方實際猜測；說明這個小樣本不能代表所有觀眾。',
    pblTitle: '影子謎題測試卡', pblOutput: '可編輯影子裝置 .blend、謎面與揭曉圖、鎖定條件、v01／v02 和真實觀眾猜測。',
    discussion: 'AI 同學同時改了光源半徑和亮度，然後說「半徑令邊緣更清楚」。這個結論還缺甚麼？',
    speech: ['今次要睇 Blender 真正計出嘅影子，唔係用一張黑色貼圖扮出嚟。', '燈、物件同相機要鎖住，先改一項，再用同一視角比較。'],
  },
  'D01-06': {
    slug: 'mini-exhibition', title: '迷你奇想展', theme: '展品取捨與觀眾第一眼',
    mission: '用兩件核心作品建一個新的微型展場。你決定主題、入口、焦點和觀看次序；AI 在 Blender 建立展場副本，不覆蓋原作。',
    learningOutcome: '你會用真實觀眾的第一眼回饋，檢查入口和焦點是否清楚，再修訂布局。',
    question: '觀眾沒有設計師解說時，能否找到入口並看見你想突出的作品？',
    concept: '設計者的預期不等於觀眾實際第一眼。安排不聽解說的盲看，記錄真實反應，再把觀察限定在實際參與者和本次布局。',
    source: 'R｜PBLWorks 設計原則作教學參考，支持學生決策、觀眾與回饋修訂的設計取向；本課為原創設計，未獲該機構認證。Blender Transform 支持另存副本後調整展品。',
    activationPrompt: '設計師覺得中央展品最突出，但參觀者第一眼先看了別處。你最想先知道什麼？先猜，不計分。',
    activationSpeech: '設計師覺得中間嗰件最搶眼，但觀眾先睇咗其他地方。你最想先知乜？先估下，呢度唔計分。',
    misconception: '設計師認為焦點清楚，不等於觀眾實際看見；一位觀眾的反應也不代表普遍喜好。',
    investigate: '先選兩件核心展品，在入口視角盲測；記錄觀眾實際先看到甚麼，再只改一項布局並對比 v01／v02。',
    transfer: '把主焦點換成另一件作品，說明新入口視角需要改哪一項；若沒有課外觀眾，就如實標示班內試展。',
    pblTitle: '迷你展覽策展卡', pblOutput: '新建展場 .blend、兩件核心展品、入口／焦點／全景圖、v01／v02 和真實觀眾回饋。',
    discussion: 'AI 同學說：「我覺得中央那件一定最先被看到。」請指出如何讓未聽解說的觀眾實際試看。',
    speech: ['今次要新建展場，唔係將舊檔案塞入資料夾；原作要保留。', '觀眾睇到乜要記錄真實反應。一個人嘅答案唔代表全班。'],
  },
};

const lessonId = process.argv[2];
const outputPath = path.resolve(process.argv[4] ?? `data/classrooms/hk-d01-${lessonId?.slice(-2)}-${lessons[lessonId]?.slug}.json`);
const requestedClassroomId = process.argv[5];
const config = lessons[lessonId];
assert(config, `Usage: node scripts/assemble-d01-local.mjs D01-01 [hosted.json] [output.json]`);
const narration = {
  opening: `歡迎嚟到「${config.title}」！${config.speech[0]} 今堂唔係記 Blender 按鈕，係由你決定做乜、點樣檢查同點樣改。撳開始項目，先話畀設計教練知你想做一件點樣嘅作品。後面嘅工作頁係需要時先睇嘅工具，唔係要一路考試。`,
  method: `當你要作設計決定，先睇返呢個檢查方法。${config.speech[1]} 唔使背術語；用自己件作品講清楚你睇到乜，同埋仲未證明乜，就得㗎喇。`,
  choice: `而家揀一個你自己想試嘅設計方向，寫低原因，再將要求交畀學校核准嘅 AI 操作工具。呢個工作頁唔會直接開 Blender；AI 話完成唔等於有作品，要睇到真正嘅檔案同畫面。將你嘅決定提交返 PBL 工作台。`,
  investigation: `先估結果，再諗點樣檢查。固定比較條件，只揀一項去改。${config.speech[1]} 記低你實際睇到嘅結果；如果工具仲未執行，就寫未測試，唔好填一個估出嚟嘅答案。`,
  critique: `請同伴睇你嘅第一版，問一個可以核對嘅問題。先聽對方實際睇到乜，再決定接唔接受意見。AI 同學只係提出問題，唔係真實觀眾。記低一項證據、一項仲未證明嘅講法，同你自己嘅取捨。`,
  revision: `而家由你決定點改，唔好一口氣全部改晒。保留第一版，再請 AI 只改你揀嘅一項，另存第二版。用相同條件比較，講清楚邊度有分別，同埋點解保留或者拒絕呢個改動。`,
  showcase: `準備展示你嘅作品。講清楚你想解決乜、畀大家睇到真正嘅檔案或者播放結果，再展示第一版同第二版嘅差別。仲未試嘅部分照直講；唔好將教練示例或者 AI 嘅回覆當成你完成咗嘅作品。`,
  transfer: `返嚟睇下你一開始點諗，依家有冇證據令你改變判斷？如果換一個條件，你會重新檢查邊一項？寫低一個可以帶去下一件作品嘅方法，同埋一個你仲想試嘅問題。`,
};
const actualInput = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(`output/d01-openmaic-candidates/${lessonId}-${JSON.parse(await readFile(path.resolve(`docs/curriculum/generation-manifests/${lessonId}.json`), 'utf8')).submission.hostedClassroomId}.json`);
const classroom = JSON.parse(await readFile(actualInput, 'utf8'));
assert(classroom.scenes?.length === 9, 'Hosted candidate must contain the approved nine-scene outline.');
const studentAgent = classroom.stage?.generatedAgentConfigs?.find((agent) => agent.role === 'student')?.id;
assert(studentAgent, 'Hosted candidate must include an AI peer role for the bounded discussion prompt.');
// Lesson filenames intentionally differ from short IDs; pin an explicit map instead of guessing.
const sourceFiles = {
  'D01-01': '01-desk-creature.md', 'D01-02': '02-monster-organizer.md', 'D01-03': '03-pocket-hideout.md',
  'D01-04': '04-five-second-story.md', 'D01-05': '05-shadow-riddle.md', 'D01-06': '06-mini-exhibition.md',
};
const source = await readFile(path.resolve(`docs/curriculum/courses/D01-ai-3d-design-studio/${sourceFiles[lessonId]}`), 'utf8');
assert(['## 1.', '## 4.', '## 11.', '## 17.'].every((section) => source.includes(section)), `${lessonId}: source lesson must include its mission, interaction contract, evidence base and OpenMAIC blueprint.`);

const esc = (value) => value.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]);
const speech = (id, text) => ({ id, type: 'speech', text });
const element = (id, left, top, width, height, content, color = '#17324d') => ({ id, type: 'text', left, top, width, height, rotate: 0, defaultColor: color, defaultFontName: 'PingFang HK', content });
const shape = (id, left, top, width, height, fill) => ({ id, type: 'shape', left, top, width, height, rotate: 0, fill, fixedRatio: false, path: 'M 0 0 L 1 0 L 1 1 L 0 1 Z', viewBox: [1, 1] });
function slide(id, order, title, blocks, narration) {
  const items = [
    shape(`${id}-paper`, 40, 32, 920, 500, '#ffffff'),
    element(`${id}-title`, 68, 50, 860, 58, `<p style="font-size:30px;font-weight:bold;color:#17324d">${esc(title)}</p>`),
    shape(`${id}-rule`, 68, 118, 860, 4, '#12b8a6'),
  ];
  let top = 146;
  for (const [index, block] of blocks.entries()) {
    items.push(shape(`${id}-card-${index}`, 68, top, 860, block.height ?? 84, index % 2 ? '#eef7fb' : '#e9f7f4'));
    items.push(element(`${id}-copy-${index}`, 88, top + 12, 820, (block.height ?? 84) - 20,
      `<p style="font-size:${block.size ?? 18}px;line-height:1.5;color:#17324d">${esc(block.text)}</p>`));
    top += (block.height ?? 84) + 14;
  }
  return {
    id, stageId: classroom.id, title, order, type: 'slide', outlineId: `${id}-outline`, createdAt: Date.now(), updatedAt: Date.now(),
    actions: narration ? [speech(`${id}-narration`, narration)] : [],
    content: { type: 'slide', canvas: { id: `${id}-canvas`, viewportSize: 1000, viewportRatio: 0.5625,
      theme: { backgroundColor: '#f3f8fc', themeColors: ['#12b8a6', '#17324d', '#ffbf69'], fontColor: '#17324d', fontName: 'PingFang HK' },
      elements: items, background: { type: 'solid', color: '#f3f8fc' } } },
  };
}
function quiz(id, order, title, question, options, answer, analysis, narration) {
  return { id, stageId: classroom.id, title, order, type: 'quiz', outlineId: `${id}-outline`, createdAt: Date.now(), updatedAt: Date.now(),
    actions: narration ? [speech(`${id}-narration`, narration)] : [],
    content: { type: 'quiz', questions: [{ id: `${id}-q1`, type: 'single', question, options: options.map((label, i) => ({ value: String.fromCharCode(65 + i), label })), answer: [String.fromCharCode(65 + options.indexOf(answer))], analysis, points: 10, hasAnswer: true }] } };
}
function interactive(id, order) {
  const html = buildD01LessonHtml(lessonId, 'zh-HK');
  return { id, stageId: classroom.id, title: '先作設計選擇，再按真實輸出修訂', order, type: 'interactive', outlineId: `${id}-outline`, createdAt: Date.now(), updatedAt: Date.now(),
    actions: [speech(`${id}-narration`, narration.choice)],
    content: { type: 'interactive', url: '', html, widgetType: 'game', widgetConfig: { type: 'game', componentId: `d01-${lessonId.toLowerCase()}-workbench`, version: 1, stateKey: `${classroom.id}:${lessonId}:workbench` } } };
}
function projectStep(id, order, step, title, narration, discussion = false) {
  const actions = narration ? [speech(`${id}-narration`, narration)] : [];
  if (discussion) actions.push({ id: `${id}-discussion`, type: 'discussion', topic: config.question,
    prompt: `只就本課學習內容回應。AI 同學提出：「${config.discussion}」請先詢問學生實際看到的證據，再指出推論限制；不得聲稱工具已執行、觀眾已有反應或替學生決定設計。`, agentId: studentAgent });
  return { id, stageId: classroom.id, title, order, type: 'interactive', outlineId: `${id}-outline`, createdAt: Date.now(), updatedAt: Date.now(), actions,
    content: { type: 'interactive', url: '', html: buildD01ProjectStepHtml(lessonId, step, 'zh-HK'), widgetType: 'game',
      widgetConfig: { type: 'game', componentId: `d01-${lessonId.toLowerCase()}-${step}`, version: 1, stateKey: `${classroom.id}:${lessonId}:pbl-step:${step}` } } };
}
function project(now) {
  const stages = [
    ['driving-question', '驅動問題', config.question, '由學生選定本課作品要解決的設計問題和觀眾需要。', '留下自己的設計方向及理由；不得由 AI 替學生定案。'],
    ['readiness-check', '準備度｜不計分起點', config.activationPrompt, '先說第一個想法，也可以明確寫「未能判斷」；不考術語、不設標準答案。', '留下未經教學的初始想法，供最後反思比較，不作成績。'],
    ['project-brief', '項目簡報', config.mission, `核對作品範圍與交付物：${config.pblOutput}；由學生掌握設計決定，AI 只負責在核准工具中操作 Blender。`, '留下作品用途、必交成果和不得假稱已執行的邊界。'],
    ['investigation', '調查｜選定可檢查的證據', config.investigate, '決定要固定的條件、只測的一項，以及甚麼可觀察結果能支持或推翻預測。', '留下測試條件與觀察計劃；未實際執行時標示未測試。'],
    ['prototype', '原型｜指揮 AI 製作 v01', `把學生的設計選擇交給校方核准的 AI 操作者，建立第一版：${config.pblOutput}`, '保存可重開的 v01 或如實記錄工具未執行；不可用 AI 回覆冒充 Blender 檔案。', '保留學生的原始指令、實際 .blend 版本或未測試狀態。'],
    ['critique', '評議｜按證據給回饋', config.discussion, '同伴／AI 同學只能提出可核對問題；學生以作品證據接受、拒絕或修正意見。', '留下具體證據、一項未證明的主張和學生本人的取捨。'],
    ['revision', '修訂｜由學生決定 v02', config.misconception, '學生選擇只改一項；在相同視角／條件下比較 v01、v02，解釋修改或保留的理由。', '保存 v01／v02、可見差異和修訂理由；沒有真實輸出就標未測試。'],
    ['showcase', '展示｜提交作品與證據', config.pblOutput, '展示設計意圖、作品、實際檢查證據和仍未知部分；不把虛構觀眾反應當結果。', '作品可重開，並附版本差異、證據來源和未驗證邊界。'],
    ['reflection-transfer', '反思與遷移', config.transfer, '回看起點想法與作品證據；換一個條件，指出要重新檢查哪一項及所需證據。', '記下學習前後判斷的變化和一個可遷移到新情境的檢查方法。'],
  ];
  const milestones = stages.map(([curriculumStage, label, prompt, description, completionCriteria], order) => ({
    id: `d01-${lessonId.toLowerCase()}-ms-${curriculumStage}`, curriculumStage, title: label, description, order,
    status: order === 0 ? 'active' : 'locked', briefing: `${prompt}\n\n${description}`, completionCriteria,
    debrief: '請把本步的作品或證據存入此項目；完成後再進入下一里程碑。',
    microtasks: [{ id: `d01-${lessonId.toLowerCase()}-mt-${curriculumStage}`, title: label, description: `${prompt}\n\n${description}`,
      ...(curriculumStage === 'readiness-check' ? { assessmentMode: 'ungraded-reflection' } : {}),
      completionCriteria, status: order === 0 ? 'in_progress' : 'todo', assignee: 'user',
      hints: ['學生作設計決定並驗收；AI 只按學生指令操作 Blender。', '將互動工作頁的結果明確提交到本 PBL 里程碑。', '沒有實際輸出就標示未測試。'], order: 0 }],
  }));
  return {
    uiPhase: 'hero', title: config.pblTitle, description: `從驅動問題開始，持續調查、製作、評議、修訂並展示同一份作品。必交：${config.pblOutput}`,
    learningObjective: config.learningOutcome, gains: ['定義自己的設計問題', '指揮 AI 建立可檢查的原型', '按回饋由自己修訂作品', '展示真實證據並說明限制'],
    proficiency: 'intermediate', proficiencyAssessment: { tier: 'intermediate', score: 0, confidence: 0.1, source: 'local-template', signals: [], lastUpdatedAt: now, transitions: [], dynamicSignalsSinceRetier: 0, turnsSinceRetier: 0 },
    language: 'zh-HK', languageDirective: '主課及教練使用香港繁體中文；互動工作台可切換简体中文及 English 閱讀。預錄旁白使用粵語，其他口語音軌尚未提供，不能把閱讀切換說成聲音切換。AI 操作 Blender，學生不直接操作。',
    tags: ['D01', lessonId, 'AI-3D', 'PBL'], status: 'active',
    portfolioInput: lessonId === 'D01-01' ? '無前課作品要求；從本課原創任務開始。' : '本課可以獨立開始；前課作品只作可選素材。',
    portfolioOutput: config.pblOutput, nextUse: '可把本課作品或設計決策帶入下一課作可選靈感；下一課仍可獨立重建。',
    roles: [{ id: `d01-${lessonId.toLowerCase()}-coach`, type: 'instructor', name: '設計教練', description: '先詢問學生觀察到的證據，再提示一項可檢查的下一步。', systemPrompt: '使用香港繁體書面中文。不要代替學生選設計；不要聲稱操作 Blender；不索取個人資料；不把模擬當實測。' }],
    milestones, submissions: [], evaluations: [], threads: [{ agentId: `d01-${lessonId.toLowerCase()}-coach`, messages: [] }], engagementEvents: [], createdAt: now, updatedAt: now, runtimeEvents: [],
  };
}

const stamp = new Date().toISOString();
classroom.id = requestedClassroomId ?? `hk-d01-${lessonId.slice(-2)}-${config.slug}`;
assert(/^[a-zA-Z0-9_-]+$/.test(classroom.id), 'Classroom ID must contain only letters, digits, underscores and hyphens.');
classroom.stage.id = classroom.id;
classroom.stage.name = config.title;
classroom.stage.description = `${config.theme}｜${config.question}`;
classroom.stage.languageDirective = '主課閱讀文字使用繁體中文（香港）；交互工作台可切換繁體中文（香港）、简体中文和 English。粵語、普通話和英文口語稿分開撰寫；沒有音檔不得聲稱已有旁白。AI 在學校核准的工具鏈中操作 Blender，學生不直接操作 Blender。主課生成只提供教師審核，未通過校方工具／資料條件前不作學生操作。';
classroom.stage.style = { theme: 'wanli-ai-makers-studio', primaryColor: '#12b8a6', accentColor: '#17324d', backgroundColor: '#f3f8fc', fontFamily: 'PingFang HK' };
const agentPresentation = {
  teacher: { name: '設計教練', persona: '以提問引導學生先說出實際觀察，再找一項可以檢查的證據。不可代替學生作設計決定、不可聲稱 Blender 已執行。' },
  assistant: { name: 'AI 操作員（課堂角色）', persona: '只作為課堂角色協助學生把指令寫清楚。本課不連接 Blender，也不能聲稱已建立、修改或保存模型；任何實際操作須由學校另行核准的工具執行並由學生查看真實輸出。' },
  student: { name: 'AI 同學阿奇', persona: '提出一個可被查證的觀察問題，清楚分辨看到的畫面與推論；不可聲稱工具已執行或把虛構回應說成真實測試。' },
};
const presentAgents = (agents = []) => {
  let peerIndex = 0;
  return agents.map((agent) => {
    const presentation = agentPresentation[agent.role];
    if (!presentation) return agent;
    if (agent.role !== 'student') return { ...agent, ...presentation };
    if (peerIndex >= 2) return null;
    const peerName = peerIndex++ === 0 ? 'AI 同學阿奇' : 'AI 同學思思';
    return { ...agent, ...presentation, name: peerName };
  }).filter(Boolean);
};
classroom.agents = presentAgents(classroom.agents);
classroom.stage.generatedAgentConfigs = presentAgents(classroom.stage.generatedAgentConfigs);
classroom.createdAt = stamp;
classroom.scenes = [
  { id: 'd01-scene-08', stageId: classroom.id, title: `PBL 項目主線｜${config.pblTitle}`, order: 1, type: 'pbl', outlineId: 'd01-scene-08-outline', createdAt: Date.now(), updatedAt: Date.now(), actions: [speech('d01-scene-08-opening', narration.opening)], content: { type: 'pbl', projectV2: project(stamp) } },
  slide('d01-scene-02', 2, '先觀察｜第一個想法不計分', [
    { text: `觀察情境：${config.activationPrompt}`, height: 100, size: 19 },
    { text: '先用自己的話說說你看到甚麼、猜甚麼；也可以說「我還不能判斷」。這不是考試，不計分，不需要 Blender 術語。', height: 100, size: 17 },
    { text: '把這個起點記入 PBL 工作台的「準備度」里程碑；稍後用作品和證據回看，不計分。', height: 84, size: 17 },
  ], config.activationSpeech),
  slide('d01-scene-03', 3, '按需查看｜本課的一個檢查方法', [
    { text: `核心概念｜只在你要作項目決定時參考：${config.concept}`, height: 96, size: 17 },
    { text: config.source, height: 96, size: 16 },
    { text: 'M｜課堂重建或模擬只供比較，不代表香港現況，也不是學生實際作品。', height: 72, size: 16 },
    { text: 'S｜委託情境為原創；同伴／觀眾反應須現場取得。回到 PBL 工作台，把檢查方法用在你的作品上。', height: 78, size: 16 },
  ], narration.method),
  interactive('d01-scene-04', 4),
  projectStep('d01-scene-05', 5, 'investigation', '調查｜為作品設計一次可檢查的試驗', narration.investigation),
  projectStep('d01-scene-06', 6, 'critique', '同伴評議｜這項設計判斷還缺哪項證據？', narration.critique, true),
  projectStep('d01-scene-07', 7, 'revision', '修訂｜只改一項並比較前後版本', narration.revision),
  projectStep('d01-scene-08-showcase', 8, 'showcase', '展示｜提交作品與可追溯證據', narration.showcase),
  projectStep('d01-scene-09', 9, 'transfer', '反思與遷移｜新條件帶來甚麼改變？', narration.transfer),
].map((scene, index) => ({ ...scene, order: index + 1, stageId: classroom.id }));

const targetDir = path.dirname(outputPath);
await mkdir(targetDir, { recursive: true });
const temporary = `${outputPath}.assemble.tmp`;
await writeFile(temporary, `${JSON.stringify(classroom, null, 2)}\n`, 'utf8');
await rename(temporary, outputPath);
console.log(JSON.stringify({ input: actualInput, output: outputPath, classroomId: classroom.id, scenes: classroom.scenes.length, types: classroom.scenes.map((scene) => scene.type), generatedAgents: classroom.stage.generatedAgentConfigs?.length ?? 0 }, null, 2));
