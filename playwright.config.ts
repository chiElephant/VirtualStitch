import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const localBaseURL = 'http://localhost:3000';

const isCI = !!process.env.CI;
const ciBaseURL = process.env.BASE_URL;

// Vercel Automation Bypass
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const bypassQuery = `?x-vercel-protection-bypass=${bypassSecret}&x-vercel-set-bypass-cookie=samesitenone`;

/* getProjectConfig dynamically configures browser-specific settings.
Chromium requires bypass credentials (for Vercel-protected environments) to be passed via query parameters
instead of headers due to stricter cookie policies and header behavior.
This function isolates that logic, ensuring:
- In CI: Chromium appends the Vercel bypass query to the BASE_URL
Firefox and WebKit support bypassing via extra HTTP headers, so they continue using that method.
This separation ensures stable E2E tests across CI and local environments, while satisfying
the constraints of each browser engine regarding cookie and auth handling. */

function getProjectConfig(
  browser:
    | 'Desktop Chrome'
    | 'Desktop Firefox'
    | 'Desktop Safari'
    | 'Pixel 5'
    | 'iPhone 12'
) {
  if (browser === 'Desktop Chrome' || browser === 'Pixel 5') {
    return {
      ...devices[browser],
      baseURL: isCI ? `${ciBaseURL}${bypassQuery}` : localBaseURL,
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
  globalTimeout: isCI ? 30 * 60 * 1000 : undefined,
  maxFailures: isCI ? 1 : 0,

  // Updated output directory structure
  outputDir: './test-results/playwright/artifacts',
  preserveOutput: 'failures-only',

  projects: [
    {
      name: 'chromium',
      use: getProjectConfig('Desktop Chrome'),
      outputDir: './test-results/playwright/chromium',
    },
    {
      name: 'firefox',
      use: getProjectConfig('Desktop Firefox'),
      outputDir: './test-results/playwright/firefox',
    },
    {
      name: 'webkit',
      use: getProjectConfig('Desktop Safari'),
      outputDir: './test-results/playwright/webkit',
    },
    {
      name: 'mobile-chrome',
      use: getProjectConfig('Pixel 5'),
      outputDir: './test-results/playwright/mobile-chrome',
    },
    {
      name: 'mobile-safari',
      use: getProjectConfig('iPhone 12'),
      outputDir: './test-results/playwright/mobile-safari',
    },
  ],

  quiet: isCI,
  reportSlowTests: { max: 2, threshold: 5 * 60 * 1000 },

  // Updated reporter configuration
  reporter:
    isCI ?
      [
        ['github'],
        ['html', { outputFolder: './test-results/playwright/html-report' }],
        ['junit', { outputFile: './test-results/playwright/junit.xml' }],
        ['json', { outputFile: './test-results/playwright/results.json' }],
      ]
    : [
        ['line', { FORCE_COLOR: true }],
        [
          'html',
          {
            outputFolder: './test-results/playwright/html-report',
            open: 'never',
          },
        ],
        ['json', { outputFile: './test-results/playwright/results.json' }],
      ],

  retries: isCI ? 1 : 0,
  testDir: './tests',
  timeout: 1 * 60 * 1000,
  tsconfig: './tsconfig.test.json',

  use: {
    headless: true,
    launchOptions: {
      slowMo: isCI ? 100 : 0,
    },
    trace: 'on-first-retry',
    video: 'on-first-retry',
    // Screenshots go to project-specific outputDir
    screenshot: 'only-on-failure',
  },

  workers: isCI ? 1 : undefined,

  webServer:
    process.env.CI ?
      undefined
    : {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
});
