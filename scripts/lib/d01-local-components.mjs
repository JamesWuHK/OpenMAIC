const COPY = {
  'zh-HK': {
    lang: 'zh-Hant-HK', name: '繁體中文', title: 'AI 3D 設計工作台', languageLabel: '閱讀語言',
    mission: '學生作選擇、指揮與驗收；校方核准的 AI 操作者負責在 Blender 執行。學生不直接操作 Blender。',
    privacy: '不要輸入姓名、學校、住址、帳號、人臉或聲音等資料。資料留在本機，不會連接模型。',
    signature: '設計判斷｜先留下你的選擇', rationale: '你根據甚麼線索作這個選擇？', observation: '試看後實際觀察到甚麼？',
    test: '檢查這次設計判斷', feedback: '回饋', revision: 'AI 執行後｜一次只改一項',
    current: '目前作品／初始狀態', request: '請 AI 操作者只改哪一項？', evidence: '用同一角度或同一條件比較，看到甚麼改變？',
    sameView: '我已選定同一視角／同一測試條件', confirm: 'AI 操作者已執行並另存新版本（學生自我記錄）',
    handoff: '整理給校方 AI 操作者的指令', checkRevision: '檢查修訂記錄', save: '本機保存中', saved: '已保存在此裝置',
    missingChoice: '先作一個設計選擇，再提交。', missingReason: '加上一句理由，指出你看重的特徵或條件。',
    missingObservation: '先記錄一次實際觀察；如工具未能執行，請如實記「未測試」。',
    retry: '已留下提示，請補上缺少的證據再試。創作答案沒有唯一正解。',
    missingRevision: '請寫出一項具體修訂，不要同時更改多項。', missingEvidence: '請比較前後版本，寫下看到的差異；未執行就標作未測試。',
    needSameView: '請先確認使用同一視角／條件比較，否則無法判斷是哪項改動造成差異。',
    needAi: '這份記錄仍是待執行的指令草稿；沒有 Blender 證據前，不可標記修訂完成。',
    complete: '作品證據已記錄。這是學習記錄，不代表系統已檢查 .blend 檔。',
    firstSuccess: '判斷與觀察已保存；這不是答案判定，接着比較作品證據。',
    prompt: '交給校方核准的 AI 操作者：只按以下學生決定執行 Blender 修改；學生不操作 Blender。完成後另存新版本，回報實際改動與未能驗證之處。',
    noStorage: '此瀏覽器未能保存；請先抄錄作品記錄，不要輸入個人資料。',
  },
  'zh-CN': {
    lang: 'zh-Hans', name: '简体中文', title: 'AI 3D 设计工作台', languageLabel: '阅读语言',
    mission: '学生负责选择、指挥和验收；由学校批准的 AI 操作者在 Blender 中执行。学生不直接操作 Blender。',
    privacy: '不要输入姓名、学校、住址、账号、人脸或声音等资料。资料保留在本机，不会连接模型。',
    signature: '设计判断｜先留下你的选择', rationale: '你根据什么线索作出这个选择？', observation: '试看后实际观察到什么？',
    test: '检查这次设计判断', feedback: '反馈', revision: 'AI 执行后｜一次只改一项',
    current: '目前作品／初始状态', request: '请 AI 操作者只改哪一项？', evidence: '用同一角度或同一条件比较，看到什么变化？',
    sameView: '我已选定同一视角／同一测试条件', confirm: 'AI 操作者已执行并另存新版本（学生自我记录）',
    handoff: '整理给学校 AI 操作者的指令', checkRevision: '检查修订记录', save: '本机保存中', saved: '已保存在此设备',
    missingChoice: '先作出一个设计选择，再提交。', missingReason: '补上一句理由，指出你看重的特征或条件。',
    missingObservation: '先记录一次实际观察；如果工具无法执行，请如实记录“未测试”。',
    retry: '已留下提示，请补上缺少的证据再试。创作答案没有唯一正解。',
    missingRevision: '请写出一项具体修订，不要同时更改多项。', missingEvidence: '请比较前后版本，写下看到的差异；未执行就标记为未测试。',
    needSameView: '请先确认使用同一视角／条件比较，否则无法判断是哪项改动造成差异。',
    needAi: '这份记录仍是待执行的指令草稿；没有 Blender 证据前，不可标记修订完成。',
    complete: '作品证据已记录。这是学习记录，不代表系统已检查 .blend 文件。',
    firstSuccess: '判断和观察已保存；这不是答案判定，接下来比较作品证据。',
    prompt: '交给学校批准的 AI 操作者：只按以下学生决定执行 Blender 修改；学生不操作 Blender。完成后另存新版本，回报实际改动与未能验证之处。',
    noStorage: '此浏览器无法保存；请先抄录作品记录，不要输入个人资料。',
  },
  en: {
    lang: 'en', name: 'English', title: 'AI 3D Design Workbench', languageLabel: 'Reading language',
    mission: 'Students choose, direct, and review. A school-approved AI operator works in Blender; students do not operate Blender directly.',
    privacy: 'Do not enter names, school, address, account, face, or voice data. This record stays on this device and does not call a model.',
    signature: 'Design decision | Record your choice first', rationale: 'What clue or condition supports your choice?', observation: 'What did you actually observe in the test?',
    test: 'Check this design decision', feedback: 'Feedback', revision: 'After AI execution | Change one thing at a time',
    current: 'Current work / starting state', request: 'What single change should the AI operator make?', evidence: 'Compare under the same view or condition. What changed?',
    sameView: 'I selected the same view / test condition for comparison', confirm: 'The AI operator executed and saved a new version (learner self-report)',
    handoff: 'Prepare instructions for the school AI operator', checkRevision: 'Check revision record', save: 'Saving locally', saved: 'Saved on this device',
    missingChoice: 'Make a design choice before submitting.', missingReason: 'Add one reason naming the feature or condition you value.',
    missingObservation: 'Record an actual observation. If the tool could not run, state “not tested”.',
    retry: 'A hint is ready. Add the missing evidence and try again. Creative work has no single correct answer.',
    missingRevision: 'Describe one specific revision; do not change several things at once.',
    missingEvidence: 'Compare the versions and record the visible difference; if not executed, mark it not tested.',
    needSameView: 'Confirm the same view or test condition first; otherwise the cause of a difference cannot be isolated.',
    needAi: 'This is still an instruction draft. Do not mark the revision complete without Blender evidence.',
    complete: 'Work evidence recorded. This is a learning log; the system has not inspected a .blend file.',
    firstSuccess: 'Decision and observation saved. This is not an answer score; next, compare work evidence.',
    prompt: 'For the school-approved AI operator: make only the Blender change chosen by the learner below; the learner does not operate Blender. Save a new version and report what changed and what could not be verified.',
    noStorage: 'This browser could not save. Copy your work record first; do not enter personal data.',
  },
};

