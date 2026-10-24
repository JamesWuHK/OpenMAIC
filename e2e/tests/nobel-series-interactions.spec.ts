import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test';

/**
 * Run against the already-built learner container with mounted candidate JSON/media.
 * CI must include this file in testMatch and run Chromium desktop 1440x900 and
 * mobile 390x844 projects. This spec never starts a server or supplies media.
 *
 * AI calls alone are intercepted: a protocol-only cue_user response proves the
 * request path/UI wiring. It proves neither a real provider response nor the
 * accuracy, safety, voice quality or content of a generated discussion. Those
 * remain release acceptance work with the configured provider. Narration below
 * is the real mounted MP3, decoded and progressing in Chromium; no audio mock.
 */
type Action = { type: string; audioId?: string; topic?: string };
type Scene = { id: string; title: string; actions: Action[]; content: { html: string } };
type Course = { id: string; stage: { name: string }; scenes: Scene[] };
type Question = { options: string[]; answer: number; explanations: string[] };
declare global { interface Window { __nobelQAMedia: HTMLMediaElement[] } }
const candidateRoot = path.resolve(process.env.NOBEL_QA_CLASSROOMS_DIR || 'output/nobel-series-interaction-fixed-20261025/data/classrooms');
const courses = readdirSync(candidateRoot).filter((name) => /^hk-nobel-0[1-6]-.+\.json$/.test(name))
  .sort().map((name) => {
    const raw = readFileSync(path.join(candidateRoot, name));
    return { course: JSON.parse(raw.toString()) as Course, sha256: createHash('sha256').update(raw).digest('hex') };
  });
if (courses.length !== 6) throw new Error(`Expected six Nobel candidates, found ${courses.length}`);

const toolbar = (page: Page) => page.getByTestId('lecture-toolbar');
const iframe = (page: Page, scene: Scene) => page.locator(`iframe[title="Interactive Scene ${scene.id}"]`);
const frame = (page: Page, scene: Scene) => page.frameLocator(`iframe[title="Interactive Scene ${scene.id}"]`);

async function noOverflow(page: Page, scene?: Scene) {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
  if (scene) {
    const documentSize = await frame(page, scene).locator('html').evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    expect(documentSize.scroll, `${scene.id}: iframe horizontal overflow`).toBeLessThanOrEqual(documentSize.width + 1);
    const surface = await iframe(page, scene).boundingBox();
    const footer = await toolbar(page).boundingBox();
    expect(surface).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(surface!.y + surface!.height, 'Iframe must end above toolbar').toBeLessThanOrEqual(footer!.y + 1);
  }
}

async function aboveToolbar(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeInViewport();
  const box = await locator.boundingBox();
  const footer = await toolbar(page).boundingBox();
  expect(box).not.toBeNull();
  expect(footer).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  expect(box!.y + box!.height, 'Control must not be covered by the lecture toolbar').toBeLessThanOrEqual(footer!.y + 1);
  // Trial click adds Playwright's actual hit-target check, including overlays.
  if (await locator.evaluate((el) => el.matches('button, textarea, input'))) await locator.click({ trial: true });
}

async function selectScene(page: Page, scene: Scene) {
  await toolbar(page).getByRole('button', { name: '目錄', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '目錄', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: new RegExp(escapeRegex(scene.title)) }).click();
  await expect(dialog).toBeHidden();
  await expect(iframe(page, scene)).toBeVisible();
  await expect(frame(page, scene).getByRole('heading', { level: 1 })).toHaveText(scene.title);
  await noOverflow(page, scene);
}
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function openCourse(page: Page, course: Course) {
  await page.addInitScript(() => localStorage.setItem('locale', 'zh-TW'));
  await page.goto(`/classroom/${course.id}`);
  await expect(page.getByTestId('lecture-header').getByRole('heading')).toHaveText(course.stage.name, { timeout: 30_000 });
  await expect(toolbar(page)).toBeVisible();
  await expect(iframe(page, course.scenes[0])).toBeVisible();
}

async function languageMenu(page: Page) {
  const header = page.getByTestId('lecture-header');
  await header.getByRole('button', { name: '繁', exact: true }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['繁體中文', '简体中文', 'English']);
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await expect(toolbar(page).getByRole('button', { name: 'Contents', exact: true })).toBeVisible();
  await header.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('menuitem', { name: '简体中文', exact: true }).click();
  await expect(toolbar(page).getByRole('button', { name: '目录', exact: true })).toBeVisible();
  await header.getByRole('button', { name: '简', exact: true }).click();
  await page.getByRole('menuitem', { name: '繁體中文', exact: true }).click();
  await expect(toolbar(page).getByRole('button', { name: '目錄', exact: true })).toBeVisible();
}

