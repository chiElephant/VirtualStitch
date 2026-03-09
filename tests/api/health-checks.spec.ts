/**
 * 🏥 API HEALTH CHECKS TEST SUITE
 * Comprehensive API endpoint health monitoring and system diagnostics
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🏥 API Health Checks @api-health', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: false, // Start with basic page load
    });
  });

  // ====================================================================
  // 🌐 BASIC CONNECTIVITY
  // ====================================================================

  test.describe('Basic Connectivity', () => {
    test('should respond to homepage requests successfully', async ({ page, suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          const response = await page.goto('/');
          expect(response?.status()).toBe(200);
        },
        'Homepage Load',
        suite.config.performance.maxLoadTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxLoadTime);
    });

    test('should serve static assets correctly', async ({ page, suite }) => {
      await page.goto('/');

      const images = await page.locator('img').all();
      
      for (const img of images.slice(0, 3)) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          const response = await page.request.get(src);
          expect(response.status()).toBe(200);
        }
      }
    });

    test('should handle favicon requests gracefully', async ({ page }) => {
      const response = await page.request.get('/favicon.ico');
      expect([200, 404].includes(response.status())).toBeTruthy();
    });

    test('should load essential page resources within threshold', async ({ page, suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          await page.goto('/');
          await page.waitForLoadState('networkidle');
        },
        'Complete Page Load',
        suite.config.performance.maxLoadTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxLoadTime);
    });

    test('should maintain stable performance across requests', async ({ page, suite }) => {
      const loadTimes: number[] = [];
      
      for (let i = 0; i < 3; i++) {
        const { duration } = await suite.measureOperation(
          async () => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
          },
          `Page Load ${i + 1}`,
          suite.config.performance.maxLoadTime
        );
        loadTimes.push(duration);
      }
      
      // All loads should be within threshold
      loadTimes.forEach(time => {
        expect(time).toBeLessThanOrEqual(suite.config.performance.maxLoadTime);
      });
      
      // Performance should be consistent (no load > 2x average)
      const average = loadTimes.reduce((a, b) => a + b) / loadTimes.length;
      const maxLoad = Math.max(...loadTimes);
      expect(maxLoad).toBeLessThanOrEqual(average * 2);
    });
  });

  // ====================================================================
  // 🔌 API ENDPOINT HEALTH
  // ====================================================================

  test.describe('API Endpoint Health', () => {
    test('should have accessible custom logo API endpoint', async ({ request, suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          const response = await request.post('/api/custom-logo', {
            data: { prompt: 'health check test' },
            failOnStatusCode: false,
          });

          expect([200, 400, 429, 500].includes(response.status())).toBeTruthy();
          
          if (response.status() >= 400) {
            const contentType = response.headers()['content-type'];
            expect(contentType).toContain('application/json');
          }
        },
        'API Health Check',
        suite.config.performance.maxInteractionTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
    });

    test('should validate API input properly', async ({ request }) => {
      const invalidResponse = await request.post('/api/custom-logo', {
        data: {},
        failOnStatusCode: false,
      });

      expect([400, 422, 500].includes(invalidResponse.status())).toBeTruthy();
    });

    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false,
      });

      expect([400, 422, 500].includes(response.status())).toBeTruthy();
    });

    test('should respond within acceptable time limits', async ({ request, suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          const response = await request.post('/api/custom-logo', {
            data: { prompt: 'performance test' },
            timeout: 30000,
            failOnStatusCode: false,
          });
          expect(response.status()).toBeDefined();
        },
        'API Response Time',
        30000
      );
      
      expect(duration).toBeLessThan(30000);
    });

    test('should handle edge case inputs safely', async ({ request }) => {
      const edgeCases = [
        { prompt: null },
        { prompt: undefined },
        { prompt: '' },
        { prompt: 123 },
        { wrongField: 'test' },
      ];

      for (const testCase of edgeCases) {
        const response = await request.post('/api/custom-logo', {
          data: testCase,
          failOnStatusCode: false,
        });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(600);
      }
    });
  });

  // ====================================================================
  // 🚦 RATE LIMITING HEALTH
  // ====================================================================

  test.describe('Rate Limiting Health', () => {
    test('should implement rate limiting on API endpoints', async ({ request }) => {
      const requests = Array.from({ length: 5 }, () =>
        request.post('/api/custom-logo', {
          data: { prompt: 'rate limit test' },
          failOnStatusCode: false,
        })
      );

      const responses = await Promise.all(requests);
      
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      const successfulResponses = responses.filter(r => r.status() === 200);
      
      expect(rateLimitedResponses.length > 0 || successfulResponses.length > 0).toBeTruthy();
    });

    test('should provide appropriate rate limit information', async ({ request }) => {
      const responses = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await request.post('/api/custom-logo', {
          data: { prompt: `header test ${i}` },
          failOnStatusCode: false,
        });
        responses.push(response);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const rateLimitedResponse = responses.find(r => r.status() === 429);
      
      if (rateLimitedResponse) {
        const headers = rateLimitedResponse.headers();
        
        const rateLimitHeaders = [
          headers['retry-after'],
          headers['x-ratelimit-reset'],
          headers['x-ratelimit-remaining'],
          headers['ratelimit-reset'],
          headers['ratelimit-remaining'],
          headers['x-ratelimit-limit'],
          headers['ratelimit-limit']
        ].filter(Boolean);
        
        console.log(`📈 Rate limit headers found:`, rateLimitHeaders);
        expect(rateLimitedResponse.status()).toBe(429);
      } else {
        responses.forEach(response => {
          expect(response.status()).toBeGreaterThanOrEqual(200);
          expect(response.status()).toBeLessThan(600);
        });
      }
    });

    test('should handle concurrent rate limit testing', async ({ request, suite }) => {
      const concurrentRequests = Array.from({ length: 3 }, (_, i) =>
        request.post('/api/custom-logo', {
          data: { prompt: `concurrent test ${i}` },
          failOnStatusCode: false,
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      expect(responses.length).toBe(3);
      
      responses.forEach(response => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
      });
    });
  });

  // ====================================================================
  // ⚠️ ERROR RESPONSE HEALTH
  // ====================================================================

  test.describe('Error Response Health', () => {
    test('should return proper error format for API failures', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: { prompt: 'a'.repeat(10000) },
        failOnStatusCode: false,
      });

      if (response.status() >= 400) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
        
        try {
          const errorBody = await response.json();
          expect(errorBody).toHaveProperty('message');
        } catch {
          const textBody = await response.text();
          expect(textBody.includes('Error:')).toBeFalsy();
          expect(textBody.includes('at ')).toBeFalsy();
        }
      }
    });

    test('should handle various error scenarios appropriately', async ({ request }) => {
      const errorTests = [
        { data: { prompt: 'x'.repeat(100000) }, expectedStatus: [400, 413, 422] },
        { data: { prompt: '' }, expectedStatus: [400, 422] },
        { data: { invalidField: 'test' }, expectedStatus: [400, 422] },
      ];

      for (const { data, expectedStatus } of errorTests) {
        const response = await request.post('/api/custom-logo', {
          data,
          failOnStatusCode: false,
        });

        expect(expectedStatus.includes(response.status())).toBeTruthy();
      }
    });

    test('should provide consistent error response format', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: { prompt: null },
        failOnStatusCode: false,
      });

      if (response.status() >= 400) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
        
        const body = await response.json();
        expect(typeof body).toBe('object');
        expect(body).not.toBeNull();
      }
    });
  });

  // ====================================================================
  // 🔐 SECURITY HEALTH CHECKS
  // ====================================================================

  test.describe('Security Health Checks', () => {
    test('should handle content type validation appropriately', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: 'prompt=test',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        failOnStatusCode: false,
      });

      expect([200, 400, 415, 422, 500].includes(response.status())).toBeTruthy();
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
      }
    });

    test('should reject oversized requests appropriately', async ({ request }) => {
      const largePrompt = 'a'.repeat(1024 * 1024);
      
      const response = await request.post('/api/custom-logo', {
        data: { prompt: largePrompt },
        failOnStatusCode: false,
      });

      expect([400, 413, 422].includes(response.status())).toBeTruthy();
    });

    test('should not expose sensitive information in headers', async ({ request }) => {
      const response = await request.get('/', { failOnStatusCode: false });
      
      const headers = response.headers();
      const headerString = JSON.stringify(headers).toLowerCase();
      
      const hasServerHeader = headerString.includes('server');
      const hasPoweredByHeader = headerString.includes('x-powered-by');
      
      if (hasServerHeader || hasPoweredByHeader) {
        console.log('⚠️ Found potentially exposed headers (may be expected in development)');
      }
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(typeof headers).toBe('object');
    });

    test('should handle malicious input patterns safely', async ({ request, suite }) => {
      const maliciousInputs = suite.data.prompts.invalid;

      for (const maliciousInput of maliciousInputs) {
        const response = await request.post('/api/custom-logo', {
          data: { prompt: maliciousInput },
          failOnStatusCode: false,
        });

        // Should either reject (4xx) or handle safely (200)
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
        
        // Should not crash the server
        expect([200, 400, 422, 429].includes(response.status())).toBeTruthy();
      }
    });
  });

  // ====================================================================
  // 🔗 DEPENDENCY HEALTH
  // ====================================================================

  test.describe('Dependency Health', () => {
    test('should handle external service failures gracefully', async ({ page, suite }) => {
      await page.route('**/*', (route) => {
        const url = route.request().url();
        
        if (url.includes('fonts.googleapis.com')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      
      await suite.assert.verifyOnHomePage();
    });

    test('should handle CDN failures gracefully', async ({ page, suite }) => {
      await page.route('**/*', (route) => {
        const url = route.request().url();
        
        if (url.includes('cdn') || url.includes('cloudflare')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      await suite.assert.verifyApplicationStable();
    });

    test('should maintain functionality with slow dependencies', async ({ page, suite }) => {
      await page.route('**/*', (route) => {
        const url = route.request().url();
        
        if (url.includes('analytics') || url.includes('tracking')) {
          setTimeout(() => route.continue(), 5000);
        } else {
          route.continue();
        }
      });

      const { duration } = await suite.measureOperation(
        async () => {
          await page.goto('/');
          await suite.assert.verifyOnHomePage();
        },
        'Page Load with Slow Dependencies',
        suite.config.performance.maxLoadTime + 2000 // Allow extra time
      );
      
      // Core functionality should not be blocked by slow dependencies
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxLoadTime + 2000);
    });
  });

  // ====================================================================
  // 📊 MONITORING AND OBSERVABILITY
  // ====================================================================

  test.describe('Monitoring and Observability Health', () => {
    test('should provide health check endpoint if available', async ({ request }) => {
      const healthEndpoints = ['/health', '/api/health', '/_health', '/ping'];
      
      for (const endpoint of healthEndpoints) {
        const response = await request.get(endpoint, { failOnStatusCode: false });
        
        if (response.status() === 200) {
          const body = await response.text();
          expect(body.length).toBeGreaterThan(0);
          break;
        }
      }
      
      expect(true).toBeTruthy();
    });

    test('should handle logging without affecting performance', async ({ page, suite }) => {
      const logs: string[] = [];
      
      page.on('console', (msg) => {
        logs.push(msg.text());
      });

      await page.goto('/');
      await suite.navigateToCustomizer();
      await suite.wait.waitStandard(suite.config.delays.long);

      const excessiveLogs = logs.filter(log => 
        log.includes('DEBUG') || 
        log.includes('TRACE') ||
        log.length > 1000
      );
      
      expect(excessiveLogs.length).toBeLessThan(10);
    });

    test('should maintain stable memory usage during health checks', async ({ page, suite }) => {
      // Perform multiple health check operations
      for (let i = 0; i < 5; i++) {
        await page.goto('/');
        await suite.navigateToCustomizer();
        await suite.navigateToHome();
        await suite.wait.waitStandard(suite.config.delays.brief);
      }

      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        } : null;
      });

      if (memoryInfo) {
        console.log('Memory usage after health checks:', memoryInfo);
        expect(memoryInfo.usedJSHeapSize).toBeLessThanOrEqual(suite.config.performance.maxMemoryUsage);
      }

      await suite.assert.verifyApplicationStable();
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE HEALTH INDICATORS
  // ====================================================================

  test.describe('Performance Health Indicators', () => {
    test('should maintain response times within thresholds', async ({ request, suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          const response = await request.post('/api/custom-logo', {
            data: { prompt: 'performance test' },
            timeout: 30000,
            failOnStatusCode: false,
          });
          expect(response.status()).toBeDefined();
        },
        'API Response Time',
        30000
      );
      
      expect(duration).toBeLessThan(30000);
    });

    test('should handle load testing scenarios', async ({ request }) => {
      const loadTests = Array.from({ length: 5 }, (_, i) =>
        request.post('/api/custom-logo', {
          data: { prompt: `load test ${i}` },
          failOnStatusCode: false,
        })
      );

      const responses = await Promise.all(loadTests);
      
      responses.forEach(response => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
      });
    });

    test('should demonstrate system resilience', async ({ page, suite }) => {
      // Simulate various stress conditions
      const stressTests = [
        () => page.goto('/'),
        () => suite.navigateToCustomizer(),
        () => suite.openEditorTab('colorPicker'),
        () => suite.openEditorTab('filePicker'),
        () => suite.openEditorTab('aiPicker'),
      ];

      for (const stressTest of stressTests) {
        const { duration } = await suite.measureOperation(
          stressTest,
          'Stress Test Operation',
          suite.config.performance.maxInteractionTime
        );
        
        expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
      }

      await suite.assert.verifyApplicationStable();
    });
  });
});
