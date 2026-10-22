import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { buildD01LessonHtml, buildD01ProjectStepHtml, D01_LESSONS } from '../../scripts/lib/d01-local-components.mjs';
import { D01_PBL_REQUIRED_STAGES, validateD01PedagogicalSequence } from '../../scripts/lib/d01-sequence-contract.mjs';

test('language selector maps HTML locales to supported option values and resolves Simplified Chinese', () => {
  const html = buildD01LessonHtml('D01-01', 'zh-HK');
  const indexDeclaration = html.match(/const langIndex=([^;]+);/)[0];
  const selection = html.match(/select\.value=([^;]+);/)[1];
  for (const [lang, index, option] of [['zh-Hant-HK', 0, 'zh-HK'], ['zh-HK', 0, 'zh-HK'], ['zh-Hans', 1, 'zh-CN'], ['zh-CN', 1, 'zh-CN'], ['en', 2, 'en']]) {
    const document = { documentElement: { lang } };
    assert.equal(runInNewContext(`${indexDeclaration}langIndex()`, { document }), index);
    assert.equal(runInNewContext(selection, { document, i: index }), option);
  }
  assert.match(html, /document\.documentElement\.lang=copies\[e\.target\.value\]\.lang/);
});

test('each D01 lesson renders a distinct, self-contained trilingual workbench', () => {
  assert.equal(D01_LESSONS.length, 6);
  const html = D01_LESSONS.map((lesson) => buildD01LessonHtml(lesson.id, 'zh-HK'));
  assert.equal(new Set(html).size, 6);
  for (const [index, lesson] of D01_LESSONS.entries()) {
    assert.match(html[index], /<html lang="zh-Hant-HK">/);
    assert.match(html[index], /繁體中文/);
    assert.match(buildD01LessonHtml(lesson.id, 'zh-CN'), /简体中文/);
    assert.match(buildD01LessonHtml(lesson.id, 'en'), /English/);
    assert.match(html[index], /data-signature-interaction/);
    assert.match(html[index], /data-revision-interaction/);
    assert.match(html[index], /aria-live="polite"/);
    assert.match(html[index], /wanli-d01-v1/);
    assert.doesNotMatch(html[index], /localStorage/);
    assert.doesNotMatch(html[index], /https?:\/\/|<iframe|<script[^>]+src=/i);
    assert.match(html[index], /學生作選擇、指揮與驗收/);
    assert.match(html[index], /AI 操作者負責在 Blender 執行/);
    assert.match(html[index], /不直接操作 Blender/);
  }
});

test('unknown lesson or language fails closed instead of rendering a fallback course', () => {
  assert.throws(() => buildD01LessonHtml('D01-99', 'zh-HK'), /Unknown D01 lesson/);
  assert.throws(() => buildD01LessonHtml('D01-01', 'yue'), /Unsupported reading language/);
});

test('student requests never collect identity data and only produce a bounded local handoff', () => {
  for (const lesson of D01_LESSONS) {
    const hk = buildD01LessonHtml(lesson.id, 'zh-HK');
    const cn = buildD01LessonHtml(lesson.id, 'zh-CN');
    const en = buildD01LessonHtml(lesson.id, 'en');
    for (const html of [hk, cn, en]) {
      assert.match(html, /maxlength="240"/);
      assert.match(html, /data-ai-handoff/);
    }
    assert.match(hk, /姓名、學校、住址/);
    assert.match(hk, /資料留在本機，不會連接模型/);
    assert.match(cn, /姓名、学校、住址/);
    assert.match(cn, /资料保留在本机，不会连接模型/);
    assert.match(en, /names, school, address/);
    assert.match(en, /stays on this device and does not call a model/);
  }
});

test('every reading language ships its own interaction feedback and privacy copy', () => {
  for (const lesson of D01_LESSONS) {
    const hk = buildD01LessonHtml(lesson.id, 'zh-HK');
    const cn = buildD01LessonHtml(lesson.id, 'zh-CN');
    const en = buildD01LessonHtml(lesson.id, 'en');
    assert.match(hk, /判斷與觀察已保存/);
    assert.match(cn, /判断和观察已保存/);
    assert.match(en, /Decision and observation saved/);
    assert.match(hk, /languageLabel":"閱讀語言/);
    assert.match(cn, /languageLabel":"阅读语言/);
    assert.match(en, /languageLabel":"Reading language/);
  }
});

test('PBL support steps persist through the scoped D01 bridge and clearly attribute imported drafts', () => {
  for (const lesson of D01_LESSONS) {
    for (const step of ['investigation', 'critique', 'revision', 'showcase', 'transfer']) {
      for (const language of ['zh-HK', 'zh-CN', 'en']) {
        const html = buildD01ProjectStepHtml(lesson.id, step, language);
        assert.match(html, /wanli-d01-v1/);
        assert.match(html, /d01Persist\(state,data\.lessonId\)/);
        assert.doesNotMatch(html, /localStorage/);
        assert.match(html, /zh-HK/);
        assert.match(html, /zh-CN/);
        assert.match(html, /English/);
        assert.match(html, /已保存到這個瀏覽器|已保存到这个浏览器|Saved in this browser/);
        assert.match(html, /PBL 工作台|PBL workspace/);
        assert.doesNotMatch(html, /fetch\s*\(|https?:\/\//);
      }
    }
  }
  assert.throws(() => buildD01ProjectStepHtml('D01-99', 'critique'), /Unknown D01 lesson/);
  assert.throws(() => buildD01ProjectStepHtml('D01-01', 'quiz'), /Unknown D01 project step/);
});

test('D01 PBL contract requires a project spine at entry, low slide share, and all evidence milestones', () => {
  const pbl = { type: 'pbl', order: 1, content: { projectV2: { milestones: D01_PBL_REQUIRED_STAGES.map((curriculumStage, index) => ({
    curriculumStage, title: `Stage ${index + 1}`, briefing: 'Learner task', completionCriteria: 'Observable project evidence',
    microtasks: [{ description: 'Learner action', completionCriteria: 'Saved artifact or evidence' }],
  })) } } };
  const scenes = [
    pbl,
    { type: 'slide', order: 2 },
    { type: 'slide', order: 3 },
    ...Array.from({ length: 6 }, (_, index) => ({ type: 'interactive', order: index + 4 })),
  ];
  assert.deepEqual(validateD01PedagogicalSequence(scenes).failures, []);

  const appendedPbl = [...scenes.slice(1, 3), { type: 'slide', order: 3 }, ...scenes.slice(3, 8), { ...pbl, order: 9 }];
  const failures = validateD01PedagogicalSequence(appendedPbl).failures;
  assert.ok(failures.some((failure) => /must open the course/.test(failure)));
  assert.ok(failures.some((failure) => /slide fraction exceeds 25%/.test(failure)));
  assert.ok(failures.some((failure) => /PBL workspace appears after/.test(failure)));
});

test('D01 PBL contract rejects isolated quiz scenes and incomplete project evidence', () => {
  const pbl = { type: 'pbl', order: 1, content: { projectV2: { milestones: D01_PBL_REQUIRED_STAGES.slice(0, 3).map((curriculumStage) => ({ curriculumStage, title: 'Stage' })) } } };
  const scenes = [pbl, { type: 'slide' }, { type: 'slide' }, { type: 'quiz' }, ...Array.from({ length: 5 }, () => ({ type: 'interactive' }))];
  const failures = validateD01PedagogicalSequence(scenes).failures;
  assert.ok(failures.some((failure) => /standalone quiz scenes/.test(failure)));
  assert.ok(failures.some((failure) => /lacks an executable learner action/.test(failure)));
});
