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
  maxFailures: isCI ? 3 : 0,

  // Updated output directory structure
  outputDir: './test-results/playwright/artifacts',
  preserveOutput: 'failures-only',

  projects: [
    // Main browser projects - only run new organized tests
    {
      name: 'chromium',
      use: getProjectConfig('Desktop Chrome'),
      outputDir: './test-results/playwright/chromium',
      testDir: './tests',
    },
    {
      name: 'firefox',
      use: getProjectConfig('Desktop Firefox'),
      outputDir: './test-results/playwright/firefox',
      testDir: './tests',
    },
    {
      name: 'webkit',
      use: getProjectConfig('Desktop Safari'),
      outputDir: './test-results/playwright/webkit',
      testDir: './tests',
    },
    {
      name: 'mobile-chrome',
      use: getProjectConfig('Pixel 5'),
      outputDir: './test-results/playwright/mobile-chrome',
      testDir: './tests',
    },
    {
      name: 'mobile-safari',
      use: getProjectConfig('iPhone 12'),
      outputDir: './test-results/playwright/mobile-safari',
      testDir: './tests',
    },

    // Test category projects (for targeted testing and CI/CD)
    {
      name: 'smoke-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/deployment/smoke.spec.ts',
      outputDir: './test-results/playwright/smoke',
    },
    {
      name: 'core-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/core/**/*.spec.ts',
      outputDir: './test-results/playwright/core',
    },
    {
      name: 'integration-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/integration/**/*.spec.ts',
      outputDir: './test-results/playwright/integration',
    },
    {
      name: 'quality-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/quality/**/*.spec.ts',
      outputDir: './test-results/playwright/quality',
    },
    {
      name: 'api-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/api/**/*.spec.ts',
      outputDir: './test-results/playwright/api',
    },
    {
      name: 'deployment-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/deployment/**/*.spec.ts',
      outputDir: './test-results/playwright/deployment',
    },

    // Special purpose projects with filters
    {
      name: 'accessibility',
      use: {
        ...getProjectConfig('Desktop Chrome'),
        colorScheme: 'light',
      },
      testDir: './tests',
      grep: /@accessibility/,
      outputDir: './test-results/playwright/accessibility',
    },
    {
      name: 'performance',
      use: {
        ...getProjectConfig('Desktop Chrome'),
        launchOptions: {
          args: ['--enable-gpu-benchmarking', '--enable-gpu-rasterization'],
        },
      },
      testDir: './tests',
      grep: /@performance-monitoring/,
      outputDir: './test-results/playwright/performance',
    },
  ],

  quiet: isCI,
  reportSlowTests: { max: 5, threshold: 2 * 60 * 1000 },

  // Enhanced reporter configuration for new structure
  reporter:
    isCI ?
      [
        ['github'],
        [
          'html',
          {
            outputFolder: './test-results/playwright/html-report',
            open: 'never',
          },
        ],
        [
          'junit',
          {
            outputFile: './test-results/playwright/junit.xml',
            includeProjectInTestName: true,
          },
        ],
        [
          'json',
          {
            outputFile: './test-results/playwright/results.json',
          },
        ],
        [
          'blob',
          {
            outputDir: './test-results/playwright/blob-report',
          },
        ],
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
        [
          'json',
          {
            outputFile: './test-results/playwright/results.json',
          },
        ],
      ],

  retries: isCI ? 2 : 0,
  testDir: './tests',
  timeout: 2 * 60 * 1000,
  tsconfig: './tsconfig.test.json',

  use: {
    headless: true,
    launchOptions: {
      slowMo: isCI ? 100 : 0,
    },
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    video: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    // Add extra context for debugging
    contextOptions: {
      recordVideo:
        isCI ?
          {
            dir: './test-results/playwright/videos/',
            size: { width: 1280, height: 720 },
          }
        : undefined,
    },
  },

  workers: isCI ? 1 : undefined,

  webServer:
    isCI ? undefined : (
      {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
      }
    ),

  // Global setup and teardown for enhanced test coordination
  globalSetup: isCI ? require.resolve('./tests/utils/global-setup') : undefined,
  globalTeardown:
    isCI ? require.resolve('./tests/utils/global-teardown') : undefined,
});
