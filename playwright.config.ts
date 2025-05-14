import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// ✅ Load environment variables from .env
dotenv.config();

export default defineConfig({
  // 🔍 Where your tests live
  testDir: './tests',

  // 🚀 Run tests in parallel across files
  fullyParallel: true,
  globalTimeout: 10 * 60 * 1000, // ⏱ Limit total test run to 10 min

  // ⏱ Global timeouts
  timeout: 30 * 1000, // 30s per test
  expect: {
    timeout: process.env.CI ? 10000 : 5000, // longer expect timeout in CI
  },

  // 🔄 Auto-retries if tests fail (great for CI)
  retries: process.env.CI ? 2 : 0,

  // 💾 Output folder for screenshots, videos, traces
  outputDir: 'test-results/',

  // 🌐 Global settings (can be overridden per project)
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== 'false', // allow visual debug by setting HEADLESS=false
    launchOptions: {
      slowMo: process.env.CI ? 100 : 0, // slight delay to stabilize CI tests
    },
    screenshot: 'only-on-failure', // full-page screenshots on failures
    video: 'off', // disable video recordings to reduce I/O overhead
    trace: 'on-first-retry', // full trace on first retry
    viewport: { width: 1280, height: 720 },
    // Extra: you can also set storageState, userAgent, etc.
  },

  // 🚧 Start built app (always fresh server in CI, longer timeout)
  webServer: {
    command: 'npm run start',
    url: process.env.BASE_URL || 'http://localhost:3000',
    timeout: 120 * 1000, // wait up to 2 minutes for server to be ready
    reuseExistingServer: false,
  },

  // ✅ Multi-browser setup
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

  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  workers: process.env.CI ? 2 : undefined,
  reportSlowTests: { max: 0, threshold: 15000 },
});
