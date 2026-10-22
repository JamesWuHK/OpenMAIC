export const D01_PORTFOLIO_VERSION = 1;
export const D01_PORTFOLIO_CHANNEL = 'wanli-d01-v1';
export const D01_PORTFOLIO_KEY_PREFIX = 'wanli:d01:';

const LESSONS = Object.freeze({
  'hk-d01-01-desk-creature': 'D01-01',
  'hk-d01-02-monster-organizer': 'D01-02',
  'hk-d01-03-pocket-hideout': 'D01-03',
  'hk-d01-04-five-second-story': 'D01-04',
  'hk-d01-05-shadow-riddle': 'D01-05',
  'hk-d01-06-mini-exhibition': 'D01-06',
});

const SLOT_BY_SCENE = Object.freeze({
  'd01-scene-04': 'workbench',
  'd01-scene-05': 'investigation',
  'd01-scene-06': 'critique',
  'd01-scene-07': 'revision',
  'd01-scene-08-showcase': 'showcase',
  'd01-scene-09': 'transfer',
});

function lessonIdFromPath(pathname) {
  const match = pathname.match(/^\/classroom\/(hk-d01-0[1-6]-[a-z-]+?)(?:-r\d+)?$/);
  if (match) return LESSONS[match[1]];
  // These are the six immutable review classrooms installed by the preview
  // importer. Do not grant arbitrary draft routes access to lesson evidence.
  const preview = pathname.match(/^\/classroom\/d01-(0[1-6])-pbl-review-20261021-r03$/);
  return preview ? `D01-${preview[1]}` : null;
}

export function d01PortfolioContext(pathname, sceneId) {
  const lessonId = lessonIdFromPath(pathname);
  const slot = SLOT_BY_SCENE[sceneId];
  if (!lessonId || !slot) return null;
  const step = ({ investigation: 'investigation', critique: 'critique', revision: 'revision', showcase: 'showcase', transfer: 'transfer' })[slot];
  return {
    lessonId,
    slot,
    storageKey: slot === 'workbench'
      ? `${D01_PORTFOLIO_KEY_PREFIX}${lessonId}:workbench:v1`
      : `${D01_PORTFOLIO_KEY_PREFIX}${lessonId}:pbl-step:${step}:v1`,
  };
}

export function d01PortfolioKey(lessonId) {
  if (!Object.values(LESSONS).includes(lessonId)) throw new Error('Unknown D01 lesson');
  return `${D01_PORTFOLIO_KEY_PREFIX}${lessonId}:portfolio:v1`;
}

function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value, allowed) {
  return isRecord(value) && Object.keys(value).every((key) => allowed.includes(key));
}

function validText(value, max = 2000) {
  return typeof value === 'string' && value.length <= max;
}

function validWorkbench(value) {
  if (!hasOnlyKeys(value, [
    'choice', 'reason', 'observation', 'current', 'revision', 'evidence', 'handoffText',
    'sameView', 'aiExecuted', 'firstChecked', 'firstPassed', 'revisionChecked', 'revisionPassed',
  ])) return false;
  for (const key of ['choice', 'reason', 'observation', 'current', 'revision', 'evidence', 'handoffText']) {
    if (value[key] !== undefined && !validText(value[key])) return false;
  }
  for (const key of ['sameView', 'aiExecuted', 'firstChecked', 'firstPassed', 'revisionChecked', 'revisionPassed']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') return false;
  }
  return true;
}

function validStep(value) {
  return hasOnlyKeys(value, ['values', 'checked', 'passed']) &&
    Array.isArray(value.values) && value.values.length <= 4 &&
    value.values.every((item) => validText(item, 500)) &&
    (value.checked === undefined || typeof value.checked === 'boolean') &&
    (value.passed === undefined || typeof value.passed === 'boolean');
}

export function validD01Portfolio(document, expectedLessonId) {
  if (!hasOnlyKeys(document, ['version', 'lessonId', 'workbench', ...Object.values(SLOT_BY_SCENE)]) ||
      document.version !== D01_PORTFOLIO_VERSION || document.lessonId !== expectedLessonId ||
      !Object.values(LESSONS).includes(expectedLessonId)) return false;
  if (document.workbench !== undefined && !validWorkbench(document.workbench)) return false;
  for (const slot of ['investigation', 'critique', 'revision', 'showcase', 'transfer']) {
    if (document[slot] !== undefined && !validStep(document[slot])) return false;
  }
  return true;
}

const MILESTONE_SLOT = Object.freeze({
  investigation: 'investigation',
  prototype: 'workbench',
  critique: 'critique',
  revision: 'revision',
  showcase: 'showcase',
  'reflection-transfer': 'transfer',
});

const WORKBENCH_FIELDS = Object.freeze([
  'choice', 'reason', 'observation', 'current', 'revision', 'evidence',
  'sameView', 'aiExecuted', 'firstChecked', 'firstPassed', 'revisionChecked',
  'revisionPassed', 'handoffText',
]);