async function playRealNarration(page: Page, scene: Scene) {
  const audioPath = scene.actions.find((action) => action.type === 'speech')?.audioId;
  expect(audioPath, `${scene.id} has mounted narration`).toMatch(/^\/api\/classroom-media\/.+\.mp3$/);
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === audioPath && response.status() >= 200 && response.status() < 300);
  await toolbar(page).getByRole('button', { name: '播放講解', exact: true }).click();
  const response = await responsePromise;
  expect(response.headers()['content-type']).toMatch(/audio|octet-stream/);
  // Observe standard media properties only; do not drive the playback engine or
  // synthesize ended events. Advancing currentTime proves actual browser decode.
  await expect.poll(() => page.evaluate((expectedPath) => window.__nobelQAMedia.some((audio) => {
    return new URL(audio.currentSrc || audio.src, location.href).pathname === expectedPath && audio.readyState >= 2 && audio.currentTime > 0.15 && !audio.paused;
  }), audioPath!), { timeout: 20_000 }).toBe(true);
}

async function exerciseQuestions(page: Page, scene: Scene, widget: FrameLocator) {
  const match = scene.content.html.match(/const (?:questions|checks)\s*=\s*(\[.*?\]);/s);
  expect(match, `${scene.id}: expected static answer/feedback contract`).not.toBeNull();
  const questions = JSON.parse(match![1]) as Question[];
  expect(questions.length).toBeGreaterThan(0);
  await expect(widget.locator('[data-q]')).toHaveCount(questions.reduce((count, question) => count + question.options.length, 0));
  for (const [q, question] of questions.entries()) {
    const feedback = widget.locator(`#feedback-${q}`);
    for (const wrong of question.options.keys()) {
      if (wrong === question.answer) continue;
      const button = widget.locator(`[data-q="${q}"][data-option="${wrong}"]`);
      await aboveToolbar(page, button);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(feedback).toHaveText(question.explanations[wrong]);
      await aboveToolbar(page, feedback);
    }
    const correct = widget.locator(`[data-q="${q}"][data-option="${question.answer}"]`);
    await correct.click();
    await expect(correct).toHaveAttribute('aria-pressed', 'true');
    await expect(widget.locator(`[data-q="${q}"][aria-pressed="true"]`)).toHaveCount(1);
    await expect(feedback).toHaveText(question.explanations[question.answer]);
    await aboveToolbar(page, feedback);
  }
  const retry = widget.getByRole('button', { name: '重新作答', exact: true });
  await aboveToolbar(page, retry);
  await retry.click();
  await expect(widget.locator('[data-q][aria-pressed="true"]')).toHaveCount(0);
  for (const q of questions.keys()) await expect(widget.locator(`#feedback-${q}`)).toHaveText('請選一個答案，這裏會顯示解釋；也可以改選。');
  // Re-answer after reset, including visible explanation (not just DOM reset).
  await widget.locator(`[data-q="0"][data-option="${questions[0].answer}"]`).click();
  await expect(widget.locator('#feedback-0')).toHaveText(questions[0].explanations[questions[0].answer]);
}

async function exerciseModel(page: Page, widget: FrameLocator, scene: Scene) {
  const protein = widget.locator('[data-condition="protein"]');
  const light = widget.locator('[data-condition="light"]');
  const customPicture = scene.content.html.includes('data-condition-picture=');
  const picture = widget.locator(customPicture ? '[data-condition-picture]' : '.gate');
  const stateAttribute = customPicture ? 'data-ready' : 'data-open';
  const explanation = widget.locator('#logic-feedback, #door-copy, #gate-copy');
  const initialCopy = await explanation.innerText();
  await expect(protein).toHaveAttribute('aria-pressed', 'false');
  await expect(light).toHaveAttribute('aria-pressed', 'false');
  await light.click();
  await expect(picture).toHaveAttribute(stateAttribute, 'false');
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await protein.click();
  await expect(picture).toHaveAttribute(stateAttribute, 'true');
  expect(await explanation.innerText()).not.toBe(initialCopy);
  await aboveToolbar(page, picture);
  await aboveToolbar(page, explanation);
  await light.click();
  await expect(picture).toHaveAttribute(stateAttribute, 'false');
  await expect(light).toHaveAttribute('aria-pressed', 'false');
  await light.click();
  await expect(picture).toHaveAttribute(stateAttribute, 'true');
  await widget.getByRole('button', { name: '重設兩個條件', exact: true }).click();
  await expect(protein).toHaveAttribute('aria-pressed', 'false');
  await expect(light).toHaveAttribute('aria-pressed', 'false');
  await expect(picture).toHaveAttribute(stateAttribute, 'false');
}

