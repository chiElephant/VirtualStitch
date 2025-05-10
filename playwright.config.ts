import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// ✅ Load environment variables from .env
dotenv.config();

export default defineConfig({
  // 🔍 Where your tests live
  testDir: './tests',

  // 🚀 Run tests in parallel across files
  fullyParallel: true,

  // ⏱ Global timeouts
  timeout: 30 * 1000, // 30s per test
  expect: {
    timeout: 5000, // 5s max per expect()
  },

  // 🔄 Auto-retries if tests fail (great for CI)
  retries: process.env.CI ? 2 : 0,

  // 💾 Output folder for screenshots, videos, traces
  outputDir: 'test-results/',

  // 🌐 Global settings (can be overridden per project)
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true, // set false if you want to watch tests locally

    screenshot: 'only-on-failure', // full-page screenshots on failures
    video: 'retain-on-failure', // keep video only if test fails
    trace: 'on-first-retry', // full trace on first retry

    viewport: { width: 1280, height: 720 },

    // Extra: you can also set storageState, userAgent, etc.
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

  // 🌎 Web server: optional, runs before tests
  webServer:
    process.env.START_SERVER === 'true' ?
      {
        command: 'npm run start', // or 'next start', etc.
        url: process.env.BASE_URL || 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes
      }
    : undefined,
});
