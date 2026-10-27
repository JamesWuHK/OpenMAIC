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
  await expect(page.getByRole('heading', { name: '把每個好奇心，變成一門課' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '從香港真問題出發' })).toBeVisible();
  await expect(page.getByRole('button', { name: /香港探索/ })).toBeVisible();
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
    fullPage: true,
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

test('Nobel lecture question control opens a private, age-appropriate Q&A panel', async ({ page }) => {
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

test('switching from a Nobel lecture through discovery loads the selected uncached course', async ({ page }) => {
  const nobelId = 'hk-nobel-01-kagan-lecture-v4';
  const targetId = 'hk-c01-01-debatable-claim';
  const fixture = await readFile(
    path.join(process.cwd(), 'e2e', 'fixtures', 'nobel-interaction', `${nobelId}.json`),
    'utf8',
  );
  let targetRequests = 0;
  await page.route('**/api/classroom?id=*', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('id');
    if (id !== nobelId && id !== targetId) return route.continue();
    let body = fixture;
    if (id === targetId) {
      targetRequests++;
      const copy = JSON.parse(fixture.replaceAll(nobelId, targetId).replaceAll('nobel01-', 'switch-ci-'));
      copy.classroom.stage.name = '切課驗收：中文課';
      copy.classroom.scenes[0].title = '切課驗收：中文課';
      body = JSON.stringify(copy);
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
  await page.goto(`/classroom/${nobelId}`);
  await page.locator('a[href="/series/nobel-curiosity-lab"]').first().click();
  await expect(page).toHaveURL(/\/series\/nobel-curiosity-lab$/);
  await page.locator('a[href="/courses#series"]').first().click();
  await expect(page).toHaveURL(/\/courses#series$/);
  await page.locator(`a[href="/classroom/${targetId}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/classroom/${targetId}$`));
  await expect(page.getByText('切課驗收：中文課', { exact: true }).first()).toBeVisible();
  expect(targetRequests).toBe(1);
  await expect(page.getByText('諾獎人物故事', { exact: true })).toHaveCount(0);
});