const LESSONS = [
  {
    id: 'D01-01', title: ['桌面小怪獸', '桌面小怪兽', 'Desk Creature'],
    question: ['從哪個角度最容易認出你設計的角色？', '从哪个角度最容易认出你设计的角色？', 'From which view is your character easiest to recognize?'],
    choices: [['正面特徵','側面輪廓','斜角組合'], ['正面特征','侧面轮廓','斜角组合'], ['Front feature','Side silhouette','Three-quarter view']],
    initial: ['角色用途與兩個辨識特徵', '角色用途与两个辨识特征', 'Character purpose and two recognition features'],
    changed: ['AI 加上特徵後，正面和側面是否仍看得到？', 'AI 加上特征后，正面和侧面是否仍看得到？', 'After AI adds the features, are they visible from both front and side?'],
  },
  {
    id: 'D01-02', title: ['怪獸收納站', '怪兽收纳站', 'Monster Organizer'],
    question: ['怎樣擺放，才能讓物件放得入、拿得出？', '怎样摆放，才能让物件放得进、拿得出？', 'How can an object fit in and still be easy to retrieve?'],
    choices: [['先留入口','按取用次序','把常用物放近'], ['先留入口','按取用顺序','把常用物放近'], ['Keep an opening','Order by retrieval','Place frequent items nearby']],
    initial: ['物件大小與收納分區', '物件大小与收纳分区', 'Object size and storage zones'],
    changed: ['AI 擺放後，入口是否暢通，物件是否可取？', 'AI 摆放后，入口是否畅通，物件是否可取？', 'After AI arranges it, is the opening clear and the object retrievable?'],
  },
  {
    id: 'D01-03', title: ['口袋秘密基地', '口袋秘密基地', 'Pocket Hideout'],
    question: ['訪客怎樣由入口走到目的地，而不被擋住？', '访客怎样从入口走到目的地，而不被挡住？', 'How can a visitor reach the destination from the entrance without a blockage?'],
    choices: [['先定入口與目的地','保留轉身空間','讓路線一眼看懂'], ['先定入口与目的地','保留转身空间','让路线一眼看懂'], ['Set entrance and destination','Leave turning room','Make the route legible']],
    initial: ['入口、目的地與路線', '入口、目的地与路线', 'Entrance, destination, and route'],
    changed: ['AI 建好後，視線和路線是否真的連通？', 'AI 建好后，视线和路线是否真的连通？', 'After AI builds it, are the sightline and route actually connected?'],
  },
  {
    id: 'D01-04', title: ['五秒小劇場', '五秒小剧场', 'Five-Second Story'],
    question: ['哪個時刻要留空間，讓觀眾看懂故事變化？', '哪个时刻要留空间，让观众看懂故事变化？', 'Where should you leave time for the audience to understand the story change?'],
    choices: [['重要動作前','變化發生時','結尾停留時'], ['重要动作前','变化发生时','结尾停留时'], ['Before key action','At the change','At the ending']],
    initial: ['起因、變化與結尾', '起因、变化与结尾', 'Beginning, change, and ending'],
    changed: ['AI 播放後，關鍵變化是否看得清？', 'AI 播放后，关键变化是否看得清？', 'After AI plays it, is the key change clear?'],
  },
  {
    id: 'D01-05', title: ['影子猜謎機', '影子猜谜机', 'Shadow Riddle'],
    question: ['怎樣只改一項，測試真實投影是否更易辨認？', '怎样只改一项，测试真实投影是否更容易辨认？', 'How can one controlled change test whether a real shadow is easier to recognize?'],
    choices: [['只改光源大小','固定物件位置','固定觀察角度'], ['只改光源大小','固定物件位置','固定观察角度'], ['Change light size only','Keep object fixed','Keep view fixed']],
    initial: ['謎底意圖與光源／物件／背板條件', '谜底意图与光源／物件／背板条件', 'Intended riddle and light/object/screen setup'],
    changed: ['AI 修改後，畫面中是否出現真實投影？', 'AI 修改后，画面中是否出现真实投影？', 'After the AI change, is an actual projected shadow visible?'],
  },
  {
    id: 'D01-06', title: ['迷你奇想展', '迷你奇想展', 'Mini Wonder Exhibition'],
    question: ['觀眾第一眼會看到甚麼，之後怎樣探索兩件展品？', '观众第一眼会看到什么，之后怎样探索两件展品？', 'What does a visitor see first, and how do they explore two exhibits next?'],
    choices: [['入口對準主焦點','先近看再遠看','保留自由探索'], ['入口对准主焦点','先近看再远看','保留自由探索'], ['Align entry with focal point','Near then far','Allow free exploration']],
    initial: ['展覽主題、兩件展品與主焦點', '展览主题、两件展品与主焦点', 'Exhibition theme, two works, and focal point'],
    changed: ['觀眾試看後，入口與焦點是否清楚？', '观众试看后，入口与焦点是否清楚？', 'After a visitor test, are the entrance and focal point clear?'],
  },
];

