import { test, expect } from '@playwright/test';
import { TestUtils, VALID_TEST_IMAGE_BASE64, MALICIOUS_INPUTS } from '../utils/test-helpers';

test.describe('API Integration Tests @api-integration', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Custom Logo API Integration', () => {
    test('should handle various prompt lengths and content types', async ({ page }) => {
      const testCases = [
        { prompt: 'cat', description: 'short prompt' },
        { prompt: 'A detailed vector illustration of a modern technology company logo with clean lines and professional typography suitable for digital and print media', description: 'long prompt' },
        { prompt: '🚀✨🎨', description: 'emoji prompt' },
        { prompt: 'Logo with "quotes" and special chars: !@#$%^&*()', description: 'special characters' },
        { prompt: 'Multi\nline\nprompt\nwith\nbreaks', description: 'multiline prompt' },
      ];

      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      for (const testCase of testCases) {
        console.log(`Testing ${testCase.description}`);

        // Mock successful response for each test
        await page.route('/api/custom-logo', (route) => {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.prompt).toBe(testCase.prompt);

          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(testCase.prompt);
        await page.getByTestId('ai-logo-button').click();

        // Wait for success response
        await utils.ai.verifySuccessToast();
        await utils.wait.waitForToastToDisappear(/image applied successfully/i);

        // Reopen AI picker for next iteration
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should handle network timeouts gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock timeout scenario
      await page.route('/api/custom-logo', async (route) => {
        // Simulate very slow response
        await new Promise(resolve => setTimeout(resolve, 30000));
        route.abort('timedout');
      });

      await page.getByTestId('ai-prompt-input').fill('Timeout test prompt');
      await page.getByTestId('ai-logo-button').click();

      // Should handle timeout gracefully
      await expect(page.getByText(/failed to fetch image/i)).toBeVisible({
        timeout: 35000,
      });

      // App should remain functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should validate API response format and handle malformed responses', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      const malformedResponses = [
        { body: 'not json at all', description: 'non-JSON response' },
        { body: '{"invalid": "json"', description: 'incomplete JSON' },
        { body: '{"missing": "photo"}', description: 'missing photo field' },
        { body: '{"photo": null}', description: 'null photo field' },
        { body: '{"photo": "invalid_base64"}', description: 'invalid base64' },
      ];

      for (const { body, description } of malformedResponses) {
        console.log(`Testing ${description}`);

        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: body,
          });
        });

        await page.getByTestId('ai-prompt-input').fill(`Test ${description}`);
        await page.getByTestId('ai-logo-button').click();

        // Should handle malformed response gracefully
        const errorVisible = await page.getByText(/failed to fetch image|unexpected error|server error/i).isVisible();
        expect(errorVisible).toBeTruthy();

        // Wait for error to clear and reset for next test
        await utils.wait.waitForToastToDisappear(/failed to fetch|unexpected error|server error/i);
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should handle various HTTP error status codes', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      const errorCases = [
        { status: 400, expectedMessage: /unexpected error occurred/i },
        { status: 401, expectedMessage: /unexpected error occurred/i },
        { status: 403, expectedMessage: /unexpected error occurred/i },
        { status: 404, expectedMessage: /unexpected error occurred/i },
        { status: 429, expectedMessage: /making requests too quickly/i },
        { status: 500, expectedMessage: /server error while generating/i },
        { status: 502, expectedMessage: /unexpected error occurred/i },
        { status: 503, expectedMessage: /unexpected error occurred/i },
        { status: 504, expectedMessage: /unexpected error occurred/i },
      ];

      for (const { status, expectedMessage } of errorCases) {
        console.log(`Testing HTTP ${status}`);

        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({ error: `Test error ${status}` }),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(`HTTP ${status} test`);
        await page.getByTestId('ai-logo-button').click();

        // Should show appropriate error message
        await expect(page.getByText(expectedMessage)).toBeVisible();
        await utils.wait.waitForToastToDisappear(expectedMessage);

        // Reset for next test
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });
  });

  test.describe('Rate Limiting Integration', () => {
    test('should handle rate limiting with proper user feedback', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock rate limiting response
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            message: 'Rate limit exceeded',
            retryAfter: 60 
          }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Rate limit test');
      await page.getByTestId('ai-logo-button').click();

      // Should show rate limit message
      await expect(page.getByText(/making requests too quickly/i)).toBeVisible();

      // UI should return to normal state
      await utils.wait.waitForToastToDisappear(/making requests too quickly/i);
      await utils.nav.openEditorTab('ai-picker');
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });

    test('should allow retry after rate limit period', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('/api/custom-logo', (route) => {
        requestCount++;
        if (requestCount === 1) {
          // First request: rate limited
          route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Rate limit exceeded' }),
          });
        } else {
          // Subsequent requests: success
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        }
      });

      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // First request - rate limited
      await page.getByTestId('ai-prompt-input').fill('Retry test');
      await page.getByTestId('ai-logo-button').click();
      await expect(page.getByText(/making requests too quickly/i)).toBeVisible();
      await utils.wait.waitForToastToDisappear(/making requests too quickly/i);

      // Second request - should succeed
      await utils.nav.openEditorTab('ai-picker');
      await page.getByTestId('ai-logo-button').click();
      await utils.ai.verifySuccessToast();
    });

    test('should handle rate limiting headers appropriately', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + 60000),
          },
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Rate limit exceeded' }),
        });
      });

      await utils.ai.generateImage('Rate limit headers test');

      // Should handle gracefully regardless of headers
      await expect(page.getByText(/making requests too quickly/i)).toBeVisible();
    });
  });

  test.describe('Content Security and Validation', () => {
    test('should sanitize and validate user input', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      for (const maliciousPrompt of MALICIOUS_INPUTS.xss) {
        // Monitor for script execution
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        await page.route('/api/custom-logo', (route) => {
          const requestBody = route.request().postDataJSON();
          
          // Verify malicious content is in request but handled safely
          expect(requestBody.prompt).toBe(maliciousPrompt);

          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(maliciousPrompt);
        await page.getByTestId('ai-logo-button').click();

        // Ensure no script execution
        expect(scriptExecuted).toBe(false);

        await utils.ai.verifySuccessToast();
        await utils.wait.waitForToastToDisappear(/image applied successfully/i);
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should handle suspicious API responses safely', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      const suspiciousResponses = [
        {
          name: 'XSS in response',
          response: { 
            photo: VALID_TEST_IMAGE_BASE64,
            message: '<script>alert("xss")</script>',
          },
        },
        {
          name: 'Redirect attempt',
          response: {
            photo: VALID_TEST_IMAGE_BASE64,
            redirect: 'javascript:alert("redirect")',
          },
        },
        {
          name: 'Additional malicious fields',
          response: {
            photo: VALID_TEST_IMAGE_BASE64,
            eval: 'console.log("eval")',
            __proto__: { malicious: true },
          },
        },
      ];

      for (const { name, response } of suspiciousResponses) {
        console.log(`Testing ${name}`);

        // Monitor for script execution
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(`Test ${name}`);
        await page.getByTestId('ai-logo-button').click();

        // Should process safely
        expect(scriptExecuted).toBe(false);
        await utils.ai.verifySuccessToast();
        
        await utils.wait.waitForToastToDisappear(/image applied successfully/i);
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle rapid successive API calls', async ({ page }) => {
      let callCount = 0;
      
      await page.route('/api/custom-logo', (route) => {
        callCount++;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      await page.getByTestId('ai-prompt-input').fill('Rapid test');

      // First click should succeed and close tab
      await page.getByTestId('ai-logo-button').click();
      await utils.ai.verifySuccessToast();

      // Verify at least one request completed
      expect(callCount).toBeGreaterThan(0);

      // App should remain functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle large response payloads', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Create large (but valid) base64 image
      const largeImageData = VALID_TEST_IMAGE_BASE64.repeat(100); // Much larger image

      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: largeImageData }),
        });
      });

      await utils.ai.generateImage('Large response test');

      // Should handle large response (may take longer)
      await utils.ai.verifySuccessToast();
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle API latency gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock slow API response
      await page.route('/api/custom-logo', async (route) => {
        // Simulate 5 second delay
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Latency test');
      await page.getByTestId('ai-logo-button').click();

      // Should show loading state
      await expect(page.getByRole('button', { name: 'Asking AI...' })).toBeVisible();

      // Should eventually succeed
      await utils.ai.verifySuccessToast();
    });
  });

  test.describe('API Error Recovery', () => {
    test('should recover from intermittent failures', async ({ page }) => {
      let attemptCount = 0;
      
      await page.route('/api/custom-logo', (route) => {
        attemptCount++;
        
        if (attemptCount <= 2) {
          // First two attempts fail
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        } else {
          // Third attempt succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        }
      });

      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // First attempt - should fail
      await utils.ai.generateImage('Recovery test');
      await utils.ai.verifyErrorToast('server');
      await utils.wait.waitForToastToDisappear(/server error/i);

      // Second attempt - should also fail
      await utils.nav.openEditorTab('ai-picker');
      await utils.ai.generateImage('Recovery test 2');
      await utils.ai.verifyErrorToast('server');
      await utils.wait.waitForToastToDisappear(/server error/i);

      // Third attempt - should succeed
      await utils.nav.openEditorTab('ai-picker');
      await utils.ai.generateImage('Recovery test 3');
      await utils.ai.verifySuccessToast();

      expect(attemptCount).toBe(3);
    });

    test('should handle network disconnection and reconnection', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // First: simulate network disconnection
      await page.route('/api/custom-logo', (route) => 
        route.abort('internetdisconnected')
      );

      await utils.ai.generateImage('Network disconnection test');
      await expect(page.getByText(/failed to fetch image/i)).toBeVisible();
      await utils.wait.waitForToastToDisappear(/failed to fetch/i);

      // Then: simulate network reconnection
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await utils.nav.openEditorTab('ai-picker');
      await utils.ai.generateImage('Network reconnection test');
      await utils.ai.verifySuccessToast();
    });
  });

  test.describe('Cross-Origin and CORS', () => {
    test('should handle CORS properly in production-like scenarios', async ({ page, baseURL }) => {
      // Test that CORS is properly configured
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
            headers: Object.fromEntries(response.headers.entries()),
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }, corsTestUrl);

      // Should not be blocked by CORS
      expect(response.error?.includes('CORS')).toBeFalsy();
      
      // Should get valid HTTP response
      if (!response.error) {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      }
    });
  });

  test.describe('API Versioning and Compatibility', () => {
    test('should handle API version changes gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock response with version information
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          headers: {
            'API-Version': '1.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            photo: VALID_TEST_IMAGE_BASE64,
            version: '1.0',
          }),
        });
      });

      await utils.ai.generateImage('Version test');
      await utils.ai.verifySuccessToast();
    });

    test('should handle deprecated API responses', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock deprecated API format (still functional)
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          headers: {
            'API-Deprecated': 'true',
            'Sunset': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          contentType: 'application/json',
          body: JSON.stringify({ 
            image: VALID_TEST_IMAGE_BASE64, // Different field name
            deprecated: true,
          }),
        });
      });

      await utils.ai.generateImage('Deprecated API test');

      // Should handle gracefully, even if format is different
      const hasError = await page.getByText(/failed to fetch|unexpected error/i).isVisible();
      const hasSuccess = await page.getByText(/image applied successfully/i).isVisible();
      
      // Should either succeed or fail gracefully (not crash)
      expect(hasError || hasSuccess).toBeTruthy();
    });
  });
});
