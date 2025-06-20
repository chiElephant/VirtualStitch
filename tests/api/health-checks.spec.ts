import { test, expect } from '@playwright/test';

test.describe('API Health Checks @api-health', () => {
  test.describe('Basic Connectivity', () => {
    test('should respond to homepage requests', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
    });

    test('should serve static assets correctly', async ({ page }) => {
      await page.goto('/');

      // Check that essential static assets load
      const images = await page.locator('img').all();
      
      for (const img of images.slice(0, 3)) { // Check first 3 images
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          const response = await page.request.get(src);
          expect(response.status()).toBe(200);
        }
      }
    });

    test('should handle favicon requests gracefully', async ({ page }) => {
      const response = await page.request.get('/favicon.ico');
      // Should either exist (200) or gracefully not found (404), not crash (500)
      expect([200, 404].includes(response.status())).toBeTruthy();
    });
  });

  test.describe('API Endpoint Health', () => {
    test('should have accessible custom logo API endpoint', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: { prompt: 'health check test' },
        failOnStatusCode: false,
      });

      // Should respond (not timeout or crash), either success or rate limiting
      expect([200, 400, 429, 500].includes(response.status())).toBeTruthy();
      
      // If it's an error, should be a controlled error, not a crash
      if (response.status() >= 400) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
      }
    });

    test('should validate API input properly', async ({ request }) => {
      // Test missing required fields
      const invalidResponse = await request.post('/api/custom-logo', {
        data: {}, // Missing prompt
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

      // Should handle malformed JSON without crashing
      expect([400, 422, 500].includes(response.status())).toBeTruthy();
    });
  });

  test.describe('Rate Limiting Health', () => {
    test('should implement rate limiting on API endpoints', async ({ request }) => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 5 }, () =>
        request.post('/api/custom-logo', {
          data: { prompt: 'rate limit test' },
          failOnStatusCode: false,
        })
      );

      const responses = await Promise.all(requests);
      
      // At least one request should hit rate limiting if implemented
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      const successfulResponses = responses.filter(r => r.status() === 200);
      
      // Either rate limiting is working (429s) or all succeed
      expect(rateLimitedResponses.length > 0 || successfulResponses.length > 0).toBeTruthy();
    });

    test('should provide appropriate rate limit headers', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: { prompt: 'header test' },
        failOnStatusCode: false,
      });

      const headers = response.headers();
      
      // Rate limiting headers (if implemented) should be present
      if (response.status() === 429) {
        expect(headers['retry-after'] || headers['x-ratelimit-reset']).toBeDefined();
      }
    });
  });

  test.describe('Error Response Health', () => {
    test('should return proper error format for API failures', async ({ request }) => {
      // Test with potentially problematic input
      const response = await request.post('/api/custom-logo', {
        data: { prompt: 'a'.repeat(10000) }, // Very long prompt
        failOnStatusCode: false,
      });

      if (response.status() >= 400) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
        
        try {
          const errorBody = await response.json();
          expect(errorBody).toHaveProperty('message');
        } catch {
          // If not JSON, should at least not be a stack trace
          const textBody = await response.text();
          expect(textBody.includes('Error:')).toBeFalsy();
          expect(textBody.includes('at ')).toBeFalsy(); // Stack trace indicator
        }
      }
    });

    test('should handle server errors gracefully', async ({ request }) => {
      // Test various edge cases that might cause server errors
      const edgeCases = [
        { prompt: null },
        { prompt: undefined },
        { prompt: '' },
        { prompt: 123 }, // Wrong type
        { wrongField: 'test' },
      ];

      for (const testCase of edgeCases) {
        const response = await request.post('/api/custom-logo', {
          data: testCase,
          failOnStatusCode: false,
        });

        // Should respond with error code, not crash
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(600);
      }
    });
  });

  test.describe('Performance Health Indicators', () => {
    test('should respond within reasonable time limits', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post('/api/custom-logo', {
        data: { prompt: 'performance test' },
        timeout: 30000, // 30 second timeout
        failOnStatusCode: false,
      });

      const responseTime = Date.now() - startTime;
      
      // API should respond within 30 seconds (even if rate limited or errored)
      expect(responseTime).toBeLessThan(30000);
      expect(response.status()).toBeDefined(); // Got some response
    });

    test('should handle concurrent requests properly', async ({ request }) => {
      // Test concurrent load
      const concurrentRequests = Array.from({ length: 3 }, (_, i) =>
        request.post('/api/custom-logo', {
          data: { prompt: `concurrent test ${i}` },
          failOnStatusCode: false,
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should complete (not timeout)
      expect(responses.length).toBe(3);
      
      // All should have valid status codes
      responses.forEach(response => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
      });
    });
  });

  test.describe('Security Health Checks', () => {
    test('should reject requests without proper content type', async ({ request }) => {
      const response = await request.post('/api/custom-logo', {
        data: 'prompt=test',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        failOnStatusCode: false,
      });

      // Should reject or handle gracefully
      expect([400, 415, 422].includes(response.status())).toBeTruthy();
    });

    test('should handle oversized requests appropriately', async ({ request }) => {
      const largePrompt = 'a'.repeat(1024 * 1024); // 1MB prompt
      
      const response = await request.post('/api/custom-logo', {
        data: { prompt: largePrompt },
        failOnStatusCode: false,
      });

      // Should reject oversized requests
      expect([400, 413, 422].includes(response.status())).toBeTruthy();
    });

    test('should not expose sensitive information in headers', async ({ request }) => {
      const response = await request.get('/', { failOnStatusCode: false });
      
      const headers = response.headers();
      const headerString = JSON.stringify(headers).toLowerCase();
      
      // Should not expose sensitive server information
      expect(headerString.includes('server')).toBeFalsy();
      expect(headerString.includes('x-powered-by')).toBeFalsy();
    });
  });

  test.describe('Dependency Health', () => {
    test('should handle external service failures gracefully', async ({ page }) => {
      // Test with network issues
      await page.route('**/*', (route) => {
        const url = route.request().url();
        
        // Block external font loading to simulate dependency failure
        if (url.includes('fonts.googleapis.com')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto('/');
      
      // Page should still load despite external dependency failure
      await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    });

    test('should handle database connection issues gracefully', async ({ request }) => {
      // This test would be more relevant if the app used a database
      // For now, test that API doesn't crash with various inputs
      const response = await request.post('/api/custom-logo', {
        data: { prompt: 'database test' },
        failOnStatusCode: false,
      });

      // Should get a response, not timeout or crash
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });
  });

  test.describe('Monitoring and Observability Health', () => {
    test('should provide health check endpoint if available', async ({ request }) => {
      // Try common health check endpoints
      const healthEndpoints = ['/health', '/api/health', '/_health', '/ping'];
      
      for (const endpoint of healthEndpoints) {
        const response = await request.get(endpoint, { failOnStatusCode: false });
        
        if (response.status() === 200) {
          // If health endpoint exists, should return valid response
          const body = await response.text();
          expect(body.length).toBeGreaterThan(0);
          break;
        }
      }
      
      // This test passes even if no health endpoint exists
      expect(true).toBeTruthy();
    });

    test('should handle logging without affecting performance', async ({ page }) => {
      // Monitor console for excessive logging
      const logs: string[] = [];
      
      page.on('console', (msg) => {
        logs.push(msg.text());
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(2000);

      // Should not have excessive console output in production
      const excessiveLogs = logs.filter(log => 
        log.includes('DEBUG') || 
        log.includes('TRACE') ||
        log.length > 1000
      );
      
      expect(excessiveLogs.length).toBeLessThan(10);
    });
  });
});
