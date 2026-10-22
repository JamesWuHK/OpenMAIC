import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Local document and example checks only. Never generates, renders or publishes.
const dir = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(await readFile(join(dir, 'design-contract.json'), 'utf8'));
assert.equal(contract.kind, 'documentation-design-contract');
assert.match(contract.version, /^\d+\.\d+\.\d+$/, 'contract version must follow semantic versioning');
assert.match(contract.status, /^(generation-approved-once-per-lesson; hosted-submissions-not-yet-sent|hosted-generation-in-progress; one-course-per-job|generation-complete; runtime-and-publication-gates-pending|generation-candidates-created; post-generation-qa-pending|pbl-spine-redesign-local-candidates-built; OpenMAIC-import-and-player-qa-pending|six-real-local-OpenMAIC-previews-ready; DeepSeek-official-key-not-located; full-quality-acceptance-pending|six-real-local-OpenMAIC-previews-ready; PBL-evidence-bridge-unverified; D01-06-assets-unverified; DeepSeek-official-key-not-located; full-quality-acceptance-pending)$/);
assert.equal(contract.approval, 'historical-design-SHIP-reopened-after-pbl-spine-quality-escape');
assert.equal(contract.currentQualityDecision.result, 'BLOCK-import-and-publication-independent-teaching-audit');
assert.equal(contract.latestIndependentTeachingReview.result, 'BLOCK-import-and-publication');
assert.deepEqual(contract.latestIndependentTeachingReview.lessonDecisions, {
  'D01-01': 'FIX', 'D01-02': 'FIX', 'D01-03': 'FIX', 'D01-04': 'FIX', 'D01-05': 'FIX', 'D01-06': 'BLOCK',
});
assert.equal(contract.independentReview.result, 'SHIP-design-only-generation-prep');
assert.match(contract.independentReview.recheckResult, /design SHIP; G2 generation SHIP for six one-use teacher-review candidates/);
assert.equal(contract.latestIndependentTimingReview.result, 'BLOCK-generation-and-publication');
assert.match(contract.latestIndependentTimingReview.documentationRecheck, /^PASS-limited-document-consistency-only/);
assert.equal(contract.lessons.length, 6);
assert.equal(contract.timingStatus, 'unvalidated-planning-target; school-tool-pilot-required');
assert.equal(new Set(contract.lessons.map(l => l.product)).size, 6);
assert.equal(new Set(contract.lessons.map(l => l.signature)).size, 6);
assert.equal(contract.classroomTotalTargetMinutes, 30);
assert.equal(contract.openMaicPlayerRuntimeMinutes, null);
assert(contract.durationLabelPolicy.includes('Do not claim 30 minutes as OpenMAIC player runtime'));
assert.equal(contract.schoolPeriodsPerLesson, 1);
assert.deepEqual(contract.stageMinutes, [2,1,2,3,8,3,6,3,2]);
assert.equal(contract.stageMinutes.reduce((a,b) => a+b, 0), 30);
assert.equal(contract.stageMinutes.slice(0,5).reduce((a,b) => a+b, 0), 16);
assert.equal(contract.maxDirectInstructionMinutes, 8);
assert.equal(contract.maxJustInTimeHintSeconds, 90);
assert.equal(contract.evidenceStates.blenderAssets, 'partial-D01-01-local-verified; no-two-artwork-D01-06-course-bundle-or-reopen-proof');
assert.equal(contract.evidenceStates.websitePublication, 'not-published');

