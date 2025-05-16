import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  globalTimeout: 30 * 60 * 1000,

  timeout: 90 * 1000,
  expect: {
    timeout: process.env.CI ? 15000 : 5000,
  },

  retries: process.env.CI ? 4 : 0,

  outputDir: 'test-results/',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    launchOptions: {
      slowMo: process.env.CI ? 100 : 0,
    },
    trace: 'retain-on-failure', // Only save trace when a test fails
    video: 'retain-on-failure', // Only save video when a test fails
    screenshot: 'only-on-failure', // O

    viewport: { width: 1280, height: 720 },
  },

  workers: process.env.CI ? 2 : undefined,
  reportSlowTests: { max: 5, threshold: 15000 },

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

  webServer: {
    command: 'npm run build && npm run start',
    url: process.env.BASE_URL || 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
