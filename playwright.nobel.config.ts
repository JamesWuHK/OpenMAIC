import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.LEARNER_QA_BASE_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)) {
  throw new Error('Nobel acceptance requires an already-built loopback learner container.');
}
process.env.NO_PROXY = ['127.0.0.1', 'localhost', process.env.NO_PROXY].filter(Boolean).join(',');
process.env.no_proxy = process.env.NO_PROXY;

export default defineConfig({
  testDir: './e2e/tests',
  testMatch: /nobel-series-interactions\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  maxFailures: 2,
  reporter: [
    ['list'],
    ['json', { outputFile: 'artifacts/learner-site-qa/nobel-report.json' }],
  ],
  outputDir: 'artifacts/learner-site-qa/test-results',
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
});