function validateLesson(text, lesson) {
  const label = lesson.file;
  assert(text.startsWith('# ' + lesson.id + '｜' + lesson.title), label + ': title');
  assert(text.includes('v0.4.2') && text.includes('未實操驗證'), label + ': draft status');
  assert(!/\{\{(?:TODO|TBD|填寫|待填)[^}]*\}\}/i.test(text), label + ': unfilled template');
  assert.equal((text.match(/^\x60{3}/gm) ?? []).length % 2, 0, label + ': code fence');
  for (let n=1;n<=13;n++) assert(new RegExp('^## '+n+'\\.', 'm').test(text), label + ': section '+n);
  assert(/^## 17\. OpenMAIC 原生組件藍圖/m.test(text), label + ': hosted-generation scope');
  for (const boundary of ['結構原型 `pbl-studio`','不得生成 interactive HTML','web search、image/video generation、hosted TTS 關閉','不接入學生網站','不含學生']) {
    assert(text.includes(boundary), label + ': generation boundary ' + boundary);
  }
  assert(/### I1/.test(text) && /### I2/.test(text), label + ': deterministic local interactions');
  for (const token of ['必交','Astra','GPT-6 Astra','Blender 4.5 LTS','學校','訂閱',
    'structureContract','pbl-studio','interactionContract','約 30 分鐘','AI-Blender',
    '不是 OpenMAIC 播放時長','核心版','延伸','未取得證據前不得對外承諾 30 分鐘',
    '待驗證的學習路徑 timebox',
    'portfolioInput','portfolioOutput','nextUse','conceptRevisit','粵語','普通話','OpenMAIC']) {
    assert(text.includes(token), label + ': missing '+token);
  }
  for (const token of lesson.outputs) assert(text.includes(token), label + ': output '+token);
  if (lesson.languageScripts === 'complete-candidate') {
    if (lesson.id === 'D01-01') {
      assert(text.includes('## 15. D01-01 九場景閱讀稿與三條獨立口語稿'), label + ': language script section');
      const section = text.split('## 15. D01-01 九場景閱讀稿與三條獨立口語稿')[1] ?? '';
      for (let n = 1; n <= 9; n++) {
        const scene = section.split(`### S${n}｜`)[1]?.split(/\n### /)[0] ?? '';
        assert(scene.length > 100, label + ': language scene S' + n);
        for (const track of ['繁中屏幕：', '简中屏幕：', 'English screen:', '粵語口語：', '普通話口語：', 'English narration:']) assert(scene.includes(track), label + ': S' + n + ' missing ' + track);
      }
      for (const token of ['評量四項：可重開 .blend','每項 0＝未見','AI 一次加太多東西','出圖很慢']) assert(text.includes(token), label + ': missing reviewed student material ' + token);
    } else if (lesson.id === 'D01-02') {
      assert(text.includes('## 15. D01-02 九場景六軌閱讀稿與三語核心操作稿'), label + ': language script section');
      const sceneTable = text.split('### 九場景：屏幕引導與獨立旁白')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 委託','S2 找問題','S3 選擺法','S4 入口試驗','S5 建立 v01','S6 同伴試拿','S7 修訂 v02','S8 展示','S9 遷移','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['完整 AI 建模請求','四張求助卡','回饋：物件放得入','再試：請 AI 只把該裝飾','評量分檔','姓名、人臉、聲音、帳號']) assert(text.includes(token), label + ': missing reviewed student material ' + token);
    } else if (lesson.id === 'D01-03') {
      assert(text.includes('## 15. D01-03 九場景六軌閱讀稿與三語操作稿'), label + ': language script section');
      const sceneTable = text.split('## 15. D01-03 九場景六軌閱讀稿與三語操作稿')[1]?.split('### 九場景六軌引導')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 委託','S2 先說第一個想法','S3 分區','S4 先猜','S5 建基地','S6 訪客試走','S7 修訂','S8 展示','S9 遷移','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['學生操作文字','路線檢查','修訂指令','評量：場景可重開','安全告知','介面欄位']) assert(text.includes(token), label + ': missing student material ' + token);
      for (const token of ['教師匿名採集的起點問題','求助：看不見內部時保持開頂剖視','獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS']) assert(text.includes(token), label + ': missing reviewed Q16 closure ' + token);
    } else if (lesson.id === 'D01-04') {
      assert(text.includes('## 15. D01-04 九場景六軌閱讀稿與三語操作稿'), label + ': language script section');
      const sceneTable = text.split('## 15. D01-04 九場景六軌閱讀稿與三語操作稿')[1]?.split('### 九場景六軌引導')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 任務','S2 先說第一個想法','S3 故事','S4 節奏試驗','S5 建動畫','S6 靜音試映','S7 修訂','S8 首映','S9 遷移','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['核心互動','完整修訂指令','評量四項','安全告知','介面欄位']) assert(text.includes(token), label + ': missing student material ' + token);
      assert(text.includes('獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS'), label + ': missing independent review state');
    } else if (lesson.id === 'D01-05') {
      assert.equal((text.match(/^## 15\. D01-05 多語學生端內容稿（Q16 文案設計 PASS）$/gm) ?? []).length, 1, label + ': exactly one canonical language package');
      const sceneTable = text.split('## 15. D01-05 多語學生端內容稿（Q16 文案設計 PASS）')[1]?.split('### 九場景六軌引導')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 謎題','S2 看裝置','S3 選謎底','S4 先猜','S5 建立','S6 盲猜','S7 修改','S8 揭曉','S9 遷移','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['半徑互動回饋與重試','剛才改了幾樣','返回 v01','評量四項','安全告知','獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS']) assert(text.includes(token), label + ': missing reviewed language material');
    } else if (lesson.id === 'D01-06') {
      const sceneTable = text.split('## 15. D01-06 多語學生端內容稿（Q16 文案設計 PASS）')[1]?.split('### 九場景六軌引導')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 策展委託','S2 先說第一個想法','S3 選品取捨','S4 第一眼','S5 建展場','S6 觀眾預覽','S7 開展前修改','S8 小展導覽','S9 交棒','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['核心學生操作文案','匿名觀眾 brief','完整修訂指令','評量四項','安全與誠實告知','介面欄位','獨立審核者於 2026-09-28 判定 Q16 文案設計 PASS']) assert(text.includes(token), label + ': missing reviewed language material');
    }
  } else if (lesson.languageScripts === 'needs-student-material-coverage') {
    assert.ok(lesson.id === 'D01-01' && text.includes('Q16 維持 partial'), label + ': incomplete language candidate must preserve the quality block');
  } else if (lesson.languageScripts === 'needs-independent-review') {
    if (lesson.id === 'D01-04') {
      assert.ok(/^## 15\. D01-04 多語學生端內容稿（候選，待獨立複核）/m.test(text), label + ': language package awaiting independent review');
      assert.ok(text.includes('本包涵蓋課程核心學生文案候選'), label + ': language review state');
    } else if (lesson.id === 'D01-05') {
      assert.ok(/^## 15\. D01-05 多語學生端內容稿（候選，待獨立複核）/m.test(text), label + ': language package awaiting independent review');
      assert.equal((text.match(/^## 15\. D01-05 多語學生端內容稿（候選，待獨立複核）$/gm) ?? []).length, 1, label + ': exactly one canonical language package');
      const sceneTable = text.split('## 15. D01-05 多語學生端內容稿（候選，待獨立複核）')[1]?.split('### 九場景六軌引導')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 謎題','S2 看裝置','S3 選謎底','S4 先猜','S5 建立','S6 盲猜','S7 修改','S8 揭曉','S9 遷移','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['操作、互動回饋','半徑互動回饋與重試','剛才改了幾樣','返回 v01','完整修訂指令','評量四項','安全告知','介面欄位','尚待獨立複核']) assert(text.includes(token), label + ': missing student material ' + token);
    } else if (lesson.id === 'D01-06') {
      assert.ok(/^## 15\. D01-06 多語學生端內容稿（候選，待獨立複核）/m.test(text), label + ': language package awaiting independent review');
      const sceneTable = text.split('## 15. D01-06 多語學生端內容稿（候選，待獨立複核）')[1]?.split('### 九場景六軌引導')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 策展委託','S2 資產檢查','S3 選品取捨','S4 第一眼','S5 建展場','S6 觀眾預覽','S7 開展前修改','S8 小展導覽','S9 交棒','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      for (const token of ['核心學生操作文案','匿名觀眾 brief','完整修訂指令','評量四項','安全與誠實告知','介面欄位','尚待獨立複核']) assert(text.includes(token), label + ': missing student material ' + token);
    } else {
      assert.ok(/^## 15\. D01-02 九場景六軌閱讀稿與三語核心操作稿/m.test(text), label + ': language package awaiting independent review');
      const sceneTable = text.split('### 九場景：屏幕引導與獨立旁白')[1]?.split('\n### ')[0] ?? '';
      for (const token of ['S1 委託','S2 找問題','S3 選擺法','S4 入口試驗','S5 建立 v01','S6 同伴試拿','S7 修訂 v02','S8 展示','S9 遷移','繁中屏幕','简中屏幕','English screen','粵語口語','普通話口語','English narration']) assert(sceneTable.includes(token), label + ': language package missing ' + token);
      assert.ok(text.includes('尚未獨立審核'), label + ': language review state');
    }
  } else {
    assert.equal(lesson.languageScripts, 'not-authored', label + ': explicit language-script status');
    assert(!text.includes('## 15.'), label + ': undeclared language scripts');
  }
  assert(lesson.choiceDimensions.length >= 2, label + ': choice dimensions');
  assert.equal(lesson.plannedExternalToolWorkflowMinutes, 17);
  assert.match(lesson.toolWorkflowTimingStatus, /unbenchmarked/);
  const code = 'L'+lesson.id.slice(-2);
  const rows = [...text.matchAll(new RegExp('^\\| '+code+'-S(\\d+) \\|[^\\n]*?\\| (\\d+) \\|','gm'))];
  assert.deepEqual(rows.map(r => Number(r[1])), [1,2,3,4,5,6,7,8,9], label + ': stages');
  assert.deepEqual(rows.map(r => Number(r[2])), contract.stageMinutes, label + ': time allocation');
  assert.equal(Number(rows[3][2])+Number(rows[4][2])+Number(rows[6][2]), lesson.plannedExternalToolWorkflowMinutes);
  for (const id of ['I1','I2']) {
    const section = text.split('### '+id+'｜')[1]?.split(/\n(?:### |## )/)[0] ?? '';
    assert(section.length > 150, label + ': substantive '+id);
    assert(/state|狀態/.test(section), label + ': state '+id);
    assert(section.includes('反饋'), label + ': feedback '+id);
    assert(section.includes('第二提示') && section.includes('重試'), label + ': retry '+id);
    assert(section.includes('證據'), label + ': evidence '+id);
  }
  const urls = [...new Set(text.match(/https:\/\/[^\s)]+/g) ?? [])];
  assert(urls.length >= 3, label + ': fact sources');
  for (const url of urls) assert(['docs.blender.org','developers.openai.com','www.pblworks.org'].includes(new URL(url).hostname), label + ': primary source');
  assert(/核對[\s\S]*2026-09-2[23]/.test(text), label + ': source snapshot');
  assert(!/\b(?:sk-|ark-)[A-Za-z0-9_-]{12,}/.test(text), label + ': possible credential');
  return { id: lesson.id, file: label, classroomTotalTargetMinutes: 30, openMaicPlayerRuntimeMinutes: 'unmeasured', plannedExternalToolWorkflowMinutes: 17, scenes: rows.length, primarySources: urls.length };
}

const contents = await Promise.all(contract.lessons.map(l => readFile(join(dir,l.file),'utf8')));
const reports = contents.map((text,i) => validateLesson(text,contract.lessons[i]));
const assetEvidence = [];
for (const lesson of contract.lessons) {
  const paths = lesson.localAssetEvidence;
  if (!paths) continue;
  assert.equal(paths.status, 'local-reopen-and-script-edit-pass');
  assert.equal(paths.studentTrial, 'not-tested');
  const buildPath = join(dir, paths.build);
  const build = JSON.parse(await readFile(buildPath, 'utf8'));
  const reopen = JSON.parse(await readFile(join(dir, paths.reopen), 'utf8'));
  assert.equal(reopen.result, 'BLENDER_REOPEN_AND_EDIT_PASS');
  for (const artifact of build.artifacts) {
    const bytes = await readFile(join(dirname(buildPath), artifact.file));
    assert.equal(bytes.length, artifact.bytes, artifact.file + ': bytes');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), artifact.sha256, artifact.file + ': hash');
  }
  assert.equal(Object.keys(reopen.files).length, 3);
  assert(reopen.editRoundtrip.savedAndReopened && reopen.editRoundtrip.childFollowed);
  assetEvidence.push({ lesson: lesson.id, filesHashVerified: build.artifacts.length, result: reopen.result });
}
const index = await readFile(join(dir,'00-series-index.md'),'utf8');
for(const l of contract.lessons) assert(index.includes(']('+l.file+')'), 'index link '+l.file);
for(const link of index.matchAll(/\]\(([^)]+\.md)\)/g)) {
  if(!link[1].startsWith('http')) await access(join(dir,link[1]));
}
// Authored M examples: arithmetic only, not Blender or collision checks.
const vectors = cell => (cell.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const example = [
  ['Base',[120,80,3],[0,0,1.5]],
  ['Front',[120,3,32],[0,-38.5,19]],
  ['Back',[120,3,32],[0,38.5,19]],
  ['Left',[3,74,32],[-58.5,0,19]],
  ['Right',[3,74,32],[58.5,0,19]],
];
for(const [name,size,pos] of example) {
  const line = contents[1].split('\n').find(l => l.startsWith('| '+name+' |'));
  assert(line,'geometry row '+name);
  const cells=line.split('|').slice(1,-1).map(s=>s.trim());
  assert.deepEqual(vectors(cells[1]),size);
  assert.deepEqual(vectors(cells[2]),pos);
}
assert.deepEqual([120-2*3,80-2*3,35-3],[114,74,32]);
assert.equal(3+32/2,19);
assert.equal(60-3/2,58.5);
assert.equal((120-1+1)/24,5);
assert(contents[3].includes('119/24'));
assert(contents[3].includes('Base＝1'));
const keyframes = [
  [1,[-2,0,0.4]], [49,[-0.8,0,0.4]], [73,[-0.4,0,1.6]],
  [97,[0,0,1]], [120,[0,0,1]],
];
for(const [frame,pos] of keyframes) {
  const row=contents[3].split('\n').find(l=>l.startsWith('| '+frame+' |'));
  assert(row,'animation row '+frame);
  assert.deepEqual(vectors(row.split('|')[2]),pos);
}
const tests=[];
if(process.argv.includes('--self-test')) {
  for(const [name,alter] of [
    ['missing-scene', t=>t.replace(/^.*L01-S7.*\n/m,'')],
    ['wrong-minutes', t=>t.replace('| 8 |','| 9 |')],
    ['missing-interaction', t=>t.replace('### I2｜','### REMOVED｜')],
    ['unfilled-template', t=>t+'\n{{TODO: unfilled template}}'],
  ['missing-draft-status', t=>t.replaceAll('未實操驗證','')],
  ['missing-language-track', t=>t.replace('English narration:', 'removed narration:')],
  ]) {
    assert.throws(()=>validateLesson(alter(contents[0]),contract.lessons[0]),name+' must fail');
    tests.push(name+': rejected');
  }
}
console.log(JSON.stringify({
  result:'DOCUMENT_CHECKS_PASS',
  version:contract.version,
  lessons:reports,
  classroomTotalTargetMinutes:180,
  openMaicPlayerRuntimeMinutes:'unmeasured',
  plannedExternalToolWorkflowMinutes:102,
  assetEvidence,
  negativeTests:tests,
  exampleChecks:'authored arithmetic only; not runtime verified',
  languageScripts:contract.lessons.map(l=>({id:l.id,status:l.languageScripts})),
  notVerified:['D01-02 to D01-06 Blender execution','free-form Astra workflow','human UI trial','teaching outcomes','classroom timing','audio','OpenMAIC player runtime','website publication'],
},null,2));
