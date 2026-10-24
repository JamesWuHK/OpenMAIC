/**
 * LIVE PRODUCTION ACCEPTANCE. Running this file contacts https://class.wanli.ai
 * and creates real AI/TTS requests. This is not a local smoke test and is not
 * run by importing/checking this source. Execute only in an authorized Actions
 * workflow; never run a browser on the user's Mac. No routes or audio are mocked.
 *
 * The report contains complete synthetic conversation replies for independent review.
 * Functional success is distinct from all-three-role coverage and content review.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

assert.equal(process.env.CI, 'true', 'Production browser acceptance is restricted to CI.');
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Run only on the authorized GitHub Actions runner.');
const base = process.env.NOBEL_QA_BASE_URL || 'https://class.wanli.ai';
assert.equal(base, 'https://class.wanli.ai', 'The only permitted base is exactly https://class.wanli.ai.');
const fixtureRoot = path.resolve(process.env.NOBEL_QA_CLASSROOMS_DIR || 'ci/nobel-acceptance/classrooms');
const outputRoot = path.resolve(process.env.NOBEL_QA_OUTPUT_DIR || `artifacts/nobel-series-real-discussion-${process.env.GITHUB_RUN_ID || 'actions'}`);
const turnTimeoutMs = 240_000;
const roles = ['teacher', 'assistant', 'student'];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

// Only redact known sensitive environment values and credential-shaped fields;
// no environment, browser storage, headers or complete request bodies are saved.
const secretValues = Object.entries(process.env).filter(([name, value]) => /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i.test(name) && value?.length >= 8).map(([, value]) => value);
function safeText(value) {
  let text = String(value);
  for (const secret of secretValues) text = text.split(secret).join('[REDACTED]');
  return text.replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]')
    .replace(/(["']?(?:api[_-]?key|access[_-]?token|authorization|password|secret)["']?\s*[:=]\s*)["']?[^\s,"'}]+/gi, '$1[REDACTED]');
}
function sanitize(value) {
  if (typeof value === 'string') return safeText(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /api.?key|authorization|access.?token|password|secret|credential/i.test(key) ? '[REDACTED]' : sanitize(item)]));
  return value;
}
async function save(name, data) { await writeFile(path.join(outputRoot, name), JSON.stringify(sanitize(data), null, 2) + '\n'); }
function endpoint(url) { const value = new URL(url); return value.origin === base ? value.pathname : `${value.origin}${value.pathname}`; }
const isChat = (url) => { const u = new URL(url); return u.origin === base && /^\/api\/chat(?:\/pi)?$/.test(u.pathname); };
const isSpeech = (url) => { const u = new URL(url); return u.origin === base && u.pathname === '/api/learner/speech'; };
function generatedReplies(bytes) {
  // Save only visible text events and public speaker identity, never tool args,
  // model configuration, headers, hidden reasoning or complete SSE bodies.
  const messages = new Map();
  let currentId = null;
  for (const block of bytes.toString('utf8').split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
    if (!data || data === '[DONE]') continue;
    let event; try { event = JSON.parse(data); } catch { continue; }
    if (event.type === 'agent_start') {
      currentId = event.data?.messageId;
      if (currentId) messages.set(currentId, { messageId: currentId, agentId: event.data.agentId || null, sender: event.data.agentName || null, text: '' });
    }
    if (event.type === 'text_delta') {
      const id = event.data?.messageId || currentId || 'unattributed';
      if (!messages.has(id)) messages.set(id, { messageId: id, agentId: null, sender: null, text: '' });
      messages.get(id).text += event.data?.content ?? event.data?.delta ?? '';
    }
    if (event.type === 'agent_end') currentId = null;
  }
  return [...messages.values()].filter((message) => message.text.trim());
}

const files = (await readdir(fixtureRoot)).filter((name) => /^hk-nobel-0[1-6]-.+\.json$/.test(name)).sort();
assert.equal(files.length, 6, 'Expected exactly six reviewed new classroom fixtures.');
const courses = await Promise.all(files.map(async (name) => {
  const bytes = await readFile(path.join(fixtureRoot, name));
  const course = JSON.parse(bytes.toString());
  assert.equal(name, `${course.id}.json`);
  const roster = course.stage.generatedAgentConfigs.map(({ id, name: agentName, role }) => ({ id, name: agentName, role }));
  assert.ok(roles.every((role) => roster.some((agent) => agent.role === role)), `${course.id}: expected three authored roles`);
  return { course, roster, sourceSHA256: sha(bytes), semanticSHA256: sha(canonical(course)) };
}));
assert.equal(new Set(courses.map(({ course }) => course.id.slice(9, 11))).size, 6, 'One fixture for each course 01–06 is required.');

const questions = {
  '01': '卡甘研究的非線性效應，對理解氣味或藥物研究有甚麼價值？為甚麼不能說所有反應都會放大偏向，或已保證新藥有效？',
  '02': '硤合團隊的不對稱自催化對研究分子偏向有甚麼價值？為甚麼這仍不是生命起源完整歷史的證明？',
  '03': 'IceCube 在深冰記錄的微光怎樣幫人研究宇宙？這與直接拍到中微子照片有甚麼分別，日常產品又能否保證？',
  '04': '選定細胞表達感光蛋白並接受合適光，對研究腦細胞有甚麼價值？為甚麼不是思想遙控器，也不能當作普遍治療保證？',
  '05': '黑格曼研究藻類感光怎樣幫到腦科學？這與人的視覺有甚麼分別，研究工具與醫療前景又要怎樣分開？',
  '06': '納格爾與合作者測量光照前後電流，怎樣幫人理解通道蛋白？為甚麼有了新工具仍不等於已有現成療法？',
};
const report = {
  startedAt: new Date().toISOString(), base, githubRunId: process.env.GITHUB_RUN_ID || null,
  githubSHA: process.env.GITHUB_SHA || null, execution: 'REAL PRODUCTION; no mocks; no browser credentials supplied',
  cases: [], functionalPass: false, allRolesObservedInEveryCase: false,
  limitations: [
    'Synthetic questions only; no real student data is entered.',
    'Replies are AI generated. Transport/playback success does not establish factual or pedagogical correctness; complete replies are included for independent content review.',
    'Authored role avatars expose hover descriptions, not controls that force a role to speak. Prompts request participation, but coverage is based only on observed sender names and speech agent IDs.',
    'Script never seeks media or changes playbackRate. Server-side voice configuration is reported through actual endpoints, not controlled here.',
  ],
};
await mkdir(outputRoot, { recursive: true });
// Import and launch occur only after the CI, Actions, exact-origin and fixtures
// guards above. No API keys, provider settings or storageState enter a context.
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch({ headless: true });

async function installObserver(context) {
  await context.addInitScript(() => {
    if (window.top !== window) return;
    localStorage.setItem('locale', 'zh-TW');
    const state = window.__nobelRealDiscussion = { speech: [], audio: [] };
    const sources = new Map(), observed = new WeakMap();
    const nativeFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await nativeFetch.apply(this, args);
      if (new URL(response.url).pathname === '/api/learner/speech') {
        let body = {};
        try { body = JSON.parse(args[1]?.body || '{}'); } catch { /* No observer-generated page errors. */ }
        const row = { agentId: body.agentId || null, at: Date.now(), status: response.status };
        state.speech.push(row);
        if (response.ok) {
          try {
            const payload = await response.clone().json();
            if (payload.base64) sources.set(`data:audio/${payload.format || 'mp3'};base64,${payload.base64}`, { agentId: row.agentId, speechIndex: state.speech.length - 1 });
          } catch { row.observerReadError = true; }
        }
      }
      return response;
    };
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!observed.has(this)) {
        const association = sources.get(this.currentSrc || this.src);
        const entry = {
          kind: association ? 'discussion' : 'unassociated-media', agentId: association?.agentId || null,
          speechIndex: association?.speechIndex ?? null, startedAt: null, ended: false, error: null,
          audibleStarted: false, advanced: false, firstTime: null, lastTime: 0, readyState: 0,
          volume: this.volume, muted: this.muted, playbackRate: this.playbackRate,
        };
        const sample = () => {
          entry.lastTime = this.currentTime; entry.readyState = this.readyState;
          entry.volume = this.volume; entry.muted = this.muted; entry.playbackRate = this.playbackRate;
          if (!this.paused && !this.muted && this.volume > 0 && this.readyState >= 2) {
            entry.audibleStarted = true;
            entry.firstTime ??= this.currentTime;
            entry.advanced ||= this.currentTime > entry.firstTime + 0.15;
          }
        };
        this.addEventListener('playing', () => { entry.startedAt ??= Date.now(); sample(); });
        this.addEventListener('timeupdate', sample);
        this.addEventListener('ended', () => { sample(); entry.ended = true; });
        this.addEventListener('error', () => { entry.error = this.error?.code || 'media error'; });
        state.audio.push(entry); observed.set(this, entry);
      }
      return nativePlay.call(this);
    };
  });
}