/** Build an editable, clearly attributed text draft for the active PBL task. */
export function readD01SubmissionDraft(pathname, milestoneId, language, storage) {
  const lessonId = lessonIdFromPath(pathname);
  if (!lessonId || typeof milestoneId !== 'string' ||
      !milestoneId.startsWith(`d01-${lessonId.toLowerCase()}-ms-`)) return null;
  const milestoneMatch = typeof milestoneId === 'string' && milestoneId.match(/-ms-([a-z-]+)$/);
  const slot = milestoneMatch && MILESTONE_SLOT[milestoneMatch[1]];
  if (!lessonId || !slot) return null;
  try {
    const raw = storage.getItem(d01PortfolioKey(lessonId));
    if (!raw) return null;
    const document = JSON.parse(raw);
    if (!validD01Portfolio(document, lessonId)) return null;
    const evidence = document[slot];
    if (!evidence) return null;
    const hasEvidence = Array.isArray(evidence.values)
      ? evidence.values.some((value) => value.trim())
      : Object.values(evidence).some((value) => typeof value === 'string' ? value.trim() : value === true);
    if (!hasEvidence) return null;
    const labels = {
      'zh-HK': {
        investigation: ['固定條件', '只改一項', '預測觀察'],
        critique: ['支持回饋的證據', '尚未證明的主張', '下一個可測問題'],
        revision: ['v01 實際觀察／未測', '只改的一項', 'v02 實際差異／未測'],
        showcase: ['可重開作品／版本', '支持主張的證據', '尚未驗證部分'],
        transfer: ['改變的新條件', '先復查甚麼', '需要的新證據'],
        workbench: ['設計選擇', '選擇理由', '實際觀察', '目前版本', '修訂要求', '比較證據', '同一條件', 'AI 已執行', '首輪已檢查', '首輪結果', '修訂已檢查', '修訂結果', '交接指令'],
      },
      'zh-CN': {
        investigation: ['固定条件', '只改一项', '预测观察'],
        critique: ['支持反馈的证据', '尚未证明的主张', '下一个可测问题'],
        revision: ['v01 实际观察／未测', '只改的一项', 'v02 实际差异／未测'],
        showcase: ['可重开作品／版本', '支持主张的证据', '尚未验证部分'],
        transfer: ['改变的新条件', '先复查什么', '需要的新证据'],
        workbench: ['设计选择', '选择理由', '实际观察', '当前版本', '修订要求', '比较证据', '相同条件', 'AI 已执行', '首轮已检查', '首轮结果', '修订已检查', '修订结果', '交接指令'],
      },
      en: {
        investigation: ['Fixed conditions', 'One variable changed', 'Predicted observation'],
        critique: ['Evidence supporting feedback', 'Claim not yet proven', 'Next testable question'],
        revision: ['Actual v01 observation / untested', 'Single change', 'Actual v02 difference / untested'],
        showcase: ['Reopenable work / version', 'Evidence supporting the claim', 'Unverified part'],
        transfer: ['New condition', 'First check', 'Evidence needed'],
        workbench: ['Design choice', 'Reason', 'Actual observation', 'Current version', 'Revision request', 'Comparison evidence', 'Same condition', 'AI executed', 'First check complete', 'First check result', 'Revision check complete', 'Revision check result', 'Handoff instruction'],
      },
    }[language] ?? null;
    if (!labels) return null;
    const title = language === 'en'
      ? `Draft from the ${slot} activity`
      : language === 'zh-CN'
        ? `来自「${slot}」互动的草稿`
        : `來自「${slot}」互動的草稿`;
    const warning = language === 'en'
      ? 'This is only learner-entered activity text. Confirm it, add actual Blender evidence separately, and mark anything not run as untested.'
      : language === 'zh-CN'
        ? '这只是学生在互动页输入的记录。请核对后再提交；Blender 实际产出需另附，未执行的内容要标明未测试。'
        : '這只是學生在互動頁輸入的記錄。請核對後再提交；Blender 實際產出需另附，未執行的內容要標明未測試。';
    const lines = Array.isArray(evidence.values)
      ? evidence.values.map((value, index) => `- ${labels[slot][index] ?? `Entry ${index + 1}`}: ${value || '（空白）'}`)
      : WORKBENCH_FIELDS.flatMap((key, index) => Object.hasOwn(evidence, key)
        ? [`- ${labels.workbench[index]}: ${String(evidence[key])}`]
        : []);
    return `${title}\n${lines.join('\n')}\n\n${warning}`;
  } catch {
    return null;
  }
}

/**
 * Persist only a named D01 interaction slot. The sandboxed iframe is identified
 * by its live window, opaque origin, exact course route and scene ID; arbitrary
 * localStorage key access is never exposed.
 */
export function d01PortfolioReply(event, frameWindow, sceneId, pathname, storage) {
  const context = d01PortfolioContext(pathname, sceneId);
  if (!context || !frameWindow || event.source !== frameWindow || event.origin !== 'null') return null;
  const { lessonId, slot } = context;
  const data = event.data;
  if (!data || data.channel !== D01_PORTFOLIO_CHANNEL || data.lessonId !== lessonId || typeof data.requestId !== 'string' ||
      data.requestId.length < 1 || data.requestId.length > 80 || !['load', 'save'].includes(data.op)) return null;

  const reply = { channel: D01_PORTFOLIO_CHANNEL, requestId: data.requestId };
  const key = d01PortfolioKey(lessonId);
  try {
    const raw = storage.getItem(key);
    const document = raw ? JSON.parse(raw) : { version: D01_PORTFOLIO_VERSION, lessonId };
    if (!validD01Portfolio(document, lessonId)) return { ...reply, ok: false, error: 'invalid-stored-document' };
    if (data.op === 'save') {
      const next = { ...document, [slot]: data.value };
      const json = JSON.stringify(next);
      if (json.length > 60000 || /"(?:__proto__|constructor|prototype)"\s*:/.test(json) ||
          !validD01Portfolio(next, lessonId)) return { ...reply, ok: false, error: 'invalid-data' };
      storage.setItem(key, json);
      return { ...reply, ok: true, document: next };
    }
    return { ...reply, ok: true, document };
  } catch {
    return { ...reply, ok: false, error: 'storage-unavailable' };
  }
}
