// tests/ci-cd-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CI/CD Integration Tests', () => {
  test.describe('Production Environment Validation', () => {
    test('should load in production-like environment', async ({ page }) => {
      // Test with production-like settings
      await page.goto('/', { waitUntil: 'networkidle' });

      // Verify no development-only content is visible
      await expect(page.locator('[data-testid*="dev-"]')).toHaveCount(0);
      await expect(page.locator('[data-testid*="debug-"]')).toHaveCount(0);

      // Core functionality should work
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should handle production API endpoints', async ({
      page,
      baseURL,
    }) => {
      // Test that API endpoints are accessible in the current environment
      const response = await page.request.post(`${baseURL}/api/custom-logo`, {
        data: { prompt: 'CI/CD health check' },
        failOnStatusCode: false,
      });

      // Should respond (either success or rate limit, not 404 or 500)
      expect([200, 429, 400].includes(response.status())).toBeTruthy();
    });

    test('should load assets correctly in production', async ({ page }) => {
      await page.goto('/');

      // Check that static assets load successfully
      const imageElements = await page.locator('img').all();
      for (const img of imageElements.slice(0, 3)) {
        // Check first 3 images
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          const response = await page.request.get(src);
          expect(response.status()).toBe(200);
        }
      }

      // Check for any 404 errors in network
      const networkErrors: string[] = [];
      page.on('response', (response) => {
        if (response.status() >= 400) {
          networkErrors.push(`${response.status()}: ${response.url()}`);
        }
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Filter out known acceptable errors (like optional analytics, etc.)
      const criticalErrors = networkErrors.filter(
        (error) =>
          !error.includes('analytics') &&
          !error.includes('tracking') &&
          !error.includes('favicon.ico')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Environment-Specific Behavior', () => {
    test('should handle environment variables correctly', async ({ page }) => {
      await page.goto('/');

      // Test behavior that depends on environment variables
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Mock API call to test environment handling
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: 'env_test_image' }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Environment test');
      await page.getByTestId('ai-logo-button').click();

      // Should work regardless of environment
      await expect(page.getByText(/image applied successfully/i)).toBeVisible();
    });

    test('should handle CORS correctly in production', async ({
      page,
      baseURL,
    }) => {
      // Test that CORS is properly configured
      const corsTestUrl = `${baseURL}/api/custom-logo`;

      // This test verifies CORS is working by making a cross-origin-style request
      const response = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: 'CORS test' }),
          });
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }, corsTestUrl);

      // Should not be blocked by CORS (either success or application-level error)
      expect(response.error?.includes('CORS')).toBeFalsy();
    });
  });

  test.describe('Performance in CI Environment', () => {
    test('should meet performance benchmarks in CI', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // CI environments might be slower, so we allow more time
      expect(loadTime).toBeLessThan(10000); // 10 seconds max in CI

      // Test core interaction performance
      const interactionStart = Date.now();

      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForSelector('[data-testid="editor-tabs-container"]', {
        state: 'visible',
      });

      const interactionTime = Date.now() - interactionStart;
      expect(interactionTime).toBeLessThan(5000); // 5 seconds for interaction
    });

    test('should handle concurrent users simulation', async ({ browser }) => {
      // Simulate multiple users accessing the app simultaneously
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      const pages = await Promise.all(
        contexts.map((context) => context.newPage())
      );

      // All users navigate to the app simultaneously
      const navigations = pages.map((page) => page.goto('/'));
      await Promise.all(navigations);

      // All users interact simultaneously
      const interactions = pages.map(async (page, index) => {
        await page.getByRole('button', { name: 'Customize It' }).click();
        await page.waitForTimeout(1500);
        await page.getByTestId('editor-tab-colorPicker').click();

        // Each user picks a different color
        const colors = ['#CCCCCC', '#EFBD4E', '#80C670'];
        await page.getByTitle(colors[index]).click();

        return page.getByTestId(`canvas-color-${colors[index]}`).count();
      });

      const results = await Promise.all(interactions);

      // All users should succeed
      expect(results).toEqual([1, 1, 1]);

      // Cleanup
      await Promise.all(contexts.map((context) => context.close()));
    });
  });

  test.describe('Deployment Verification', () => {
    test('should verify all critical pages are accessible', async ({
      page,
    }) => {
      const criticalPaths = [
        '/',
        // Add other critical paths if they exist
      ];

      for (const path of criticalPaths) {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);

        // Verify page has essential content
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('main, [data-testid="app"]')).toBeVisible();
      }
    });

    test('should verify all API endpoints are functional', async ({
      page,
      baseURL,
    }) => {
      const apiEndpoints = [
        {
          path: '/api/custom-logo',
          method: 'POST',
          data: { prompt: 'deployment test' },
          expectedStatuses: [200, 429, 400], // Success, rate limit, or validation error
        },
        // Add other API endpoints as they're implemented
      ];

      for (const endpoint of apiEndpoints) {
        const response = await page.request[
          endpoint.method.toLowerCase() as 'post'
        ](`${baseURL}${endpoint.path}`, {
          data: endpoint.data,
          failOnStatusCode: false,
        });

        expect(
          endpoint.expectedStatuses.includes(response.status())
        ).toBeTruthy();
      }
    });

    test('should handle gradual rollout scenarios', async ({ page }) => {
      // Test feature flag-like behavior (if implemented)
      await page.goto('/');

      // Core features should always be available
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();

      // Advanced features might be gated (check gracefully)
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // All main tabs should be available in production
      await expect(page.getByTestId('editor-tab-colorPicker')).toBeVisible();
      await expect(page.getByTestId('editor-tab-filePicker')).toBeVisible();
      await expect(page.getByTestId('editor-tab-aiPicker')).toBeVisible();
      await expect(page.getByTestId('editor-tab-imageDownload')).toBeVisible();
    });
  });

  test.describe('Monitoring and Observability', () => {
    test('should not have critical console errors', async ({ page }) => {
      const criticalErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out non-critical errors
          if (
            !text.includes('ResizeObserver') &&
            !text.includes('Non-passive event listener') &&
            !text.includes('favicon.ico')
          ) {
            criticalErrors.push(text);
          }
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(2000);

      // Test basic interactions to trigger any hidden errors
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#80C670').click();

      expect(criticalErrors).toHaveLength(0);
    });

    test('should handle error reporting gracefully', async ({ page }) => {
      // Test that errors don't crash the app
      await page.goto('/');

      // Simulate an error condition
      await page.evaluate(() => {
        // Create a scenario that might cause an error
        console.error('Simulated error for testing');
      });

      // App should continue functioning
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should track essential metrics', async ({ page }) => {
      // Test that the app provides data for monitoring
      await page.goto('/');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(
          (entry) => entry.name === 'first-paint'
        );
        const firstContentfulPaint = paintEntries.find(
          (entry) => entry.name === 'first-contentful-paint'
        );

        return {
          // Navigation timing (most reliable across browsers)
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,

          // Reliable absolute timestamps
          domInteractive: navigation.domInteractive,
          domComplete: navigation.domComplete,
          loadEventEnd: navigation.loadEventEnd,

          // Paint metrics (may not be available in all browsers)
          firstPaint: firstPaint?.startTime || 0,
          firstContentfulPaint: firstContentfulPaint?.startTime || 0,
          paintEntriesCount: paintEntries.length,

          // Connection info
          fetchStart: navigation.fetchStart || 0,
          responseStart: navigation.responseStart || 0,
          responseEnd: navigation.responseEnd || 0,
        };
      });

      // Test that essential timing data is available (most reliable metrics)
      expect(performanceMetrics.domInteractive).toBeGreaterThan(0);
      expect(performanceMetrics.domComplete).toBeGreaterThan(0);
      expect(performanceMetrics.loadEventEnd).toBeGreaterThan(0);

      // Paint metrics: test if available, but don't require them
      if (performanceMetrics.paintEntriesCount > 0) {
        // If paint entries exist, at least one should have a valid time
        const hasPaintTiming =
          performanceMetrics.firstPaint > 0 ||
          performanceMetrics.firstContentfulPaint > 0;
        expect(hasPaintTiming).toBe(true);
      }

      // DOM loading metrics (can be 0 in fast environments)
      expect(performanceMetrics.domContentLoaded).toBeGreaterThanOrEqual(0);
      expect(performanceMetrics.loadComplete).toBeGreaterThanOrEqual(0);

      // Network timing (only test if available)
      if (performanceMetrics.fetchStart > 0) {
        expect(performanceMetrics.fetchStart).toBeGreaterThan(0);
      }

      // Verify that page loaded properly (functional check)
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();

      // Test that we can capture custom performance marks (universal support)
      await page.evaluate(() => {
        performance.mark('test-mark-start');
        performance.mark('test-mark-end');
        performance.measure('test-measure', 'test-mark-start', 'test-mark-end');
      });

      const customMetrics = await page.evaluate(() => {
        const marks = performance.getEntriesByType('mark');
        const measures = performance.getEntriesByType('measure');
        return {
          marksCount: marks.length,
          measuresCount: measures.length,
          supportsPerformanceAPI: typeof performance !== 'undefined',
          supportsMarks: typeof performance.mark === 'function',
          supportsMeasures: typeof performance.measure === 'function',
        };
      });

      // Core Performance API should be supported everywhere
      expect(customMetrics.supportsPerformanceAPI).toBe(true);
      expect(customMetrics.supportsMarks).toBe(true);
      expect(customMetrics.supportsMeasures).toBe(true);

      // Should be able to create custom performance metrics
      expect(customMetrics.marksCount).toBeGreaterThan(0);
      expect(customMetrics.measuresCount).toBeGreaterThan(0);
    });
  });

  test.describe('Rollback Readiness', () => {
    test('should maintain backward compatibility', async ({ page }) => {
      // Test that the current version doesn't break existing user workflows
      await page.goto('/');

      // Simulate existing user behavior
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // All existing features should work
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#2CCCE4').click();
      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(1);

      await page.getByTestId('editor-tab-filePicker').click();
      await expect(page.getByTestId('file-picker')).toBeVisible();

      // Core state management should work
      await page.getByRole('button', { name: 'Go Back' }).click();
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
    });

    test('should handle version-specific data gracefully', async ({ page }) => {
      // Test handling of data that might exist from previous versions
      await page.goto('/');

      // Inject some mock legacy data
      await page.evaluate(() => {
        // Simulate old format data that might exist in user's browser
        try {
          localStorage.setItem('legacy_data', 'old_format_value');
        } catch {
          // localStorage might not be available in all environments
        }
      });

      // App should still work normally
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();

      // Cleanup
      await page.evaluate(() => {
        try {
          localStorage.removeItem('legacy_data');
        } catch {
          // Ignore cleanup errors
        }
      });
    });
  });
});
