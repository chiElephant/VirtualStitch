import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  captureGitInfo: { commit: true },
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },
  failOnFlakyTests: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  globalTimeout: process.env.CI ? 30 * 60 * 1000 : undefined,
  maxFailures: process.env.CI ? 1 : 0,
  outputDir: 'test-results/',
  preserveOutput: 'failures-only',

  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'WebKit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  quiet: !!process.env.CI,
  reportSlowTests: { max: 0, threshold: 5 * 60 * 1000 },

  reporter:
    process.env.CI ?
      [['github'], ['json', { outputFile: 'test-results.json' }]]
    : [
        ['line', { FORCE_COLOR: true }],
        ['json', { outputFile: 'test-results.json' }],
      ],

  retries: process.env.CI ? 1 : 0,
  testDir: './tests',
  timeout: 2 * 60 * 1000,
  tsconfig: './tsconfig.test.json',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    launchOptions: {
      slowMo: process.env.CI ? 100 : 0,
    },
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  webServer: {
    command: 'npm run build && npm start',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
    name: 'Playwright server',
    reuseExistingServer: true,
    timeout: 2 * 60 * 1000,
    url: process.env.BASE_URL || 'http://localhost:3000',
  },

  workers: process.env.CI ? 2 : undefined,
});
