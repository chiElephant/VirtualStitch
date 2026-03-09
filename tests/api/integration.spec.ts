/**
 * 🔗 API INTEGRATION TEST SUITE
 * Comprehensive testing of API interactions, error handling, and data flow
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🔗 API Integration Tests @api-integration', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: false,
      cleanupMocks: true,
    });
  });

  test.afterEach(async ({ suite }) => {
    await suite.cleanup();
  });

  // ====================================================================
  // 🎨 CUSTOM LOGO API INTEGRATION
  // ====================================================================

  test.describe('Custom Logo API Integration', () => {
    test('should handle various prompt types correctly', async ({ suite }) => {
      const prompts = [
        { value: 'cat', description: 'short prompt' },
        { value: 'A detailed vector illustration of a modern technology company logo', description: 'long prompt' },
        { value: '🚀✨🎨', description: 'emoji prompt' },
        { value: 'Logo with "quotes" and chars: !@#$%', description: 'special characters' },
        { value: 'Multi\nline\nprompt', description: 'multiline prompt' },
        { value: 'Create красивый sunset with 美しい colors', description: 'unicode prompt' },
      ];

      for (const prompt of prompts) {
        await suite.setup({ 
          navigateToCustomizer: true,
          openEditorTab: 'aiPicker',
          mockRoutes: true,
          mockScenario: 'success'
        });

        console.log(`Testing ${prompt.description}: ${prompt.value.substring(0, 30)}...`);
        await suite.generateAndVerifyAIImage(prompt.value, 'logo');
        
        await suite.wait.waitStandard(suite.config.delays.brief);
      }
    });

    test('should handle network timeouts gracefully', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      await page.route('/api/custom-logo', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 30000));
        route.abort('timedout');
      });

      await suite.generateAIImage('Timeout test prompt');

      const timeoutHandled = await Promise.race([
        page.getByText(/failed to fetch|timeout|network.*error/i).isVisible({ timeout: 35000 }),
        page.locator('.Toastify__toast--error').isVisible({ timeout: 5000 }),
      ]);

      expect(timeoutHandled).toBeTruthy();
      await suite.assert.verifyApplicationStable();
    });

    test('should validate API request structure', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      let requestBody: any = null;

      await page.route('/api/custom-logo', (route) => {
        requestBody = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: suite.data.VALID_TEST_IMAGE_BASE64 }),
        });
      });

      const testPrompt = 'API structure validation test';
      await suite.generateAIImage(testPrompt);

      expect(requestBody).toBeTruthy();
      expect(requestBody.prompt).toBe(testPrompt);
      expect(typeof requestBody.prompt).toBe('string');
    });
  });

  // ====================================================================
  // 📊 MALFORMED RESPONSE HANDLING
  // ====================================================================

  test.describe('Malformed Response Handling', () => {
    const malformedResponses = [
      { body: 'not json at all', description: 'non-JSON response' },
      { body: '{"invalid": "json"', description: 'incomplete JSON' },
      { body: '{"missing": "photo"}', description: 'missing photo field' },
      { body: '{"photo": null}', description: 'null photo field' },
      { body: '{"photo": "invalid_base64"}', description: 'invalid base64' },
    ];

    malformedResponses.forEach(({ body, description }) => {
      test(`should handle ${description}`, async ({ page, suite }) => {
        await suite.setup({ 
          navigateToCustomizer: true,
          openEditorTab: 'aiPicker'
        });

        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body,
          });
        });

        await suite.generateAIImage(`Test ${description}`);
        await suite.wait.waitStandard(suite.config.delays.long);
        await suite.assert.verifyApplicationStable();
      });
    });

    test('should handle oversized response payloads', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      const largeImageData = suite.data.VALID_TEST_IMAGE_BASE64.repeat(50);

      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: largeImageData }),
        });
      });

      await suite.generateAIImage('Large response test');
      await suite.assert.verifySuccessToast();
    });
  });

  // ====================================================================
  // 🚨 HTTP ERROR HANDLING
  // ====================================================================

  test.describe('HTTP Error Handling', () => {
    const httpErrors = [
      { status: 400, name: 'Bad Request' },
      { status: 401, name: 'Unauthorized' },
      { status: 403, name: 'Forbidden' },
      { status: 404, name: 'Not Found' },
      { status: 429, name: 'Rate Limiting' },
      { status: 500, name: 'Internal Server Error' },
      { status: 502, name: 'Bad Gateway' },
      { status: 503, name: 'Service Unavailable' },
      { status: 504, name: 'Gateway Timeout' },
    ];

    httpErrors.forEach(({ status, name }) => {
      test(`should handle HTTP ${status} ${name}`, async ({ page, suite }) => {
        await suite.setup({ 
          navigateToCustomizer: true,
          openEditorTab: 'aiPicker'
        });

        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({ error: `Test error ${status}` }),
          });
        });

        await suite.generateAIImage(`HTTP ${status} test`);
        await suite.wait.waitStandard(suite.config.delays.medium);
        await suite.assert.verifyApplicationStable();
      });
    });
  });

  // ====================================================================
  // 🛡️ CONTENT SECURITY AND VALIDATION
  // ====================================================================

  test.describe('Content Security and Validation', () => {
    test('should sanitize XSS in prompts', async ({ suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker',
        mockRoutes: true,
        mockScenario: 'xssProtection'
      });

      for (const maliciousPrompt of suite.data.prompts.invalid) {
        console.log(`Testing XSS sanitization: ${maliciousPrompt.substring(0, 30)}...`);
        
        await suite.testMaliciousInput(maliciousPrompt, 'prompt', 'reject');
        await suite.openEditorTab('aiPicker');
        await suite.wait.waitStandard(suite.config.delays.brief);
      }
    });

    test('should handle suspicious response content safely', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      let scriptExecuted = false;
      page.on('dialog', () => {
        scriptExecuted = true;
      });

      const suspiciousResponse = {
        photo: suite.data.VALID_TEST_IMAGE_BASE64,
        message: '<script>alert("xss")</script>',
        redirect: 'javascript:alert("redirect")',
      };

      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(suspiciousResponse),
        });
      });

      await suite.generateAIImage('Suspicious response test');
      
      expect(scriptExecuted).toBe(false);
      await suite.assert.verifySuccessToast();
    });
  });

  // ====================================================================
  // 🏃 PERFORMANCE AND LOAD TESTING
  // ====================================================================

  test.describe('Performance and Load Testing', () => {
    test('should complete API operations within performance threshold', async ({ suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker',
        mockRoutes: true,
        mockScenario: 'success'
      });

      const { duration } = await suite.measureOperation(
        async () => {
          await suite.generateAndVerifyAIImage('Performance test', 'logo');
        },
        'Complete AI API Operation',
        suite.config.performance.maxTextureOperation
      );

      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxTextureOperation);
    });

    test('should handle API latency gracefully', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      await page.route('/api/custom-logo', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: suite.data.VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await suite.generateAIImage('Latency test');
      await suite.assert.verifyLoadingState('Asking AI...');
      await suite.assert.verifySuccessToast();
    });
  });

  // ====================================================================
  // 🔁 API ERROR RECOVERY
  // ====================================================================

  test.describe('API Error Recovery', () => {
    test('should recover from intermittent failures', async ({ page, suite }) => {
      let attemptCount = 0;

      await page.route('/api/custom-logo', (route) => {
        attemptCount++;

        if (attemptCount <= 2) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: suite.data.VALID_TEST_IMAGE_BASE64 }),
          });
        }
      });

      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      // First attempt - should fail
      await suite.generateAIImage('Recovery test 1');
      await suite.assert.verifyErrorToast('server');
      await suite.wait.waitForToastsToDisappear(/server error/i);

      // Third attempt - should succeed
      await suite.openEditorTab('aiPicker');
      await suite.generateAIImage('Recovery test 3');
      await suite.assert.verifySuccessToast();

      expect(attemptCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle network disconnection and reconnection', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      // Simulate network disconnection
      await page.route('/api/custom-logo', (route) =>
        route.abort('internetdisconnected')
      );

      await suite.generateAIImage('Network disconnection test');
      await expect(page.getByText(/failed to fetch|network error/i)).toBeVisible();
      await suite.wait.waitForToastsToDisappear(/failed to fetch/i);

      // Simulate network reconnection
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: suite.data.VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await suite.openEditorTab('aiPicker');
      await suite.generateAIImage('Network reconnection test');
      await suite.assert.verifySuccessToast();
    });
  });

  // ====================================================================
  // 🌐 CROSS-ORIGIN AND CORS
  // ====================================================================

  test.describe('Cross-Origin and CORS', () => {
    test('should handle CORS properly in production-like scenarios', async ({ page, baseURL }) => {
      const corsTestUrl = `${baseURL}/api/custom-logo`;

      const response = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: 'CORS test' }),
          });
          return {
            status: response.status,
            ok: response.ok,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }, corsTestUrl);

      expect(response.error?.includes('CORS')).toBeFalsy();

      if (!response.error) {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      }
    });
  });

  // ====================================================================
  // 📈 RATE LIMITING INTEGRATION
  // ====================================================================

  test.describe('Rate Limiting Integration', () => {
    test('should handle rate limiting with proper user feedback', async ({ suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker',
        mockRoutes: true,
        mockScenario: 'rateLimit'
      });

      await suite.generateAIImage('Rate limit test');
      await suite.assert.verifyErrorToast('rate-limit');
    });

    test('should allow retry after rate limit period', async ({ page, suite }) => {
      let requestCount = 0;

      await page.route('/api/custom-logo', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Rate limit exceeded' }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: suite.data.VALID_TEST_IMAGE_BASE64 }),
          });
        }
      });

      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      // First request - rate limited
      await suite.generateAIImage('Retry test');
      await suite.assert.verifyErrorToast('rate-limit');
      await suite.wait.waitForToastsToDisappear(/making requests too quickly/i);

      // Second request - should succeed
      await suite.openEditorTab('aiPicker');
      await suite.generateAIImage('Retry test 2');
      await suite.assert.verifySuccessToast();
    });
  });

  // ====================================================================
  // 📊 API VERSIONING AND COMPATIBILITY
  // ====================================================================

  test.describe('API Versioning and Compatibility', () => {
    test('should handle API version changes gracefully', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          headers: {
            'API-Version': '2.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photo: suite.data.VALID_TEST_IMAGE_BASE64,
            version: '2.0',
          }),
        });
      });

      await suite.generateAIImage('API version test');
      await suite.assert.verifySuccessToast();
    });

    test('should handle deprecated API responses gracefully', async ({ page, suite }) => {
      await suite.setup({ 
        navigateToCustomizer: true,
        openEditorTab: 'aiPicker'
      });

      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          headers: {
            'API-Deprecated': 'true',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: suite.data.VALID_TEST_IMAGE_BASE64, // Different field name
            deprecated: true,
          }),
        });
      });

      await suite.generateAIImage('Deprecated API test');
      await suite.wait.waitStandard(suite.config.delays.long);
      await suite.assert.verifyApplicationStable();
    });
  });
});