async function readReplies(page) {
  return page.locator('#nobel-classroom-interaction').evaluate((panel) => {
    return [...panel.querySelectorAll('span.whitespace-pre-wrap.break-words, p.whitespace-pre-wrap.break-words')].filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden').map((element) => {
      const content = element.parentElement?.parentElement;
      const row = content?.parentElement;
      return { text: element.textContent?.trim() || '', sender: content?.querySelector(':scope > span.block')?.textContent?.trim() || null, isUser: row?.classList.contains('flex-row-reverse') || false };
    }).filter((item) => item.text);
  });
}

async function checkLayout(page, record, phase) {
  const metrics = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  record.layout.push({ phase, ...metrics });
  assert.ok(metrics.scrollWidth <= metrics.clientWidth + 1, `${phase}: horizontal document overflow`);
  const input = page.getByPlaceholder('輸入你的訊息...', { exact: true }).filter({ visible: true });
  if (await input.count()) {
    const box = await input.first().boundingBox();
    const footer = await page.getByTestId('lecture-toolbar').boundingBox();
    assert.ok(box && footer && box.y >= 0 && box.x >= 0 && box.x + box.width <= metrics.clientWidth + 1 && box.y + box.height <= footer.y + 1, `${phase}: input clipped or covered by toolbar`);
  }
}

