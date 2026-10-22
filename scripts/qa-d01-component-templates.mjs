#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildD01LessonHtml, buildD01ProjectStepHtml, D01_LESSONS } from './lib/d01-local-components.mjs';

const modules = process.env.CODEX_WORKSPACE_NODE_MODULES
  ?? '/Users/wujames/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = await import(pathToFileURL(resolve(modules, 'playwright/index.mjs')).href);
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  if (pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }
  const [, lessonId, route, step] = pathname.split('/');
  try {
    const html = route === 'step'
      ? buildD01ProjectStepHtml(lessonId, step, 'zh-HK')
      : buildD01LessonHtml(lessonId, 'zh-HK');
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const { port } = server.address();
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const results = [];

try {
  for (const lesson of D01_LESSONS) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => { if (!request.url().startsWith(`http://127.0.0.1:${port}/`)) externalRequests.push(request.url()); });
    await page.goto(`http://127.0.0.1:${port}/${lesson.id}`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('[data-signature-interaction]').count(), 1);
    assert.equal(await page.locator('[data-revision-interaction]').count(), 1);
    await page.locator('#check-first').click();
    assert.match(await page.locator('#interaction-result').innerText(), /先作一個設計選擇/);
    await page.locator('#choice').selectOption('0');
    await page.locator('#rationale').fill('我選這個方向，因為它最能表達我的設計意圖。');
    await page.locator('#observation').fill('我實際看了正面與側面；若工具未成功則會記未測試。');
    await page.locator('#check-first').click();
    assert.match(await page.locator('#interaction-result').innerText(), /判斷與觀察已保存/);
    await page.locator('#revision').fill('請 AI 只改一項辨識特徵，其他設定保持不變。');
    await page.locator('#evidence').fill('用同一個角度比較，前後版本的特徵更清楚。');
    await page.locator('#same-view').check();
    await page.locator('#handoff-button').click();
    assert.match(await page.locator('#handoff').innerText(), /學生不操作 Blender/);
    await page.locator('#check-revision').click();
    assert.match(await page.locator('#revision-result').innerText(), /待執行的指令草稿/);
    await page.locator('#ai-executed').check();
    await page.locator('#check-revision').click();
    assert.match(await page.locator('#revision-result').innerText(), /作品證據已記錄/);
    assert.ok(await page.evaluate((id) => Boolean(localStorage.getItem(`wanli:d01:${id}:workbench:v1`)), lesson.id));
    await page.locator('#language').selectOption('en');
    assert.match(await page.locator('#lesson-title').innerText(), /Desk Creature|Monster Organizer|Pocket Hideout|Five-Second Story|Shadow Riddle|Mini Wonder Exhibition/);
    assert.match(await page.locator('label[for="language"]').innerText(), /Reading language/);
    assert.match(await page.locator('#interaction-result').innerText(), /Decision and observation saved/);
    await page.reload();
    assert.equal(await page.locator('#revision').inputValue(), '請 AI 只改一項辨識特徵，其他設定保持不變。');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${lesson.id}: 390px overflow ${overflow}px`);
    assert.deepEqual(errors, [], `${lesson.id}: ${errors.join(' | ')}`);
    assert.deepEqual(externalRequests, [], `${lesson.id}: unexpected external requests`);
    results.push({ id: lesson.id, mobile390: 'pass', statefulInteractions: 2, errorFeedbackRetry: 'pass', localRestore: 'pass', localeSwitch: 'pass', externalRequests: 0, consoleErrors: errors.length });
    await page.close();

    for (const step of ['investigation', 'critique', 'revision', 'showcase', 'transfer']) {
      const projectPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const projectErrors = [];
      const projectRequests = [];
      projectPage.on('pageerror', (error) => projectErrors.push(error.message));
      projectPage.on('console', (message) => { if (message.type() === 'error') projectErrors.push(message.text()); });
      projectPage.on('request', (request) => { if (!request.url().startsWith(`http://127.0.0.1:${port}/`)) projectRequests.push(request.url()); });
      await projectPage.goto(`http://127.0.0.1:${port}/${lesson.id}/step/${step}`, { waitUntil: 'domcontentloaded' });
      assert.equal(await projectPage.locator('textarea').count(), 3, `${lesson.id}/${step}: three evidence prompts`);
      await projectPage.locator('#save').click();
      assert.match(await projectPage.locator('#result').innerText(), /補充具體觀察|补充具体观察|Add a specific observation/);
      const answers = ['這是具體的初始觀察記錄。', '這一步只改一項條件。', '我會保存並核對實際版本證據。'];
      for (const [index, answer] of answers.entries()) await projectPage.locator(`#answer-${index}`).fill(answer);
      await projectPage.locator('#save').click();
      assert.match(await projectPage.locator('#result').innerText(), /已記下你的項目證據|已记录你的项目证据|Your project evidence is recorded/);
      await projectPage.locator('#language').selectOption('en');
      await projectPage.waitForFunction(() => document.documentElement.lang === 'en');
      assert.match(await projectPage.locator('#result').innerText(), /Your project evidence is recorded/);
      assert.ok(await projectPage.evaluate(({ id, stepName }) => Boolean(localStorage.getItem(`wanli:d01:${id}:pbl-step:${stepName}:v1`)), { id: lesson.id, stepName: step }));
      await projectPage.reload();
      assert.equal(await projectPage.locator('#answer-0').inputValue(), answers[0]);
      await projectPage.locator('#language').selectOption('en');
      await projectPage.waitForFunction(() => document.documentElement.lang === 'en');
      assert.match(await projectPage.locator('#result').innerText(), /Your project evidence is recorded/);
      const projectOverflow = await projectPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(projectOverflow <= 1, `${lesson.id}/${step}: 390px overflow ${projectOverflow}px`);
      assert.deepEqual(projectErrors, [], `${lesson.id}/${step}: ${projectErrors.join(' | ')}`);
      assert.deepEqual(projectRequests, [], `${lesson.id}/${step}: unexpected external requests`);
      results.push({ id: lesson.id, pblStep: step, mobile390: 'pass', errorFeedbackRetry: 'pass', localRestore: 'pass', localeSwitch: 'pass', externalRequests: 0, consoleErrors: projectErrors.length });
      await projectPage.close();
    }
  }
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const keyboardErrors = [];
  desktop.on('pageerror', (error) => keyboardErrors.push(error.message));
  desktop.on('console', (message) => { if (message.type() === 'error') keyboardErrors.push(message.text()); });
  await desktop.goto(`http://127.0.0.1:${port}/D01-01`, { waitUntil: 'domcontentloaded' });
  assert.equal(await desktop.locator('[data-signature-interaction]').evaluate((element) => getComputedStyle(element.parentElement).gridTemplateColumns.split(' ').length), 2);
  await desktop.locator('#check-first').focus();
  await desktop.keyboard.press('Enter');
  assert.match(await desktop.locator('#interaction-result').innerText(), /先作一個設計選擇/);
  assert.deepEqual(keyboardErrors, []);
  results.push({ id: 'D01-desktop-keyboard', desktop1440: 'pass', keyboardActivation: 'pass', pageErrors: 0 });
  await desktop.close();
  console.log(JSON.stringify({ result: 'PASS', results }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
}