async function exerciseInlineQuestion(page: Page, widget: FrameLocator, kind: 'bell' | 'inquiry') {
  const explanations = kind === 'bell'
    ? ['同時出現還不夠。燈亮可能只是同時發生的事，不能排除鐘聲或時間表等原因。', '對。時間表、鐘聲、老師指示等仍可能有關；需要更合適的比較。']
    : ['只看最後停留位置，會漏掉中間過程，也難排除其他原因。研究者還要比較條件並量度反應。', '對。比較不同光條件和細胞反應，能幫研究者逐步追查中間機制；這仍不是單次觀察就能證明全部因果。'];
  await expect(widget.locator(`[data-${kind}]`)).toHaveCount(2);
  // Reselecting after a wrong/correct attempt is the inline question's retry UI.
  for (const option of [0, 1, 0, 1]) {
    const button = widget.locator(`[data-${kind}="${option}"]`);
    await aboveToolbar(page, button);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(widget.locator(`[data-${kind}][aria-pressed="true"]`)).toHaveCount(1);
    const feedback = widget.locator(`#${kind}-feedback`);
    await expect(feedback).toHaveText(explanations[option]);
    await aboveToolbar(page, feedback);
  }
}

for (const { course, sha256 } of courses) {
  test.describe(course.id, () => {
    test.setTimeout(180_000);
    const errors = new WeakMap<Page, string[]>();
    test.beforeEach(async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL;
      if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(String(baseURL))) throw new Error('Use a loopback built learner container as baseURL; production is prohibited.');
      if (testInfo.project.use.browserName && testInfo.project.use.browserName !== 'chromium') throw new Error('Real Chromium is required.');
      const failures: string[] = [];
      errors.set(page, failures);
      page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
      page.on('console', (message) => { if (message.type() === 'error') failures.push(`console: ${message.text()}`); });
      // AudioPlayer uses detached new Audio() elements. Observe the browser's
      // public media API without consulting Zustand, engine state or IndexedDB.
      await page.addInitScript(() => {
        window.__nobelQAMedia = [];
        const originalPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          if (!window.__nobelQAMedia.includes(this)) window.__nobelQAMedia.push(this);
          return originalPlay.call(this);
        };
      });
      await testInfo.attach('candidate-identity-and-coverage', { body: JSON.stringify({ course: course.id, sha256, viewport: testInfo.project.use.viewport, ai: 'Mock transport only; no real AI/content/audio-discussion acceptance' }, null, 2), contentType: 'application/json' });
    });
    test.afterEach(async ({ page }) => { expect(errors.get(page) || [], 'Browser errors, including iframe scripts').toEqual([]); });

    test('all pages, language menu, mounted narration, every quiz option/retry, model/reset and classroom input', async ({ page }) => {
      await openCourse(page, course);
      await languageMenu(page);
      await playRealNarration(page, course.scenes[0]);
      await toolbar(page).getByRole('button', { name: '暫停講解', exact: true }).click();
      for (const scene of course.scenes) {
        await selectScene(page, scene);
        const widget = frame(page, scene);
        const body = scene.content.html.split(/<body[^>]*>/i)[1]?.split(/<script/i)[0] || '';
        if (/data-q=/.test(body)) await exerciseQuestions(page, scene, widget);
        if (/data-condition=/.test(body)) await exerciseModel(page, widget, scene);
        if (/data-bell=/.test(body)) await exerciseInlineQuestion(page, widget, 'bell');
        if (/data-inquiry=/.test(body)) await exerciseInlineQuestion(page, widget, 'inquiry');
      }
      await toolbar(page).getByRole('button', { name: '課堂提問', exact: true }).click();
      const panel = page.locator('#nobel-classroom-interaction');
      await expect(panel).toBeVisible();
      await expect(panel.getByRole('note')).toContainText('可能不準確');
      const input = page.getByPlaceholder('輸入你的訊息...', { exact: true }).filter({ visible: true });
      await expect(input).toBeVisible();
      await aboveToolbar(page, input);
      await input.fill('這項研究有甚麼限制？');
      await expect(input).toHaveValue('這項研究有甚麼限制？');
      await noOverflow(page);
      await toolbar(page).getByRole('button', { name: '課堂提問', exact: true }).click();
      await expect(panel).toBeHidden();
      await toolbar(page).getByRole('button', { name: '全螢幕', exact: true }).click();
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
      await noOverflow(page, course.scenes[course.scenes.length - 1]);
      await toolbar(page).getByRole('button', { name: '課堂提問', exact: true }).click();
      await expect(panel).toBeVisible();
      await expect(input).toBeVisible();
      await aboveToolbar(page, input);
      await input.fill('全螢幕中的課堂提問草稿');
      await expect(input).toHaveValue('全螢幕中的課堂提問草稿');
      await toolbar(page).getByRole('button', { name: '課堂提問', exact: true }).click();
      await toolbar(page).getByRole('button', { name: '全螢幕', exact: true }).click();
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
      await expect(page.getByTestId('lecture-header')).toBeVisible();
      await noOverflow(page, course.scenes[course.scenes.length - 1]);
    });

    for (const choice of ['skip', 'join'] as const) test(`optional discussion ${choice}: real narration then invitation; mock AI request wiring only`, async ({ page }, testInfo) => {
      const requests: { url: string; body: unknown }[] = [];
      await page.route(/\/api\/chat(?:\/pi)?$/, async (route) => {
        requests.push({ url: route.request().url(), body: route.request().postDataJSON() });
        await route.fulfill({ status: 200, contentType: 'text/event-stream', body: [
          { type: 'cue_user', data: { prompt: 'CI transport mock: no AI answer was generated.' } },
          { type: 'done', data: { totalActions: 0, totalAgents: 0, cueUserReceived: true, agentHadContent: false } },
        ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') });
      });
      await openCourse(page, course);
      const scene = course.scenes.find((item) => item.actions.some((action) => action.type === 'discussion'))!;
      expect(scene, 'Every course must contain an optional discussion').toBeTruthy();
      const topic = scene.actions.find((action) => action.type === 'discussion')!.topic!;
      await selectScene(page, scene);
      await playRealNarration(page, scene);
      // Speed only the real media after decode/progress has been proven. No
      // currentTime seeking, fake ended events, clock mocking or engine calls.
      await page.evaluate(() => window.__nobelQAMedia.forEach((audio) => { if (!audio.paused) audio.playbackRate = 8; }));
      testInfo.annotations.push({ type: 'narration-speed', description: 'Discussion-page mounted narration decoded normally, then browser playbackRate=8 until its real ended event.' });
      const join = page.getByRole('button', { name: '加入討論', exact: true });
      await expect(join).toBeVisible({ timeout: 110_000 });
      await expect(page.getByText(topic, { exact: true }).filter({ visible: true }).first()).toBeVisible();
      // The visible dynamic invitation, with both available choices, is the
      // optional discussion prompt; ordinary lecture HTML need not repeat it.
      await expect(page.getByRole('button', { name: '略過', exact: true })).toBeVisible();
      await aboveToolbar(page, join);
      if (choice === 'skip') {
        const skip = page.getByRole('button', { name: '略過', exact: true });
        await aboveToolbar(page, skip);
        await skip.click();
        await expect(join).toBeHidden();
        expect(requests, 'Skipping must not start an AI request').toHaveLength(0);
        // Navigation remains usable after declining the invitation.
        await selectScene(page, course.scenes[course.scenes.length - 1]);
      } else {
        await join.click();
        await expect.poll(() => requests.length).toBeGreaterThan(0);
        expect(JSON.stringify(requests[0].body)).toContain(topic);
        await expect(join).toBeHidden();
        await expect(page.locator('#nobel-classroom-interaction')).toBeVisible();
        const input = page.getByPlaceholder('輸入你的訊息...', { exact: true }).filter({ visible: true });
        await expect(input).toBeVisible();
        await aboveToolbar(page, input);
        await input.fill('這項研究有哪些限制？');
        const previous = requests.length;
        await input.press('Enter');
        await expect.poll(() => requests.length).toBeGreaterThan(previous);
        expect(JSON.stringify(requests[requests.length - 1].body)).toContain('這項研究有哪些限制？');
      }
      await noOverflow(page);
      await testInfo.attach('mock-ai-requests', { body: JSON.stringify(requests, null, 2), contentType: 'application/json' });
    });
  });
}
