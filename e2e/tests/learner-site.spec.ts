import { mkdir } from 'node:fs/promises';
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

test('homepage communicates the Hong Kong series proposition and navigates to discovery', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '把每個好奇心，變成一門課' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '從香港真問題出發' })).toBeVisible();
  await expect(page.getByRole('link', { name: /香港 AI 小偵探/ })).toBeVisible();
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
  await expect(page.getByRole('link', { name: /香港天氣偵探/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /城市記憶偵探/ })).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test('series detail makes the original-content and non-endorsement boundary visible', async ({
  page,
}, testInfo) => {
  await page.goto('/series/hong-kong-weather-detectives');
  await expect(page.getByRole('heading', { name: '香港天氣偵探' })).toBeVisible();
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

test('family and school pages stay reachable from the primary navigation', async ({ page }) => {
  await page.goto('/parents');
  await expect(
    page.getByRole('heading', { name: '孩子學會的，不只是怎樣叫 AI 做事' }),
  ).toBeVisible();
  await page.getByRole('link', { name: '學校' }).click();
  await expect(page).toHaveURL(/\/schools$/);
  await expect(
    page.getByRole('heading', { name: '把 AI 素養放進學生熟悉的真實問題' }),
  ).toBeVisible();
});
