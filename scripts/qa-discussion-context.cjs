const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
(async () => {
  const fixture = JSON.parse(fs.readFileSync(process.env.CANDIDATE_FILE || path.join(process.cwd(), 'e2e/fixtures/nobel-interaction/hk-nobel-02-soai-lecture-v4.json')));
  const course = fixture.classroom || fixture;
  const id = course.id, source = course.scenes.find(s => s.actions.some(a => a.type === 'discussion')) || course.scenes[0];
  const topic = 'context-topic-20261113', prompt = 'context-prompt-20261113';
  const discussion = { id: 'context-test-discussion', type: 'discussion', agentId: 'default-1', ...source.actions.find(a => a.type === 'discussion'), topic, prompt };
  course.scenes = [{ ...source, order: 0, type: 'interactive', content: { type: 'interactive', html: '<!doctype html><html><body><h1>Context regression fixture</h1></body></html>' }, actions: [discussion] }];
  const r = { syntheticClassroom: true, syntheticModel: true, modelCalls: 0, code: process.env.CANDIDATE_REVISION || process.env.GITHUB_SHA, requests: [], errors: [], pass: false };
  const proxy = http.createServer((req, res) => {
    const q = http.request(new URL(req.url, process.env.PRIVATE_BASE || process.env.LEARNER_QA_BASE_URL), { method: req.method, headers: req.headers }, out => { res.writeHead(out.statusCode, out.headers); out.pipe(res); });
    q.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
    res.on('close', () => { if (!res.writableEnded) q.destroy(); }); req.pipe(q);
  });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const phone = process.env.QA_MOBILE === 'true';
    const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 }, isMobile: phone, hasTouch: phone });
    await context.addInitScript(() => { if (window === window.top) { try { localStorage.setItem('locale', 'zh-TW'); } catch {} } });
    const page = await context.newPage(); page.on('pageerror', e => r.errors.push(String(e)));
    await page.route('**/api/classroom?id=*', route => new URL(route.request().url()).searchParams.get('id') === id ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, classroom: course }) }) : route.continue());
    await page.route(/\/api\/chat(?:\/pi)?(?:\?|$)/, async route => {
      const body = route.request().postDataJSON(), index = r.requests.length;
      r.requests.push({ index, sessionType: body.config.sessionType, topic: body.config.discussionTopic, prompt: body.config.discussionPrompt, userMessages: body.messages.filter(m => m.role === 'user').map(m => m.parts.filter(p => p.type === 'text').map(p => p.text).join('')) });
      const agentId = discussion.agentId, messageId = 'context-test-' + index;
      const events = index % 2 === 0 ? [
        { type: 'agent_start', data: { agentId, agentName: 'QA teacher', messageId, agentAvatar: '', agentColor: '#123456' } },
        { type: 'text_delta', data: { messageId, content: '測試回覆。' } },
        { type: 'agent_end', data: { messageId, agentId } },
        { type: 'done', data: { totalAgents: 1, totalActions: 0, agentHadContent: true, directorState: { turnCount: 1, agentResponses: [] } } },
      ] : [
        { type: 'cue_user', data: { fromAgentId: agentId } },
        { type: 'done', data: { totalAgents: 0, totalActions: 0, cueUserReceived: true, directorState: { turnCount: 1, agentResponses: [] } } },
      ];
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: events.map(e => 'data: ' + JSON.stringify(e) + '\n\n').join('') });
    });
    await page.goto('http://127.0.0.1:' + proxy.address().port + '/classroom/' + id, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '繁', exact: true }).first().waitFor();
    const mute = page.getByRole('button', { name: 'Mute', exact: true }); if (await mute.count()) await mute.first().click();
    const join = page.getByRole('button', { name: /^(加入討論|加入讨论|Join discussion|Join Discussion)$/ });
    if (!await join.count()) await page.getByRole('button', { name: 'Play', exact: true }).first().click();
    await join.waitFor({ timeout: 30000 }); await join.click();
    async function awaitCount(count) { const end = Date.now() + 20000; while (Date.now() < end) { if (r.requests.length >= count && (await page.locator('body').innerText()).includes('輪到你發言')) return; await page.waitForTimeout(100); } throw Error('mock discussion failed to cue'); }
    await awaitCount(2);
    for (let n = 0; n < 2; n++) {
      const input = page.locator('textarea:visible').first(); if (!await input.count()) await page.locator('button:has(svg.lucide-message-square):visible').last().click();
      await input.waitFor(); const question = 'context question ' + n; await input.fill(question); await input.press('Enter');
      const end = Date.now() + 20000; while (Date.now() < end && !r.requests.some(x => x.userMessages.at(-1) === question)) await page.waitForTimeout(100);
      const sent = r.requests.find(x => x.userMessages.at(-1) === question); assert.ok(sent, 'follow-up absent');
      assert.equal(sent.topic, topic, 'discussion topic lost on follow-up');
      assert.equal(sent.prompt, prompt, 'discussion prompt lost on follow-up');
      await awaitCount((n + 2) * 2);
    }
    assert.ok(r.requests.every(x => x.sessionType === 'discussion' && x.topic === topic && x.prompt === prompt)); assert.equal(r.errors.length, 0);
    r.pass = true; await context.close();
  } catch (e) { r.failure = String(e); process.exitCode = 1; }
  finally { await browser.close(); proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); http.globalAgent.destroy(); const out = process.env.QA_CONTEXT_OUTPUT || path.join(process.cwd(), 'artifacts/learner-site-qa', 'discussion-context-' + (process.env.QA_MOBILE === 'true' ? 'phone' : 'desktop') + '.json'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(r, null, 2)); console.log(JSON.stringify({ pass: r.pass, failure: r.failure, code: r.code, requests: r.requests })); }
})();
