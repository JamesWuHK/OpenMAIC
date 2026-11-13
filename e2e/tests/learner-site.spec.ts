import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const screenshotDirectory = path.join(process.cwd(), 'artifacts', 'learner-site-qa');

async function expectNoDocumentOverflow(page: import('@playwright/test').Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    )
    .toEqual(
      expect.objectContaining({
        clientWidth: expect.any(Number),
        scrollWidth: expect.any(Number),
      }),
    );
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test.beforeAll(async () => {
  await mkdir(screenshotDirectory, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  // Exact-image acceptance must use the image's real mounted media, not a
  // successful local-file response that could hide a broken runtime mount.
  if (process.env.LEARNER_QA_BASE_URL) return;
  await page.route('**/_next/image?**', async (route) => {
    const imageUrl = new URL(route.request().url());
    const source = imageUrl.searchParams.get('url');
    if (!source?.startsWith('/learner/runtime/')) {
      await route.continue();
      return;
    }

    await route.fulfill({
      path: path.join(process.cwd(), 'content/learner/media', path.basename(source)),
    });
  });
});

test('homepage communicates the Hong Kong series proposition and navigates to discovery', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  // The file-backed site headline may replace the built-in fallback during hydration.
  await expect(
    page.getByRole('heading', { name: /把香港，變成你的 AI 課堂|把每個好奇心，變成一門課/ }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: '從香港真問題出發' })).toBeVisible();
  await expect(page.getByRole('link', { name: '探索學習路線' })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.screenshot({
    path: path.join(screenshotDirectory, `${testInfo.project.name}-home-viewport.png`),
  });

  await page.getByRole('link', { name: '查看全部系列' }).click();
  await expect(page).toHaveURL(/\/courses#series$/);
  await expect(page.getByRole('heading', { name: '主題系列' })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.screenshot({
    path: path.join(screenshotDirectory, `${testInfo.project.name}-courses.png`),
  });
});

test('age and topic controls filter planned series without losing navigation context', async ({
  page,
}) => {
  await page.goto('/courses');
  await page.getByRole('link', { name: /小四至小六/ }).click();
  await expect(page).toHaveURL(/age=upper-primary/);
  await page.getByRole('link', { name: '香港探索' }).click();
  await expect(page).toHaveURL(/topic=hong-kong/);
  await expect(page.getByRole('heading', { name: '小四至小六 · 香港探索' })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看香港天氣科技實驗室課程詳情' })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看城市記憶偵探課程詳情' })).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test('series detail makes the original-content and non-endorsement boundary visible', async ({
  page,
}, testInfo) => {
  await page.goto('/series/hong-kong-weather-detectives');
  await expect(page.getByRole('heading', { name: '香港天氣科技實驗室' })).toBeVisible();
  await expect(page.getByText(/課程文字、例子、角色、圖像與互動均重新創作/)).toBeVisible();
  await expect(page.getByText(/不代表相關機構參與製作或認可本課程/)).toBeVisible();
  await expect(page.getByRole('link', { name: /香港天文台/ })).toHaveAttribute(
    'href',
    /^https:\/\/www\.hko\.gov\.hk/,
  );
  await expectNoDocumentOverflow(page);
  await page.screenshot({
    path: path.join(screenshotDirectory, `${testInfo.project.name}-series-viewport.png`),
  });
});

test('standards and source ledger expose the language and source policies', async ({
  page,
}, testInfo) => {
  await page.goto('/standards');
  await expect(page.getByRole('heading', { name: '不同語言，不共用一份稿' })).toBeVisible();
  await expect(page.getByText(/粵語、普通話與英文分別撰寫口語稿/)).toBeVisible();
  await expect(page.getByText(/不表示課程由香港教育局或任何公共機構製作/)).toBeVisible();

  await page.getByRole('link', { name: '資料來源' }).first().click();
  await expect(page).toHaveURL(/\/sources$/);
  await expect(page.getByRole('heading', { name: '主要研究資料' })).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /香港科學館/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /香港太空館/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /投資者及理財教育委員會/ })).toBeVisible();
  await expectNoDocumentOverflow(page);
  await page.screenshot({
    path: path.join(screenshotDirectory, `${testInfo.project.name}-sources-viewport.png`),
  });
});

test('teacher submission explains the review gate before generation', async ({ page }) => {
  await page.goto('/teach');
  await expect(page.getByRole('heading', { name: '把你的教案，變成一節會互動的課' })).toBeVisible();
  await expect(page.getByText(/每一份投稿都先由人審核/)).toBeVisible();
  await expect(page.getByRole('button', { name: '提交審核' })).toBeVisible();
});