export const D01_LESSONS = LESSONS.map((lesson) => ({ ...lesson }));

function d01BridgeClient(slot) {
  return `let d01Sequence=0;const d01Pending=new Map();let d01SaveQueue=Promise.resolve();
function d01Rpc(op,value,lessonId){return new Promise((resolve,reject)=>{const requestId='${slot}-'+(++d01Sequence);const timer=setTimeout(()=>{d01Pending.delete(requestId);reject(new Error('D01 portfolio bridge timeout'))},5000);d01Pending.set(requestId,{resolve,reject,timer});parent.postMessage({channel:'wanli-d01-v1',requestId,lessonId,op,value},'*')})}
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.channel!=='wanli-d01-v1')return;const job=d01Pending.get(event.data.requestId);if(!job)return;d01Pending.delete(event.data.requestId);clearTimeout(job.timer);if(event.data.ok)job.resolve(event.data.document);else job.reject(new Error(event.data.error||'D01 portfolio storage failed'))});
function d01Persist(value,lessonId){const snapshot=JSON.parse(JSON.stringify(value));d01SaveQueue=d01SaveQueue.catch(()=>{}).then(()=>d01Rpc('save',snapshot,lessonId));return d01SaveQueue}`;
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function appScript() {
  return `
${d01BridgeClient('workbench')}
const config=JSON.parse(document.getElementById('lesson-data').textContent);
const copies=JSON.parse(document.getElementById('copy-data').textContent);
let copy=copies['zh-HK'];
let state={choice:'',reason:'',observation:'',current:'',revision:'',evidence:'',sameView:false,aiExecuted:false,firstChecked:false,revisionChecked:false};
let storageOk=false;
const $=id=>document.getElementById(id);
const langIndex=()=>['zh-Hans','zh-CN'].includes(document.documentElement.lang)?1:document.documentElement.lang==='en'?2:0;
function persist(){ $('save-status').textContent=copy.save;d01Persist(state,config.id).then(()=>{storageOk=true;$('save-status').textContent=copy.saved}).catch(()=>{$('save-status').textContent=copy.noStorage}) }
function render(){const i=langIndex();copy=copies[i===0?'zh-HK':i===1?'zh-CN':'en'];const c=copy;document.title=config.title[i]+' · '+c.title;$('lesson-title').textContent=config.title[i];$('page-title').textContent=c.title;$('language').parentElement.firstChild.textContent=c.languageLabel+' ';$('mission').textContent=c.mission;$('privacy').textContent=c.privacy;$('signature-title').textContent=c.signature;$('question').textContent=config.question[i];$('rationale-label').textContent=c.rationale;$('observation-label').textContent=c.observation;$('check-first').textContent=c.test;$('feedback-label').textContent=c.feedback;$('revision-title').textContent=c.revision;$('current-label').textContent=c.current;$('revision-label').textContent=c.request;$('evidence-label').textContent=c.evidence;$('same-view-label').textContent=c.sameView;$('ai-confirm-label').textContent=c.confirm;$('handoff-button').textContent=c.handoff;$('check-revision').textContent=c.checkRevision;$('rationale').value=state.reason;$('observation').value=state.observation;$('current').value=state.current;$('revision').value=state.revision;$('evidence').value=state.evidence;$('same-view').checked=state.sameView;$('ai-executed').checked=state.aiExecuted;const select=$('language');select.value=i===0?'zh-HK':i===1?'zh-CN':'en';$('choice').replaceChildren(new Option(i===0?'請先選擇':i===1?'请先选择':'Choose one',''),...config.choices[i].map((label,n)=>new Option(label,String(n))));$('choice').value=state.choice;$('choice-label').textContent=config.question[i];$('interaction-result').textContent=state.firstChecked?(state.firstPassed?c.firstSuccess:c.retry):'';$('revision-result').textContent=state.revisionChecked?(state.revisionPassed?c.complete:c.retry):'';$('save-status').textContent=storageOk?c.saved:c.noStorage;$('first-version-label').textContent=config.initial[i];$('changed-label').textContent=config.changed[i];$('handoff').hidden=!state.handoffText;$('handoff').textContent=state.handoffText||''}
function checkFirst(){state.choice=$('choice').value;state.reason=$('rationale').value.trim();state.observation=$('observation').value.trim();state.firstChecked=true;state.firstPassed=Boolean(state.choice&&state.reason&&state.observation);const message=!state.choice?copy.missingChoice:!state.reason?copy.missingReason:!state.observation?copy.missingObservation:copy.firstSuccess;$('interaction-result').textContent=message;persist()}
function checkRevision(){state.current=$('current').value.trim();state.revision=$('revision').value.trim();state.evidence=$('evidence').value.trim();state.sameView=$('same-view').checked;state.aiExecuted=$('ai-executed').checked;state.revisionChecked=true;state.revisionPassed=Boolean(state.revision&&state.evidence&&state.sameView&&state.aiExecuted);const message=!state.revision?copy.missingRevision:!state.evidence?copy.missingEvidence:!state.sameView?copy.needSameView:!state.aiExecuted?copy.needAi:copy.complete;$('revision-result').textContent=message;persist()}
document.addEventListener('input',e=>{if(e.target.id==='rationale')state.reason=e.target.value;if(e.target.id==='observation')state.observation=e.target.value;if(e.target.id==='current')state.current=e.target.value;if(e.target.id==='revision')state.revision=e.target.value;if(e.target.id==='evidence')state.evidence=e.target.value;persist()});
document.addEventListener('change',e=>{if(e.target.id==='language'){document.documentElement.lang=copies[e.target.value].lang;render()}if(e.target.id==='choice')state.choice=e.target.value;if(e.target.id==='same-view')state.sameView=e.target.checked;if(e.target.id==='ai-executed')state.aiExecuted=e.target.checked;persist()});
$('check-first').addEventListener('click',checkFirst);$('check-revision').addEventListener('click',checkRevision);
$('handoff-button').addEventListener('click',()=>{const i=langIndex();state.handoffText=copy.prompt+'\\n\\n'+config.initial[i]+': '+state.current+'\\n'+copy.request+': '+state.revision+'\\n'+copy.evidence+': '+state.evidence;$('handoff').hidden=false;$('handoff').textContent=state.handoffText;persist()});
render();d01Rpc('load',undefined,config.id).then(document=>{if(document.workbench&&typeof document.workbench==='object')state={...state,...document.workbench};storageOk=true;render()}).catch(()=>{storageOk=false;render()});`;
}

export function buildD01LessonHtml(lessonId, language = 'zh-HK') {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  if (!lesson) throw new Error(`Unknown D01 lesson: ${lessonId}`);
  if (!Object.hasOwn(COPY, language)) throw new Error(`Unsupported reading language: ${language}`);
  const index = language === 'zh-CN' ? 1 : language === 'en' ? 2 : 0;
  const copy = COPY[language];
  const data = JSON.stringify({ id: lesson.id, title: lesson.title, question: lesson.question, choices: lesson.choices, initial: lesson.initial, changed: lesson.changed }).replaceAll('<', '\\u003c');
  const text = JSON.stringify(COPY).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="${copy.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(lesson.title[index])}</title><style>
    :root{color-scheme:light;--ink:#18283c;--muted:#4d6075;--paper:#f3f7fa;--card:#fff;--accent:#6741db;--line:#c9d5e1;--focus:#006bb6;--ok:#075c41;--warn:#7a4300}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 85% 0,#dde8ff,transparent 42%),var(--paper);font-family:system-ui,"PingFang HK","Microsoft JhengHei",sans-serif;color:var(--ink);line-height:1.55}main{width:min(100% - 32px,1040px);margin:22px auto 50px}.top{display:flex;justify-content:space-between;gap:12px;align-items:center}.mark{font-weight:850;color:var(--accent);letter-spacing:.04em}select,button,textarea,input{font:inherit}select,textarea,input:not([type=checkbox]){width:100%;min-height:48px;border:1px solid var(--line);border-radius:10px;background:white;padding:10px;color:var(--ink)}select{width:auto}h1{font-size:clamp(1.7rem,4vw,2.6rem);line-height:1.18;margin:18px 0 6px}.mission,.privacy{border-radius:12px;padding:12px 14px;background:#e8edff;color:#293d68}.privacy{background:#fff4db;color:#63420d}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 10px 26px #1934510d}.card h2{font-size:1.14rem;margin:0 0 10px}.card label{display:block;font-weight:750;margin:12px 0 6px}textarea{resize:vertical;min-height:76px}.check{display:flex!important;gap:10px;align-items:flex-start}.check input{width:24px;height:24px;flex:none;margin-top:1px}button{min-height:52px;border:0;border-radius:11px;padding:11px 16px;background:var(--accent);color:white;font-weight:800;cursor:pointer;margin-top:12px}button:focus-visible,select:focus-visible,textarea:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.result{min-height:48px;color:var(--warn);font-weight:700;margin:12px 0 0}.result[aria-label=complete]{color:var(--ok)}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#101d32;color:#ecf3ff;padding:14px;border-radius:12px}.small{font-size:.9rem;color:var(--muted)}@media(max-width:700px){main{width:calc(100% - 24px);margin:12px auto 28px}.grid{grid-template-columns:1fr}.card{padding:15px}.top{align-items:flex-start;flex-direction:column}.top select{width:100%}button{width:100%;min-height:56px}select,textarea,input:not([type=checkbox]){min-height:52px}}
    </style></head><body><main data-d01-lesson="${lesson.id}"><div class="top"><span class="mark">WANLI · AI DESIGN STUDIO</span><label for="language" class="small">閱讀語言 <select id="language"><option value="zh-HK" ${language === 'zh-HK' ? 'selected' : ''}>繁體中文</option><option value="zh-CN" ${language === 'zh-CN' ? 'selected' : ''}>简体中文</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option></select></label></div><h1 id="page-title"></h1><h2 id="lesson-title"></h2><p class="mission" id="mission"></p><p class="privacy" id="privacy"></p><section class="grid"><article class="card" data-signature-interaction><h2 id="signature-title"></h2><p class="small" id="question"></p><label id="choice-label" for="choice"></label><select id="choice"></select><label id="rationale-label" for="rationale"></label><textarea id="rationale" maxlength="240"></textarea><label id="observation-label" for="observation"></label><textarea id="observation" maxlength="240"></textarea><button id="check-first"></button><h3 id="feedback-label"></h3><p id="interaction-result" class="result" role="status" aria-live="polite"></p></article><article class="card" data-revision-interaction><h2 id="revision-title"></h2><span id="current-label" hidden></span><label id="first-version-label" for="current"></label><textarea id="current" maxlength="240"></textarea><label id="revision-label" for="revision"></label><textarea id="revision" maxlength="240"></textarea><label id="evidence-label" for="evidence"></label><textarea id="evidence" maxlength="240"></textarea><label class="check"><input id="same-view" type="checkbox"><span id="same-view-label"></span></label><label class="check"><input id="ai-executed" type="checkbox"><span id="ai-confirm-label"></span></label><button id="handoff-button" data-ai-handoff></button><pre id="handoff" hidden></pre><p class="small" id="save-status" role="status" aria-live="polite"></p><button id="check-revision"></button><p id="revision-result" class="result" role="status" aria-live="polite"></p></article></section><p class="small" id="changed-label"></p><script id="lesson-data" type="application/json">${data}</script><script id="copy-data" type="application/json">${text}</script><script>${appScript()}</script></main></body></html>`;
}

const PROJECT_STEP_COPY = {
  'zh-HK': {
    label: '閱讀語言', title: {
      investigation: '調查｜先決定怎樣試', critique: '評議｜用證據給作品回饋',
      revision: '修訂｜把 v01 變成 v02', showcase: '展示｜讓證據跟作品一起交付',
      transfer: '遷移｜換個條件再作選擇',
    },
    prompts: {
      investigation: '你要先核對甚麼？寫下會固定的條件、只改的一項，以及要觀察的證據。',
      critique: '不要只說「好看／不好看」。指出一項作品證據、一項仍未證明的主張，以及下一個可測試問題。',
      revision: '先記錄 v01 實際看到甚麼，再寫只改的一項；執行後記錄 v02 的可見差異。未執行就如實標記未測試。',
      showcase: '交付能重開的作品、同條件比較證據、修訂理由，以及尚未驗證的部分。不要把 AI 的說法當作檢查結果。',
      transfer: '換一個新條件後，你會先重查甚麼？指出會改變哪個選擇，以及需要甚麼新證據。',
    },
    fields: {
      investigation: ['先固定哪些條件？', '這次只改哪一項？', '你預計觀察到甚麼？'],
      critique: ['支持這項回饋的實際證據是甚麼？', '哪項主張仍未證明？', '下一個可測試問題是甚麼？'],
      revision: ['v01 實際觀察／未測試', '只改的一項', 'v02 實際差異／未測試'],
      showcase: ['可重開的作品／版本', '能支持主張的證據', '仍未驗證的部分'],
      transfer: ['變了甚麼新條件？', '你會先重查甚麼？', '需要甚麼新證據？'],
    },
    submit: '保存這一步', saving: '正在保存到這個瀏覽器……', saved: '已保存到這個瀏覽器；可稍後返回續做。', notSaved: '未能保存；請保留頁面內容並抄錄作品記錄。',
    feedback: '已記下你的項目證據。這不是答案評分；請在 PBL 工作台完成對應里程碑。',
    retry: '再補充具體觀察或證據，不能只填「完成」或「很好」。',
    privacy: '不要輸入姓名、學校、帳號、人臉或聲音。此頁只在本機保存，不會連接模型。',
  },
  'zh-CN': {
    label: '阅读语言', title: {
      investigation: '调查｜先决定怎样试', critique: '评议｜用证据给作品反馈',
      revision: '修订｜把 v01 变成 v02', showcase: '展示｜让证据和作品一起交付',
      transfer: '迁移｜换个条件再作选择',
    },
    prompts: {
      investigation: '你要先核对什么？写下会固定的条件、只改的一项，以及要观察的证据。',
      critique: '不要只说“好看／不好看”。指出一项作品证据、一项尚未证明的主张，以及下一个可测试问题。',
      revision: '先记录 v01 实际看到了什么，再写只改的一项；执行后记录 v02 的可见差异。未执行就如实标记未测试。',
      showcase: '交付可重开的作品、同条件比较证据、修订理由，以及尚未验证的部分。不要把 AI 的说法当作检查结果。',
      transfer: '换一个新条件后，你会先复查什么？指出会改变哪个选择，以及需要什么新证据。',
    },
    fields: {
      investigation: ['先固定哪些条件？', '这次只改哪一项？', '你预计观察到什么？'],
      critique: ['支持这项反馈的实际证据是什么？', '哪项主张仍未证明？', '下一个可测试问题是什么？'],
      revision: ['v01 实际观察／未测试', '只改的一项', 'v02 实际差异／未测试'],
      showcase: ['可重开的作品／版本', '能支持主张的证据', '尚未验证的部分'],
      transfer: ['变了什么新条件？', '你会先复查什么？', '需要什么新证据？'],
    },
    submit: '保存这一步', saving: '正在保存到此浏览器……', saved: '已保存到此浏览器；可稍后返回继续。', notSaved: '未能保存；请保留页面内容并抄录作品记录。',
    feedback: '已记录你的项目证据。这不是答案评分；请在 PBL 工作台完成对应里程碑。',
    retry: '请补充具体观察或证据，不能只填“完成”或“很好”。',
    privacy: '不要输入姓名、学校、账号、人脸或声音。此页只在本机保存，不会连接模型。',
  },
  en: {
    label: 'Reading language', title: {
      investigation: 'Investigate | Decide how to test', critique: 'Critique | Give evidence-based feedback',
      revision: 'Revise | Turn v01 into v02', showcase: 'Showcase | Deliver work with evidence',
      transfer: 'Transfer | Choose again under a new condition',
    },
    prompts: {
      investigation: 'What will you check first? Record what stays fixed, the one change, and the evidence to observe.',
      critique: 'Go beyond “looks good / bad.” Name one piece of work evidence, one claim not yet proven, and the next testable question.',
      revision: 'Record what you actually observed in v01, then name one change. After execution, record a visible v02 difference; if not run, mark not tested.',
      showcase: 'Deliver reopenable work, a same-condition comparison, your revision reason, and what remains unverified. Do not treat an AI claim as inspection.',
      transfer: 'When one new condition changes, what will you recheck first? Name the choice that may change and the new evidence needed.',
    },
    fields: {
      investigation: ['What stays fixed?', 'What single thing changes?', 'What do you predict you will observe?'],
      critique: ['What actual evidence supports this feedback?', 'Which claim is still unproven?', 'What is the next testable question?'],
      revision: ['Actual v01 observation / not tested', 'The one change', 'Actual v02 difference / not tested'],
      showcase: ['Reopenable work / version', 'Evidence supporting the claim', 'What remains unverified'],
      transfer: ['What new condition changed?', 'What will you recheck first?', 'What new evidence is needed?'],
    },
    submit: 'Save this step', saving: 'Saving to this browser…', saved: 'Saved in this browser; return later to continue.', notSaved: 'Not saved. Keep this page open and copy your work record.',
    feedback: 'Your project evidence is recorded. This is not an answer score; complete the matching milestone in the PBL workspace.',
    retry: 'Add a specific observation or evidence; “done” or “great” alone is not enough.',
    privacy: 'Do not enter a name, school, account, face, or voice. This page stores locally and does not call a model.',
  },
};

function buildD01ProjectStepHtmlLegacy(lessonId, stepId, language = 'zh-HK') {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  const copy = PROJECT_STEP_COPY[language];
  if (!lesson) throw new Error(`Unknown D01 lesson: ${lessonId}`);
  if (!copy?.title[stepId]) throw new Error(`Unknown D01 project step: ${stepId}`);
  const langIndex = language === 'zh-CN' ? 1 : language === 'en' ? 2 : 0;
  const fields = copy.fields[stepId];
  const data = JSON.stringify({ lessonId, title: lesson.title[langIndex], copies: PROJECT_STEP_COPY }).replaceAll('<', '\\u003c');
  const escapeAttr = escapeHtml;
  return `<!doctype html><html lang="${language === 'zh-HK' ? 'zh-Hant-HK' : language === 'zh-CN' ? 'zh-Hans' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(copy.title[stepId])}</title><style>
  :root{color-scheme:light;--ink:#18283c;--muted:#4d6075;--paper:#f3f7fa;--card:#fff;--accent:#6741db;--line:#c9d5e1;--focus:#006bb6;--ok:#075c41;--warn:#7a4300}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 85% 0,#dde8ff,transparent 42%),var(--paper);font-family:system-ui,"PingFang HK","Microsoft JhengHei",sans-serif;color:var(--ink);line-height:1.55}main{width:min(100% - 28px,920px);margin:18px auto 40px}.top{display:flex;justify-content:flex-end}select,button,textarea{font:inherit}select,textarea{border:1px solid var(--line);border-radius:10px;background:white;padding:11px;color:var(--ink)}select{min-height:48px}h1{font-size:clamp(1.55rem,4vw,2.3rem);line-height:1.2;margin:16px 0 8px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 10px 26px #1934510d}.prompt{padding:12px 14px;border-radius:12px;background:#e8edff;color:#293d68}label{display:block;font-weight:750;margin:14px 0 6px}textarea{width:100%;min-height:76px;resize:vertical}button{width:100%;min-height:56px;border:0;border-radius:11px;padding:12px 16px;background:var(--accent);color:white;font-weight:800;cursor:pointer;margin-top:14px}button:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--focus);outline-offset:3px}.privacy,.result{font-size:.94rem;color:var(--muted)}.privacy{padding:10px 12px;background:#fff4db;border-radius:10px;color:#63420d}.result{min-height:44px;font-weight:700}.result[aria-label=complete]{color:var(--ok)}@media(max-width:640px){main{width:calc(100% - 22px);margin:10px auto 24px}.card{padding:14px}button{min-height:58px}}
  </style></head><body><main data-d01-step="${escapeAttr(stepId)}"><div class="top"><label for="language" class="small">${escapeHtml(copy.label)} <select id="language"><option value="zh-HK" ${language === 'zh-HK' ? 'selected' : ''}>繁體中文</option><option value="zh-CN" ${language === 'zh-CN' ? 'selected' : ''}>简体中文</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option></select></label></div><article class="card"><h1 id="title"></h1><p class="prompt" id="prompt"></p><div id="fields"></div><p class="privacy" id="privacy"></p><button id="save"></button><p id="result" class="result" role="status" aria-live="polite"></p></article><script id="step-data" type="application/json">${data}</script><script>
  const data=JSON.parse(document.getElementById('step-data').textContent), step='${stepId}', storageKey='wanli:d01:'+data.lessonId+':pbl-step:'+step+':v1';let language='${language}',state={values:Array(data.copies[language].fields[step].length).fill(''),checked:false};try{const prior=JSON.parse(localStorage.getItem(storageKey)||'null');if(prior&&Array.isArray(prior.values))state={...state,...prior}}catch{}const $=id=>document.getElementById(id);function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));return true}catch{return false}}function render(){const copy=data.copies[language];document.documentElement.lang=language==='zh-HK'?'zh-Hant-HK':language==='zh-CN'?'zh-Hans':'en';document.title=copy.title[step]+' · '+data.title;document.querySelector('#language').parentElement.firstChild.textContent=copy.label+' ';$('title').textContent=copy.title[step]+' · '+data.title;$('prompt').textContent=copy.prompts[step];$('privacy').textContent=copy.privacy;$('save').textContent=copy.submit;const holder=$('fields');holder.replaceChildren(...copy.fields[step].map((label,index)=>{const wrap=document.createElement('div'),caption=document.createElement('label'),input=document.createElement('textarea');caption.htmlFor='answer-'+index;caption.textContent=label;input.id='answer-'+index;input.maxLength=500;input.value=state.values[index]||'';input.addEventListener('input',()=>{state.values[index]=input.value;save()});wrap.append(caption,input);return wrap}));$('result').textContent=state.checked?(state.passed?copy.feedback:copy.retry):'';$('result').setAttribute('aria-label',state.checked&&state.passed?'complete':'status')}function submit(){state.values=[...document.querySelectorAll('textarea')].map(node=>node.value.trim());state.checked=true;state.passed=state.values.every(value=>value.length>=8);$('result').textContent=state.passed?data.copies[language].feedback:data.copies[language].retry;save();$('result').setAttribute('aria-label',state.passed?'complete':'status')}document.getElementById('language').addEventListener('change',event=>{language=event.target.value;render()});$('save').addEventListener('click',submit);render();
  </script></main></body></html>`;
}

export function buildD01ProjectStepHtml(lessonId, stepId, language = 'zh-HK') {
  const html = buildD01ProjectStepHtmlLegacy(lessonId, stepId, language);
  const script = `<script>${d01BridgeClient(stepId)}