async function runCase(item, viewport) {
  const { course, roster } = item;
  const slug = `${course.id}-${viewport.name}`;
  const record = { courseId: course.id, viewport: viewport.name, dimensions: viewport.size, sourceSHA256: item.sourceSHA256, expectedSemanticSHA256: item.semanticSHA256, roster, startedAt: new Date().toISOString(), turns: [], chatResponses: [], speechResponses: [], failedRequests: [], consoleErrors: [], pageErrors: [], layout: [], screenshots: [], normalEnd: false, pass: false };
  report.cases.push(record);
  const context = await browser.newContext({ viewport: viewport.size, ...(viewport.name === 'mobile' ? { isMobile: true, hasTouch: true } : {}) });
  await installObserver(context);
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(60_000);
  const pendingChats = new Set(), pendingSpeech = new Set(), pendingReads = new Set();
  let lastActivityAt = Date.now();
  const byId = new Map(roster.map((agent) => [agent.id, agent]));
  page.on('console', (message) => { if (message.type() === 'error') record.consoleErrors.push(safeText(message.text())); });
  page.on('pageerror', (error) => record.pageErrors.push(safeText(error.message)));
  page.on('request', (request) => {
    if (isChat(request.url())) pendingChats.add(request);
    if (isSpeech(request.url())) pendingSpeech.add(request);
    if (isChat(request.url()) || isSpeech(request.url())) lastActivityAt = Date.now();
  });
  page.on('requestfinished', (request) => { pendingChats.delete(request); pendingSpeech.delete(request); if (isChat(request.url()) || isSpeech(request.url())) lastActivityAt = Date.now(); });
  page.on('requestfailed', (request) => {
    pendingChats.delete(request); pendingSpeech.delete(request);
    record.failedRequests.push({ endpoint: endpoint(request.url()), error: safeText(request.failure()?.errorText || '') });
  });
  page.on('response', (response) => {
    if (isChat(response.url())) {
      const row = { endpoint: endpoint(response.url()), status: response.status(), at: Date.now(), completed: false };
      record.chatResponses.push(row);
      const read = response.body().then((bytes) => { row.completeGeneratedReplies = generatedReplies(bytes); row.completed = true; }).catch((error) => { row.readError = safeText(error.message); });
      pendingReads.add(read); void read.finally(() => pendingReads.delete(read));
    }
    if (isSpeech(response.url())) {
      let body = {}; try { body = response.request().postDataJSON() || {}; } catch { /* Record only allowlisted speech fields. */ }
      record.speechResponses.push({ status: response.status(), at: Date.now(), agentId: body.agentId || null, role: byId.get(body.agentId)?.role || null });
    }
  });
  const screenshot = async (phase) => {
    const name = `${slug}-${phase}.png`;
    await page.screenshot({ path: path.join(outputRoot, name), fullPage: true });
    record.screenshots.push(name);
  };
  const readAudio = () => page.evaluate(() => window.__nobelRealDiscussion?.audio || []);
  const openInput = async () => {
    const input = page.getByPlaceholder('輸入你的訊息...', { exact: true }).filter({ visible: true });
    if (!await input.count()) {
      const toggle = page.getByRole('button', { name: '課堂提問', exact: true });
      if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
      else {
        const textButton = page.getByRole('button', { name: '文字輸入', exact: true }).filter({ visible: true });
        if (await textButton.count()) await textButton.first().click();
        else { await page.locator('body').click({ position: { x: 2, y: 2 } }); await page.keyboard.press('T'); }
      }
    }
    await input.first().waitFor({ state: 'visible' });
    return input.first();
  };
  try {
    const loaded = page.waitForResponse((response) => new URL(response.url()).origin === base && new URL(response.url()).pathname === '/api/classroom' && new URL(response.url()).searchParams.get('id') === course.id);
    void loaded.catch(() => {}); // A failed navigation is reported by this case.
    await page.goto(`${base}/classroom/${course.id}`, { waitUntil: 'domcontentloaded' });
    assert.equal(new URL(page.url()).origin, base, 'Unexpected navigation origin');
    const classroomResponse = await loaded;
    assert.equal(classroomResponse.status(), 200, 'Production classroom GET failed');
    const classroomPayload = await classroomResponse.json();
    record.runtimeSemanticSHA256 = sha(canonical(classroomPayload.classroom));
    assert.equal(classroomPayload.success, true);
    assert.equal(record.runtimeSemanticSHA256, item.semanticSHA256, 'Production is not serving the reviewed candidate JSON');
    await page.getByTestId('lecture-header').getByRole('heading', { name: course.stage.name, exact: true }).waitFor();
    await page.getByRole('button', { name: '課堂提問', exact: true }).click();
    await page.locator('#nobel-classroom-interaction').getByRole('note').waitFor();
    await checkLayout(page, record, 'loaded-question-panel');

    const runTurn = async (prompt, number) => {
      const beforeReplies = new Set((await readReplies(page)).map((reply) => `${reply.sender}:${reply.text}`));
      const audioBaseline = (await readAudio()).length;
      const chatBaseline = record.chatResponses.length, speechBaseline = record.speechResponses.length;
      const turn = { number, prompt, sentAt: Date.now(), continuedThroughUI: 0, pass: false };
      record.turns.push(turn);
      const input = await openInput();
      await checkLayout(page, record, `turn-${number}-input`);
      const firstChat = page.waitForResponse((response) => isChat(response.url()) && response.request().method() === 'POST', { timeout: 120_000 });
      void firstChat.catch(() => {}); // Avoid an unhandled waiter if input fails.
      await input.fill(prompt);
      turn.sentAt = Date.now();
      await input.press('Enter');
      assert.equal((await firstChat).status(), 200, `Turn ${number}: real chat status`);
      let stableSince = Date.now(), previousSignature = '';
      const deadline = Date.now() + turnTimeoutMs;
      let settled = false;
      while (Date.now() < deadline) {
        const replies = (await readReplies(page)).filter((reply) => !reply.isUser && reply.text !== prompt && !beforeReplies.has(`${reply.sender}:${reply.text}`));
        const audio = (await readAudio()).slice(audioBaseline);
        const signature = JSON.stringify({ replies, audio: audio.map(({ agentId, ended, error }) => ({ agentId, ended, error })), speechCount: record.speechResponses.length });
        if (signature !== previousSignature) { previousSignature = signature; stableSince = Date.now(); }
        const keepOpen = page.locator('#nobel-classroom-interaction').getByRole('button', { name: /^繼續討論/ }).filter({ visible: true });
        if (await keepOpen.count()) { await keepOpen.first().click(); turn.continuedThroughUI++; }
        const realSpeech = audio.filter((entry) => entry.kind === 'discussion');
        if (replies.some((reply) => reply.text.length > 20) && realSpeech.some((entry) => entry.audibleStarted && entry.advanced) && realSpeech.every((entry) => entry.ended || entry.error) && pendingChats.size === 0 && pendingSpeech.size === 0 && pendingReads.size === 0 && Date.now() - Math.max(stableSince, lastActivityAt) >= 5000) { settled = true; break; }
        await page.waitForTimeout(250);
      }
      turn.chatResponses = record.chatResponses.slice(chatBaseline);
      turn.speechResponses = record.speechResponses.slice(speechBaseline);
      turn.audio = (await readAudio()).slice(audioBaseline).map((entry) => ({ ...entry, role: byId.get(entry.agentId)?.role || null }));
      turn.completeVisibleReplies = (await readReplies(page)).filter((reply) => !reply.isUser && reply.text !== prompt && !beforeReplies.has(`${reply.sender}:${reply.text}`)).map((reply) => ({ ...reply, roleByVisibleName: roster.find((agent) => agent.name === reply.sender)?.role || null }));
      turn.completeGeneratedReplies = turn.chatResponses.flatMap((response) => response.completeGeneratedReplies || []).map((reply) => ({ ...reply, roleByAgentId: byId.get(reply.agentId)?.role || null }));
      assert.ok(settled, `Turn ${number}: response/real speech did not completely settle within ${turnTimeoutMs}ms`);
      assert.ok(turn.chatResponses.length && turn.chatResponses.every((response) => response.status === 200 && response.completed), `Turn ${number}: every real chat request must finish with 200`);
      assert.ok(turn.speechResponses.some((response) => response.status === 200), `Turn ${number}: no real speech 200`);
      assert.ok(turn.speechResponses.every((response) => response.status === 200), `Turn ${number}: failed speech response`);
      assert.ok(turn.audio.some((entry) => entry.kind === 'discussion' && entry.audibleStarted && entry.advanced && entry.ended && entry.volume > 0 && !entry.muted), `Turn ${number}: no completed audible real speech with progress`);
      assert.ok(turn.audio.every((entry) => !entry.error && entry.playbackRate === 1), `Turn ${number}: media error or unexpected browser playbackRate`);
      assert.ok(turn.completeVisibleReplies.some((reply) => reply.text.length > 20), `Turn ${number}: no visible AI answer`);
      assert.ok(turn.completeGeneratedReplies.some((reply) => reply.text.length > 20), `Turn ${number}: no complete generated text events captured`);
      const normalize = (text) => text.replace(/\s+/g, ' ').trim();
      turn.generatedTextFullyRendered = turn.completeGeneratedReplies.every((generated) => turn.completeVisibleReplies.some((visible) => normalize(visible.text).includes(normalize(generated.text))));
      assert.ok(turn.generatedTextFullyRendered, `Turn ${number}: complete generated answer was not rendered in the visible chat transcript`);
      const finalBubble = page.locator('#nobel-classroom-interaction').locator('span.whitespace-pre-wrap.break-words, p.whitespace-pre-wrap.break-words').filter({ visible: true }).last();
      await finalBubble.scrollIntoViewIfNeeded();
      assert.equal(await finalBubble.isVisible(), true);
      await checkLayout(page, record, `turn-${number}-replied`);
      await screenshot(`turn-${number}`);
      turn.finishedAt = Date.now(); turn.pass = true;
      await save(`${slug}.json`, record);
    };
    const courseNumber = course.id.match(/^hk-nobel-(\d{2})-/)[1];
    await runTurn(`這是本課的科學問題，不含個人資料。${questions[courseNumber]} 請知衡老師先用兩句粵語回答；AI助教明理和AI同學阿問如有需要，可各補一句或提出一個常見疑問。請只根據本課，分清價值和限制，回答後等我追問。`, 1);
    await runTurn('跟住上一個答案，請用一個普通人容易理解的具體例子，說明一項研究價值和一項仍未證實、不能保證的事情。若AI助教或AI同學剛才未參與，可以請他們補充或提出一個疑問；請短答，然後等我按結束問答。', 2);
    const end = page.locator('#nobel-classroom-interaction').getByRole('button', { name: /^(結束問答|結束討論)$/ }).filter({ visible: true }).first();
    await end.waitFor({ state: 'visible' });
    record.normalEndLabel = await end.innerText();
    await end.click();
    await end.waitFor({ state: 'hidden' });
    await page.waitForTimeout(1000);
    record.normalEnd = true;
    await checkLayout(page, record, 'normally-ended');
    await screenshot('ended');
    assert.deepEqual(record.consoleErrors, [], 'Browser console errors');
    assert.deepEqual(record.pageErrors, [], 'Browser page errors, including sandbox frames');
    assert.deepEqual(record.failedRequests, [], 'Failed browser requests');
    record.pass = record.turns.length === 2 && record.turns.every((turn) => turn.pass) && record.normalEnd;
  } catch (error) {
    record.error = safeText(error.stack || error.message || error);
    record.observedAudioOnFailure = await readAudio().catch(() => []);
    record.completeVisibleRepliesOnFailure = await readReplies(page).catch(() => []);
    await screenshot('failed').catch((failure) => { record.screenshotError = safeText(failure.message); });
  } finally {
    const allAudio = await readAudio().catch(() => []);
    record.roleCoverage = {
      requested: roles,
      actualAudible: roles.filter((role) => allAudio.some((entry) => byId.get(entry.agentId)?.role === role && entry.audibleStarted && entry.advanced)),
      actualVisible: roles.filter((role) => record.turns.some((turn) => turn.completeVisibleReplies?.some((reply) => reply.roleByVisibleName === role))),
      selectorAvailability: 'No authored per-role select/speak buttons; avatars are HoverCard triggers only.',
    };
    record.roleCoverage.uncoveredAudible = roles.filter((role) => !record.roleCoverage.actualAudible.includes(role));
    record.roleCoverage.uncoveredVisible = roles.filter((role) => !record.roleCoverage.actualVisible.includes(role));
    record.finishedAt = new Date().toISOString();
    // Best-effort UI stop on a failed case before closing its isolated context.
    // A cleanup stop is recorded separately and cannot turn a failed case PASS.
    if (!record.normalEnd) {
      const stop = page.locator('#nobel-classroom-interaction').getByRole('button', { name: /^(結束問答|結束討論)$/ }).filter({ visible: true }).first();
      if (await stop.count().catch(() => 0)) { await stop.click({ timeout: 5000 }).then(() => { record.cleanupStopClicked = true; }).catch(() => {}); }
    }
    await save(`${slug}.json`, record);
    await save('report.json', report);
    await context.close();
    console.log(JSON.stringify({ courseId: course.id, viewport: viewport.name, functionalPass: record.pass, roleCoverage: record.roleCoverage, report: `${slug}.json` }));
  }
}

try {
  for (const item of courses) for (const viewport of [{ name: 'desktop', size: { width: 1440, height: 900 } }, { name: 'mobile', size: { width: 390, height: 844 } }]) await runCase(item, viewport);
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.functionalPass = report.cases.length === 12 && report.cases.every((record) => record.pass);
  report.allRolesObservedInEveryCase = report.cases.length === 12 && report.cases.every((record) => record.roleCoverage?.uncoveredAudible.length === 0 && record.roleCoverage?.uncoveredVisible.length === 0);
  report.contentReviewStatus = 'PENDING_INDEPENDENT_CONTENT_REVIEW';
  await save('report.json', report);
  console.log(JSON.stringify({ functionalPass: report.functionalPass, allRolesObservedInEveryCase: report.allRolesObservedInEveryCase, cases: report.cases.length, report: path.join(outputRoot, 'report.json') }));
  if (!report.functionalPass) process.exitCode = 1;
}
