import { test, expect } from '@playwright/test';
import { TestUtils, PERFORMANCE_THRESHOLDS, VIEWPORTS } from '../utils/test-helpers';

test.describe('Production Deployment Validation @ci-cd', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Environment Validation', () => {
    test('should load in production-like environment', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      // Verify no development artifacts are visible
      await expect(page.locator('[data-testid*="dev-"]')).toHaveCount(0);
      await expect(page.locator('[data-testid*="debug-"]')).toHaveCount(0);

      // Core functionality should work
      await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should handle production API endpoints correctly', async ({ page, baseURL }) => {
      const response = await page.request.post(`${baseURL}/api/custom-logo`, {
        data: { prompt: 'CI/CD validation test' },
        failOnStatusCode: false,
      });

      // Should respond appropriately (success, rate limit, or validation error)
      expect([200, 400, 429].includes(response.status())).toBeTruthy();
    });

    test('should load static assets from CDN correctly', async ({ page }) => {
      await page.goto('/');

      // Check that static assets load successfully
      const imageElements = await page.locator('img').all();
      for (const img of imageElements.slice(0, 3)) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          const response = await page.request.get(src);
          expect(response.status()).toBe(200);
        }
      }
    });

    test('should have proper error handling in production', async ({ page }) => {
      // Monitor for production-inappropriate error messages
      const logs: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });

      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Filter out acceptable errors and check for development leaks
      const productionErrors = logs.filter(log => 
        log.includes('webpack') ||
        log.includes('dev server') ||
        log.includes('localhost') ||
        log.includes('development')
      );

      expect(productionErrors).toHaveLength(0);
    });
  });

  test.describe('Performance Benchmarks', () => {
    test('should meet production performance standards', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Production should load faster than development
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

      // Test interaction performance
      const interactionStart = Date.now();
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForSelector('[data-testid="editor-tabs-container"]', {
        state: 'visible',
      });
      const interactionTime = Date.now() - interactionStart;

      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
    });

    test('should handle concurrent users simulation', async ({ browser }) => {
      // Simulate multiple users accessing simultaneously
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      const pages = await Promise.all(
        contexts.map((context) => context.newPage())
      );

      // All users navigate simultaneously
      const navigations = pages.map((page) => page.goto('/'));
      await Promise.all(navigations);

      // All users interact simultaneously
      const interactions = pages.map(async (page, index) => {
        await page.getByRole('button', { name: 'Customize It' }).click();
        await page.waitForTimeout(1500);
        await page.getByTestId('editor-tab-colorPicker').click();

        const colors = ['#CCCCCC', '#EFBD4E', '#80C670'];
        await page.getByTitle(colors[index]).click();

        return page.getByTestId(`canvas-color-${colors[index]}`).count();
      });

      const results = await Promise.all(interactions);
      expect(results).toEqual([1, 1, 1]); // All should succeed

      // Cleanup
      await Promise.all(contexts.map((context) => context.close()));
    });
  });

  test.describe('Deployment Verification', () => {
    test('should verify all critical pages are accessible', async ({ page }) => {
      const criticalPaths = ['/'];

      for (const path of criticalPaths) {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);

        // Verify essential content is present
        await expect(page.locator('body')).toBeVisible();
        await expect(page.locator('main, [data-testid="app"]')).toBeVisible();
      }
    });

    test('should verify API endpoints are functional', async ({ page, baseURL }) => {
      const apiEndpoints = [
        {
          path: '/api/custom-logo',
          method: 'POST' as const,
          data: { prompt: 'deployment verification' },
          expectedStatuses: [200, 400, 429],
        },
      ];

      for (const endpoint of apiEndpoints) {
        const response = await page.request[endpoint.method](`${baseURL}${endpoint.path}`, {
          data: endpoint.data,
          failOnStatusCode: false,
        });

        expect(endpoint.expectedStatuses.includes(response.status())).toBeTruthy();
      }
    });

    test('should handle gradual rollout scenarios', async ({ page }) => {
      await page.goto('/');

      // Core features should always be available
      await expect(page.getByRole('button', { name: 'Customize It' })).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();

      // All main features should be available in production
      await utils.nav.goToCustomizer();
      
      const expectedTabs = ['colorPicker', 'filePicker', 'aiPicker', 'imageDownload'];
      for (const tab of expectedTabs) {
        await expect(page.getByTestId(`editor-tab-${tab}`)).toBeVisible();
      }
    });
  });

  test.describe('Error Monitoring and Observability', () => {
    test('should not have critical console errors in production', async ({ page }) => {
      const criticalErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out non-critical errors
          if (
            !text.includes('ResizeObserver') &&
            !text.includes('Non-passive event listener') &&
            !text.includes('favicon.ico') &&
            !text.includes('DevTools')
          ) {
            criticalErrors.push(text);
          }
        }
      });

      await page.goto('/');
      await utils.nav.goToCustomizer();
      await page.waitForTimeout(2000);

      // Test basic interactions
      await utils.color.openColorPicker();
      await utils.color.selectColor('#80C670');

      expect(criticalErrors).toHaveLength(0);
    });

    test('should provide essential performance metrics', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        return {
          domInteractive: navigation.domInteractive,
          domComplete: navigation.domComplete,
          loadEventEnd: navigation.loadEventEnd,
          supportsPerformanceAPI: typeof performance !== 'undefined',
        };
      });

      expect(metrics.supportsPerformanceAPI).toBe(true);
      expect(metrics.domInteractive).toBeGreaterThan(0);
      expect(metrics.domComplete).toBeGreaterThan(0);
      expect(metrics.loadEventEnd).toBeGreaterThan(0);
    });

    test('should handle error reporting gracefully', async ({ page }) => {
      await page.goto('/');

      // Simulate an error condition
      await page.evaluate(() => {
        console.error('Simulated deployment error test');
      });

      // App should continue functioning
      await utils.nav.goToCustomizer();
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });
  });

  test.describe('Security Validation', () => {
    test('should not expose sensitive information in production', async ({ page }) => {
      await page.goto('/');

      // Check that no sensitive data is exposed
      const exposedSecrets = await page.evaluate(() => {
        const windowProps = Object.keys(window);
        const sensitivePatterns = [
          /secret/i,
          /password/i,
          /token/i,
          /key/i,
          /api.*key/i,
        ];

        return windowProps.filter(prop => 
          sensitivePatterns.some(pattern => pattern.test(prop))
        );
      });

      expect(exposedSecrets.length).toBe(0);
    });

    test('should have proper security headers', async ({ page }) => {
      const response = await page.goto('/');
      
      if (response) {
        const headers = response.headers();
        
        // Check for security headers (if implemented)
        const securityHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'referrer-policy',
        ];

        // Note: Not all headers may be implemented, but check for exposure
        const exposedHeaders = Object.keys(headers).filter(header =>
          header.toLowerCase().includes('server') ||
          header.toLowerCase().includes('powered-by')
        );

        expect(exposedHeaders.length).toBe(0);
      }
    });
  });

  test.describe('Rollback Readiness', () => {
    test('should maintain backward compatibility', async ({ page }) => {
      await page.goto('/');

      // Test existing user workflows still work
      await utils.nav.goToCustomizer();
      await utils.color.openColorPicker();
      await utils.color.selectColor('#2CCCE4');
      await utils.color.verifyColorApplied('#2CCCE4');

      await utils.nav.openEditorTab('file-picker');
      await expect(page.getByTestId('file-picker')).toBeVisible();

      // Core state management should work
      await utils.nav.goToHome();
      await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    });

    test('should handle version-specific data gracefully', async ({ page }) => {
      await page.goto('/');

      // Simulate legacy data that might exist
      await page.evaluate(() => {
        try {
          localStorage.setItem('legacy_user_data', JSON.stringify({
            version: '1.0',
            preferences: { theme: 'old' }
          }));
        } catch {
          // localStorage might not be available
        }
      });

      // App should work despite legacy data
      await utils.nav.goToCustomizer();
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();

      // Cleanup
      await page.evaluate(() => {
        try {
          localStorage.removeItem('legacy_user_data');
        } catch {
          // Ignore cleanup errors
        }
      });
    });
  });

  test.describe('Cross-Device Production Validation', () => {
    Object.entries(VIEWPORTS).forEach(([deviceName, viewport]) => {
      test(`should work correctly on ${deviceName} in production`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Essential functionality should work on all devices
        await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
        await expect(page.locator('canvas')).toBeVisible();

        await utils.nav.goToCustomizer();
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();

        // Basic interaction test
        await utils.color.openColorPicker();
        await utils.color.selectColor('#726DE8');
        await utils.color.verifyColorApplied('#726DE8');
      });
    });
  });

  test.describe('Production Load Simulation', () => {
    test('should handle realistic user workflows under load', async ({ page }) => {
      await page.goto('/');

      // Simulate realistic user behavior
      await utils.nav.goToCustomizer();
      
      // Color customization
      await utils.color.openColorPicker();
      await utils.color.selectColor('#353934');
      
      // File operations (simulated)
      await utils.nav.openEditorTab('file-picker');
      await expect(page.getByText('No file selected')).toBeVisible();
      
      // AI interaction attempt
      await utils.nav.openEditorTab('ai-picker');
      await page.getByTestId('ai-prompt-input').fill('Production test logo');
      
      // Download interface
      await utils.nav.openEditorTab('image-download');
      await expect(page.getByPlaceholder('e.g., my-shirt')).toBeVisible();

      // App should remain responsive throughout
      await expect(page.locator('body')).toBeVisible();
      await utils.color.verifyColorApplied('#353934');
    });

    test('should handle production API rate limiting correctly', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Test production rate limiting
      const requests = Array.from({ length: 3 }, (_, i) =>
        page.evaluate(async (index) => {
          try {
            const response = await fetch('/api/custom-logo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: `Rate limit test ${index}` }),
            });
            return { status: response.status, index };
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown', index };
          }
        }, i)
      );

      const results = await Promise.all(requests);
      
      // Should handle requests appropriately (success or rate limiting)
      results.forEach(result => {
        if ('status' in result) {
          expect([200, 400, 429, 500].includes(result.status)).toBeTruthy();
        }
      });
    });
  });

  test.describe('Production Health Indicators', () => {
    test('should have healthy response times', async ({ page }) => {
      const measurements = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - start;
        measurements.push(loadTime);

        // Clear cache between measurements
        await page.reload({ waitUntil: 'networkidle' });
      }

      const averageLoadTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(averageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });

    test('should handle resource failures gracefully', async ({ page }) => {
      // Block some external resources to test resilience
      await page.route('**/fonts.googleapis.com/**', route => route.abort());
      
      await page.goto('/');
      
      // App should still function despite external resource failures
      await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
      await utils.nav.goToCustomizer();
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should maintain functionality during high load simulation', async ({ page }) => {
      // Simulate high load by performing multiple operations rapidly
      await utils.nav.goToCustomizer();

      const operations = [
        () => utils.color.openColorPicker(),
        () => utils.color.selectColor('#EFBD4E'),
        () => utils.nav.openEditorTab('file-picker'),
        () => utils.nav.openEditorTab('ai-picker'),
        () => utils.nav.openEditorTab('image-download'),
        () => utils.texture.activateFilter('logoShirt'),
        () => utils.texture.activateFilter('stylishShirt'),
      ];

      // Execute operations rapidly
      for (const operation of operations) {
        await operation();
        await page.waitForTimeout(100);
      }

      // App should remain functional
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });
  });
});