const data=JSON.parse(document.getElementById('step-data').textContent),step='${stepId}';let language='${language}',state={values:Array(data.copies[language].fields[step].length).fill(''),checked:false},edited=false;
const $=id=>document.getElementById(id);
function render(){const copy=data.copies[language];document.documentElement.lang=language==='zh-HK'?'zh-Hant-HK':language==='zh-CN'?'zh-Hans':'en';document.title=copy.title[step]+' · '+data.title;document.querySelector('#language').parentElement.firstChild.textContent=copy.label+' ';$('title').textContent=copy.title[step]+' · '+data.title;$('prompt').textContent=copy.prompts[step];$('privacy').textContent=copy.privacy;$('save').textContent=copy.submit;const holder=$('fields');holder.replaceChildren(...copy.fields[step].map((label,index)=>{const wrap=document.createElement('div'),caption=document.createElement('label'),input=document.createElement('textarea');caption.htmlFor='answer-'+index;caption.textContent=label;input.id='answer-'+index;input.maxLength=500;input.value=state.values[index]||'';input.addEventListener('input',()=>{state.values[index]=input.value;edited=true;persist()} );wrap.append(caption,input);return wrap}));$('result').textContent=state.checked?(state.passed?copy.feedback:copy.retry):'';$('result').setAttribute('aria-label',state.checked&&state.passed?'complete':'status')}
function persist(){$('result').textContent=data.copies[language].saving;d01Persist(state,data.lessonId).then(()=>{$('result').textContent=data.copies[language].saved}).catch(()=>{$('result').textContent=data.copies[language].notSaved})}
function submit(){state.values=[...document.querySelectorAll('textarea')].map(node=>node.value.trim());state.checked=true;state.passed=state.values.every(value=>value.length>=8);$('result').textContent=state.passed?data.copies[language].saving:data.copies[language].retry;persist();$('result').setAttribute('aria-label','status')}
document.getElementById('language').addEventListener('change',event=>{language=event.target.value;render()});$('save').addEventListener('click',submit);render();d01Rpc('load',undefined,data.lessonId).then(document=>{if(!edited&&document[step])state={...state,...document[step]};render()}).catch(()=>{$('result').textContent=data.copies[language].notSaved});
</script>`;
  return html.replace(/<script>\n  const data=[\s\S]*?\n  <\/script>/, script);
}