test('Nobel lecture question control opens a private, age-appropriate Q&A panel', async ({
  page,
}) => {
  const courses = [
    'hk-nobel-01-kagan-lecture-v4',
    'hk-nobel-02-soai-lecture-v4',
    'hk-nobel-03-halzen-lecture-v3',
    'hk-nobel-04-deisseroth-lecture-v2',
    'hk-nobel-05-hegemann-lecture-v1',
  ];

  await page.route('**/api/classroom?id=*', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('id');
    if (!id || !courses.includes(id)) {
      await route.continue();
      return;
    }
    const fixture = await readFile(
      path.join(process.cwd(), 'e2e', 'fixtures', 'nobel-interaction', `${id}.json`),
      'utf8',
    );
    await route.fulfill({ status: 200, contentType: 'application/json', body: fixture });
  });

  for (const id of courses) {
    await page.goto(`/classroom/${id}`);
    const questionButton = page.getByRole('button', { name: /提问讨论|課堂提問|Ask and discuss/ });
    await expect(questionButton).toBeVisible();
    await questionButton.click();
    await expect(questionButton).toHaveAttribute('aria-expanded', 'true');
    await expect(questionButton).toHaveAttribute('aria-controls', 'nobel-classroom-interaction');

    const interactionPanel = page.locator('#nobel-classroom-interaction');
    await expect(interactionPanel).toBeVisible();
    await expect(interactionPanel.getByRole('note')).toContainText(/AI/);
    await expect(interactionPanel.getByRole('note')).toContainText(/this lesson|本课|本課/i);
    await expect(interactionPanel.getByRole('note')).toContainText(/health|健康/i);

    const questionInput = page
      .getByTestId('roundtable-non-presentation-input-stage')
      .getByRole('textbox');
    await expect(questionInput).toBeVisible();
    await expectNoDocumentOverflow(page);

    await questionButton.click();
    await expect(questionButton).toHaveAttribute('aria-expanded', 'false');
    await expect(questionInput).toBeHidden();
  }
});


