import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isCI = !!process.env.CI;
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const localBaseURL = 'http://localhost:3000';
const ciBaseURL = process.env.BASE_URL;
const bypassQuery = `?x-vercel-protection-bypass=${bypassSecret}&x-vercel-set-bypass-cookie=samesitenone`;

function getProjectConfig(
  browser: 'Desktop Chrome' | 'Desktop Firefox' | 'Desktop Safari'
) {
  if (browser === 'Desktop Chrome') {
    return {
      ...devices[browser],
      baseURL: `${isCI ? ciBaseURL : localBaseURL}${bypassQuery}`,
    };
  }

  return {
    ...devices[browser],
    baseURL: isCI ? ciBaseURL : localBaseURL,
    extraHTTPHeaders:
      bypassSecret ?
        {
          'x-vercel-protection-bypass': bypassSecret,
          'x-vercel-set-bypass-cookie': 'samesitenone',
        }
      : undefined,
  };
}

export default defineConfig({
  captureGitInfo: { commit: true },
  expect: {
    timeout: isCI ? 15000 : 5000,
  },
  failOnFlakyTests: isCI,
  forbidOnly: isCI,
  fullyParallel: true,
  globalTimeout: isCI ? 60 * 60 * 1000 : undefined,
  maxFailures: isCI ? 1 : 0,
  outputDir: 'test-results/',
  preserveOutput: 'failures-only',

  projects: [
    { name: 'Chromium', use: getProjectConfig('Desktop Chrome') },
    { name: 'Firefox', use: getProjectConfig('Desktop Firefox') },
    { name: 'WebKit', use: getProjectConfig('Desktop Safari') },
  ],

  quiet: isCI,
  reportSlowTests: { max: 0, threshold: 5 * 60 * 1000 },

  reporter:
    isCI ?
      [['github'], ['json', { outputFile: './test_results/test-results.json' }]]
    : [
        ['line', { FORCE_COLOR: true }],
        ['json', { outputFile: './test_results/test-results.json' }],
      ],

  retries: isCI ? 1 : 0,
  testDir: './tests',
  timeout: 2 * 60 * 1000,
  tsconfig: './tsconfig.test.json',

  use: {
    headless: true,
    launchOptions: {
      slowMo: isCI ? 100 : 0,
    },
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  workers: isCI ? 2 : undefined,
});
