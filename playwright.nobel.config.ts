import { defineConfig, devices } from '@playwright/test';

process.env.NO_PROXY = ['127.0.0.1', 'localhost', process.env.NO_PROXY].filter(Boolean).join(',');
process.env.no_proxy = process.env.NO_PROXY;

// CI tests the already-built image. Never start a second Next server there.
const externalBaseURL = process.env.LEARNER_QA_BASE_URL;
if (externalBaseURL && !/^http:\/\/127\.0\.0\.1:\d+$/.test(externalBaseURL)) {
  throw new Error('LEARNER_QA_BASE_URL must target a loopback CI container.');
}

export default defineConfig({
  testDir: './e2e/tests',
  testMatch: /nobel-series-interactions\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: 'artifacts/learner-site-qa/test-results',
  use: {
    baseURL: externalBaseURL || 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        channel: process.env.CI ? undefined : 'chrome',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        channel: process.env.CI ? undefined : 'chrome',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'pnpm exec next dev -p 3100',
        url: 'http://127.0.0.1:3100',
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ACCESS_CODE: '',
          OPENMAIC_DEPLOYMENT_MODE: 'learner',
          NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE: 'learner',
          NEXT_PUBLIC_PRO_WORKBENCH_ENABLED: 'false',
          NEXT_PUBLIC_MAIC_EDITOR_ENABLED: 'false',
          NEXT_PUBLIC_MAIC_EDITOR_RENDERER_ENABLED: 'false',
          NEXT_PUBLIC_PI_CHAT_ENABLED: 'false',
          NEXT_PUBLIC_ENABLE_VIDEO_EXPORT: 'false',
          NEXT_PUBLIC_ENABLE_PPTX_IMPORT: 'false',
        },
      },
});
