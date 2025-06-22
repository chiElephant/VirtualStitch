import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const localBaseURL = 'http://localhost:3000';
const isCI = !!process.env.CI;
const ciBaseURL = process.env.BASE_URL;

// Vercel Automation Bypass
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const bypassQuery = `?x-vercel-protection-bypass=${bypassSecret}&x-vercel-set-bypass-cookie=samesitenone`;

function getProjectConfig(browser: string) {
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

  // ⚡ OPTIMIZED TIMEOUTS
  expect: {
    timeout: isCI ? 15000 : 10000, // 10-15 seconds for assertions
  },

  failOnFlakyTests: isCI,
  forbidOnly: isCI,
  fullyParallel: true,

  // Reasonable global timeout
  globalTimeout: isCI ? 20 * 60 * 1000 : undefined, // 20 minutes (reduced from 30)
  maxFailures: isCI ? 3 : 0,

  outputDir: './test-results/playwright/artifacts',
  preserveOutput: 'failures-only',

  projects: [
    // 🚀 CORE TESTS - Fast and focused
    {
      name: 'core-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/core/**/*.spec.ts',
      outputDir: './test-results/playwright/core',
      timeout: 30_000, // 30 seconds - perfect for unit-style tests
    },

    // 🧪 INTEGRATION TESTS - Moderate timeout for component interaction
    {
      name: 'integration-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/integration/**/*.spec.ts',
      outputDir: './test-results/playwright/integration',
      timeout: 45_000, // 45 seconds - allows for file validation + interactions
      expect: { timeout: 15_000 }, // 15 seconds for assertions
    },

    // 💨 SMOKE TESTS - Quick verification
    {
      name: 'smoke-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/deployment/smoke.spec.ts',
      outputDir: './test-results/playwright/smoke',
      timeout: 30_000, // 30 seconds - should be very fast
    },

    // 🔍 QUALITY TESTS - Performance and accessibility
    {
      name: 'quality-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/quality/**/*.spec.ts',
      outputDir: './test-results/playwright/quality',
      timeout: 60_000, // 1 minute - performance tests may need more time
    },

    // 🌐 API TESTS - FIXED: Increased timeout for complex iterative tests
    {
      name: 'api-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/api/**/*.spec.ts',
      outputDir: './test-results/playwright/api',
      timeout: 45_000, // INCREASED: Was 20s, now 45s to prevent page context closure
      expect: { timeout: 15_000 }, // Increased assertion timeout
    },

    // 🚀 DEPLOYMENT TESTS - May need longer for environment setup
    {
      name: 'deployment-tests',
      use: getProjectConfig('Desktop Chrome'),
      testDir: './tests',
      testMatch: '**/deployment/**/*.spec.ts',
      outputDir: './test-results/playwright/deployment',
      timeout: 90_000, // 1.5 minutes - deployment verification
    },

    // Main browser projects with optimized timeouts
    {
      name: 'chromium',
      use: getProjectConfig('Desktop Chrome'),
      outputDir: './test-results/playwright/chromium',
      testDir: './tests',
      timeout: 45_000, // 45 seconds for general browser tests
    },
    {
      name: 'firefox',
      use: getProjectConfig('Desktop Firefox'),
      outputDir: './test-results/playwright/firefox',
      testDir: './tests',
      timeout: 45_000,
    },
    {
      name: 'webkit',
      use: getProjectConfig('Desktop Safari'),
      outputDir: './test-results/playwright/webkit',
      testDir: './tests',
      timeout: 45_000,
    },
    {
      name: 'mobile-chrome',
      use: getProjectConfig('Pixel 5'),
      outputDir: './test-results/playwright/mobile-chrome',
      testDir: './tests',
      timeout: 60_000, // Mobile may be slightly slower
    },
    {
      name: 'mobile-safari',
      use: getProjectConfig('iPhone 12'),
      outputDir: './test-results/playwright/mobile-safari',
      testDir: './tests',
      timeout: 60_000,
    },

    // Special purpose projects
    {
      name: 'accessibility',
      use: {
        ...getProjectConfig('Desktop Chrome'),
        colorScheme: 'light',
      },
      testDir: './tests',
      grep: /@accessibility/,
      outputDir: './test-results/playwright/accessibility',
      timeout: 45_000,
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
      timeout: 90_000, // Performance tests may need more time
    },
  ],

  quiet: isCI,

  // ⚡ REPORT SLOW TESTS - Updated threshold to account for new API timeout
  reportSlowTests: { max: 5, threshold: 35_000 }, // UPDATED: Report tests slower than 35 seconds

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
        ['json', { outputFile: './test-results/playwright/results.json' }],
        ['blob', { outputDir: './test-results/playwright/blob-report' }],
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

  retries: isCI ? 2 : 0,
  testDir: './tests',

  // 🚀 DEFAULT TIMEOUT - Increased slightly to accommodate API tests
  timeout: 50_000, // UPDATED: 50 seconds default (was 45 seconds)

  tsconfig: './tsconfig.test.json',

  use: {
    headless: true,
    // ⚡ ACTION TIMEOUT - Increased for better stability
    actionTimeout: 15_000, // UPDATED: 15 seconds for actions (was 10)
    // ⚡ NAVIGATION TIMEOUT - Keep stable
    navigationTimeout: 30_000, // 30 seconds for navigation

    launchOptions: {
      slowMo: isCI ? 50 : 0, // Reduced slow motion for faster tests
    },
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    video: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
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
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: 60_000, // 1 minute to start server
      }
    ),

  globalSetup: isCI ? require.resolve('./tests/utils/global-setup') : undefined,
  globalTeardown:
    isCI ? require.resolve('./tests/utils/global-teardown') : undefined,
});