test.describe('learner managed recording', () => {
  test.use({
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
    permissions: ['microphone'],
  });

  const id = 'hk-nobel-08-hassabis-illustrated-v1-mandarin';
  async function installTranscriptionStub(page: import('@playwright/test').Page, delayed = false) {
    await page.addInitScript(({ delayed }) => {
      const original = window.fetch.bind(window);
      (window as any).__asr = { returned: false };
      window.fetch = async (input, init) => {
        if (String(input) !== '/api/transcription') return original(input, init);
        const form = init!.body as FormData;
        const audio = form.get('audio') as File;
        const bytes = new Uint8Array(await audio.arrayBuffer());
        const state = (window as any).__asr;
        state.keys = Array.from(form.keys()).sort();
        state.language = form.get('language');
        state.name = audio.name;
        state.type = audio.type;
        state.header = Array.from(bytes.slice(0, 12));
        state.signal = init!.signal;
        if (delayed) await new Promise<void>(resolve => { (window as any).__resolveASR = resolve; });
        state.abortedAtResponse = !!init!.signal?.aborted;
        state.returned = true;
        // Intentionally ignore AbortSignal to exercise the stale-session guard.
        return new Response(JSON.stringify({ text: 'Synthetic learner question' }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      };
    }, { delayed });
  }

  async function openRecordingCourse(page: import('@playwright/test').Page, locale = 'zh-TW') {
    await page.addInitScript((value) => {
      localStorage.setItem('locale', value);
      for (const key of ['SpeechRecognition', 'webkitSpeechRecognition']) {
        Object.defineProperty(window, key, { configurable: true, value: undefined });
      }
    }, locale);
    await page.route('**/api/classroom?id=*', async route => {
      if (new URL(route.request().url()).searchParams.get('id') !== id) return route.continue();
      const data = JSON.parse(await readFile(path.join(process.cwd(), 'e2e', 'fixtures', 'nobel-interaction', 'hk-nobel-01-kagan-lecture-v4.json'), 'utf8'));
      data.classroom.id = id;
      data.classroom.stage.id = id;
      for (const scene of data.classroom.scenes) scene.stageId = id;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto('/classroom/' + id);
    await expect(page.locator('button:has(svg.lucide-mic):visible').last()).toBeVisible();
  }
  const mic = (page: import('@playwright/test').Page) => page.locator('button:has(svg.lucide-mic):visible').last();
  const stop = (page: import('@playwright/test').Page) => page.locator('div.pointer-events-auto.relative.group.cursor-pointer:has(svg.lucide-mic):visible').last();
  const text = (page: import('@playwright/test').Page) => page.locator('button:has(svg.lucide-message-square):visible').last();

  for (const [locale, language] of [['zh-TW', 'zh-HK'], ['zh-CN', 'zh-CN']]) {
    test('records WAV and sends the ' + language + ' question through server ASR', async ({ page }) => {
      let chat = '';
      await installTranscriptionStub(page);
      await page.route(/\/api\/chat(?:\/pi)?(?:\?|$)/, route => {
        chat += route.request().postData() || '';
        return route.abort();
      });
      await openRecordingCourse(page, locale);
      await mic(page).click();
      await page.waitForTimeout(700);
      await stop(page).click();
      await expect.poll(() => page.evaluate(() => (window as any).__asr.returned)).toBe(true);
      const upload = await page.evaluate(() => {
        const { signal, ...value } = (window as any).__asr;
        return value;
      });
      expect(upload.keys).toEqual(['audio', 'language']);
      expect(upload.name).toBe('recording.wav');
      expect(upload.type).toBe('audio/wav');
      expect(upload.language).toBe(language);
      expect(upload.header.slice(0, 4)).toEqual([82, 73, 70, 70]);
      expect(upload.header.slice(8, 12)).toEqual([87, 65, 86, 69]);
      await expect.poll(() => chat).toContain('Synthetic learner question');
    });
  }

  test('closing input cancels an uploading transcription and ignores its late result', async ({ page }) => {
    let chat = '';
    await installTranscriptionStub(page, true);
    await page.route(/\/api\/chat(?:\/pi)?(?:\?|$)/, route => {
      chat += route.request().postData() || '';
      return route.abort();
    });
    await openRecordingCourse(page);
    await mic(page).click();
    await page.waitForTimeout(700);
    await stop(page).click();
    await expect.poll(() => page.evaluate(() => typeof (window as any).__resolveASR)).toBe('function');
    await text(page).click();
    await page.evaluate(() => (window as any).__resolveASR());
    await expect.poll(() => page.evaluate(() => (window as any).__asr.returned)).toBe(true);
    expect(await page.evaluate(() => (window as any).__asr.abortedAtResponse)).toBe(true);
    await page.waitForTimeout(500);
    expect(chat).not.toContain('Synthetic learner question');
    await expect(page.locator('textarea:visible').first()).toBeVisible();
  });

  test('closing while permission is pending stops a late microphone stream', async ({ page }) => {
    await page.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      (window as any).__lateTracks = [];
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        await new Promise<void>(resolve => { (window as any).__releasePermission = resolve; });
        const stream = await original(constraints);
        (window as any).__lateTracks = stream.getTracks();
        return stream;
      };
    });
    let uploads = 0;
    await page.route('**/api/transcription', route => { uploads++; return route.abort(); });
    await openRecordingCourse(page);
    await mic(page).click();
    await expect.poll(() => page.evaluate(() => typeof (window as any).__releasePermission)).toBe('function');
    await text(page).click();
    await page.evaluate(() => (window as any).__releasePermission());
    await expect.poll(() => page.evaluate(() => {
      const tracks = (window as any).__lateTracks;
      return tracks.length > 0 && tracks.every((t: MediaStreamTrack) => t.readyState === 'ended');
    })).toBe(true);
    expect(uploads).toBe(0);
  });
});


test('hidden fullscreen controls allow an overlapped slide link to work', async ({ page }) => {
  const id = 'hk-nobel-08-hassabis-illustrated-v1-mandarin';
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => localStorage.setItem('locale', 'zh-TW'));
  await page.route('**/api/classroom?id=*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('id') !== id) return route.continue();
    const data = JSON.parse(await readFile(path.join(process.cwd(), 'e2e', 'fixtures', 'nobel-interaction', 'hk-nobel-01-kagan-lecture-v4.json'), 'utf8'));
    data.classroom.id = id;
    data.classroom.stage.id = id;
    data.classroom.scenes = data.classroom.scenes.slice(0, 1);
    data.classroom.scenes[0].stageId = id;
    data.classroom.scenes[0].type = 'interactive';
    data.classroom.scenes[0].content = { type: 'interactive', html: `<!doctype html><html><body style="margin:0;height:100vh"><a href="#qa" style="position:absolute;font-size:16px" onclick="this.dataset.clicked='yes';return false">Source link</a></body></html>` };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto('/classroom/' + id);
  await expect(page.locator('iframe:visible').first()).toBeVisible();
  await page.getByRole('button', { name: /全螢幕|全屏|Fullscreen/i }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  const speed = page.getByRole('button', { name: 'Playback speed' });
  const speedBox = await speed.boundingBox();
  const iframeBox = await page.locator('iframe:visible').first().boundingBox();
  expect(speedBox).not.toBeNull();
  expect(iframeBox).not.toBeNull();
  const frame = page.frameLocator('iframe:visible').first();
  const sourceLink = frame.getByRole('link', { name: 'Source link' });
  await sourceLink.evaluate((link, target) => {
    const scaleX = document.documentElement.clientWidth / target.frameWidth;
    const scaleY = document.documentElement.clientHeight / target.frameHeight;
    (link as HTMLElement).style.left = `${(target.x - target.frameX) * scaleX}px`;
    (link as HTMLElement).style.top = `${(target.y - target.frameY) * scaleY}px`;
  }, { x: speedBox!.x + speedBox!.width / 2, y: speedBox!.y + speedBox!.height / 2, frameX: iframeBox!.x, frameY: iframeBox!.y, frameWidth: iframeBox!.width, frameHeight: iframeBox!.height });
  const linkBox = await sourceLink.boundingBox();
  expect(linkBox).not.toBeNull();
  expect(linkBox!.x).toBeLessThan(speedBox!.x + speedBox!.width);
  expect(linkBox!.x + linkBox!.width).toBeGreaterThan(speedBox!.x);
  expect(linkBox!.y).toBeLessThan(speedBox!.y + speedBox!.height);
  expect(linkBox!.y + linkBox!.height).toBeGreaterThan(speedBox!.y);
  expect(linkBox!.x + 2).toBeGreaterThan(speedBox!.x);
  expect(linkBox!.x + 2).toBeLessThan(speedBox!.x + speedBox!.width);
  expect(linkBox!.y + 2).toBeGreaterThan(speedBox!.y);
  expect(linkBox!.y + 2).toBeLessThan(speedBox!.y + speedBox!.height);
  await page.getByRole('button', { name: 'Mute', exact: true }).hover();
  const slider = page.locator('input[type=range]:visible').first();
  await expect(slider).toBeVisible();
  await slider.hover();
  const sliderBox = await slider.boundingBox();
  expect(sliderBox).not.toBeNull();
  await page.waitForTimeout(5000);
  const sliderHit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
    x: sliderBox!.x + sliderBox!.width / 2, y: sliderBox!.y + sliderBox!.height / 2,
  });
  expect(sliderHit, 'hidden volume popover must not receive pointer events').toBe('IFRAME');
  // Move first, then wait for controls to hide again. Down/up use exactly this
  // page-coordinate position, so no implicit locator mouse move wakes them.
  await page.mouse.move(linkBox!.x + 2, linkBox!.y + 2);
  await page.waitForTimeout(5000);
  const hiddenSpeedBox = await speed.boundingBox();
  expect(hiddenSpeedBox).not.toBeNull();
  expect(linkBox!.x + 2).toBeGreaterThan(hiddenSpeedBox!.x);
  expect(linkBox!.x + 2).toBeLessThan(hiddenSpeedBox!.x + hiddenSpeedBox!.width);
  expect(linkBox!.y + 2).toBeGreaterThan(hiddenSpeedBox!.y);
  expect(linkBox!.y + 2).toBeLessThan(hiddenSpeedBox!.y + hiddenSpeedBox!.height);
  const hiddenHit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
    x: linkBox!.x + 2, y: linkBox!.y + 2,
  });
  expect(hiddenHit, 'hidden toolbar must not intercept the overlapping slide link').toBe('IFRAME');
  const toolbarOpacity = await speed.evaluate((button) => {
    const toolbar = button.closest('.fixed.bottom-0');
    return toolbar ? getComputedStyle(toolbar).opacity : null;
  });
  expect(toolbarOpacity).toBe('0');
  await page.mouse.down();
  await page.mouse.up();
  await expect(sourceLink).toHaveAttribute('data-clicked', 'yes');
  expect(await speed.evaluate((button) => {
    const toolbar = button.closest('.fixed.bottom-0');
    return toolbar ? getComputedStyle(toolbar).opacity : null;
  })).toBe('0');
  await page.mouse.move(5, 5);
  const before = await speed.innerText();
  await speed.click();
  await expect(speed).not.toHaveText(before);
});
