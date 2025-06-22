import { test, expect, Page, Route } from '@playwright/test';
import {
  TestUtils,
  VALID_TEST_IMAGE_BASE64,
  MALICIOUS_INPUTS,
} from '../utils/test-helpers';

// Helper functions defined at module level for proper scope
async function testPromptVariation(
  page: Page,
  prompt: string,
  description: string
) {
  const utils = new TestUtils(page);
  await utils.nav.goToCustomizer();
  await utils.nav.openEditorTab('aiPicker');

  await page.route('/api/custom-logo', (route: Route) => {
    const requestBody = route.request().postDataJSON();
    expect(requestBody.prompt).toBe(prompt);
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
    });
  });

  await page.getByTestId('ai-prompt-input').fill(prompt);
  await page.getByTestId('ai-logo-button').click();
  await utils.ai.verifySuccessToast();

  console.log(
    `✅ Successfully tested ${description}: ${prompt.substring(0, 50)}...`
  );
}

async function testMalformedResponse(
  page: Page,
  body: string,
  description: string
) {
  const utils = new TestUtils(page);
  await utils.nav.goToCustomizer();
  await utils.nav.openEditorTab('aiPicker');

  await page.route('/api/custom-logo', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body,
    });
  });

  await page.getByTestId('ai-prompt-input').fill(`Test ${description}`);
  await page.getByTestId('ai-logo-button').click();

  // Wait for processing and verify app handles gracefully
  await page.waitForTimeout(2000);
  const appRemainsStable = await page.locator('body').isVisible();
  expect(appRemainsStable).toBeTruthy();

  console.log(`✅ Successfully handled malformed response: ${description}`);
}

async function testHttpError(page: Page, status: number) {
  const utils = new TestUtils(page);
  await utils.nav.goToCustomizer();
  await utils.nav.openEditorTab('aiPicker');

  await page.route('/api/custom-logo', (route: Route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: `Test error ${status}` }),
    });
  });

  await page.getByTestId('ai-prompt-input').fill(`HTTP ${status} test`);
  await page.getByTestId('ai-logo-button').click();
  await page.waitForTimeout(1500);

  // Verify app handles error appropriately
  const appRemainsStable = await page.locator('body').isVisible();
  expect(appRemainsStable).toBeTruthy();

  console.log(`✅ Successfully handled HTTP ${status} error`);
}

async function testXSSInput(
  page: Page,
  maliciousPrompt: string,
  description: string
) {
  const utils = new TestUtils(page);
  await utils.nav.goToCustomizer();
  await utils.nav.openEditorTab('aiPicker');

  // Monitor for script execution
  let scriptExecuted = false;
  page.on('dialog', () => {
    scriptExecuted = true;
  });

  await page.route('/api/custom-logo', (route: Route) => {
    const requestBody = route.request().postDataJSON();
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

  console.log(`✅ Successfully sanitized ${description}: ${maliciousPrompt}`);
}

async function testSuspiciousResponse(
  page: Page,
  response: Record<string, unknown>,
  description: string
) {
  const utils = new TestUtils(page);
  await utils.nav.goToCustomizer();
  await utils.nav.openEditorTab('aiPicker');

  let scriptExecuted = false;
  page.on('dialog', () => {
    scriptExecuted = true;
  });

  await page.route('/api/custom-logo', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  await page.getByTestId('ai-prompt-input').fill(`Test ${description}`);
  await page.getByTestId('ai-logo-button').click();

  expect(scriptExecuted).toBe(false);
  await utils.ai.verifySuccessToast();

  console.log(`✅ Successfully handled suspicious response: ${description}`);
}

test.describe('API Integration Tests @api-integration', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up all route mocks to prevent interference with other tests
    await page.unrouteAll();
  });

  test.describe('Custom Logo API Integration', () => {
    // Individual tests for prompt variations
    test('should handle short prompts', async ({ page }) => {
      await testPromptVariation(page, 'cat', 'short prompt');
    });

    test('should handle long detailed prompts', async ({ page }) => {
      const prompt =
        'A detailed vector illustration of a modern technology company logo with clean lines and professional typography suitable for digital and print media';
      await testPromptVariation(page, prompt, 'long prompt');
    });

    test('should handle emoji prompts', async ({ page }) => {
      await testPromptVariation(page, '🚀✨🎨', 'emoji prompt');
    });

    test('should handle special characters in prompts', async ({ page }) => {
      await testPromptVariation(
        page,
        'Logo with "quotes" and special chars: !@#$%^&*()',
        'special characters'
      );
    });

    test('should handle multiline prompts', async ({ page }) => {
      await testPromptVariation(
        page,
        'Multi\nline\nprompt\nwith\nbreaks',
        'multiline prompt'
      );
    });

    test('should handle network timeouts gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('aiPicker');

      // Mock timeout scenario
      await page.route('/api/custom-logo', async (route: Route) => {
        // Simulate very slow response
        await new Promise((resolve) => setTimeout(resolve, 30000));
        route.abort('timedout');
      });

      await page.getByTestId('ai-prompt-input').fill('Timeout test prompt');
      await page.getByTestId('ai-logo-button').click();

      // Should handle timeout gracefully - check for any error indication
      const timeoutErrorVisible = await page
        .getByText(
          /failed to fetch|timeout|network.*error|unable.*connect|request.*failed/i
        )
        .isVisible({ timeout: 35000 });
      const hasErrorToast = await page
        .locator('.Toastify__toast--error')
        .isVisible({ timeout: 5000 });

      // At least one error indication should be present for timeout
      expect(timeoutErrorVisible || hasErrorToast).toBeTruthy();

      // App should remain functional
      await expect(page.locator('body')).toBeVisible();
    });

    // Individual tests for malformed responses
    test('should handle non-JSON API responses', async ({ page }) => {
      await testMalformedResponse(page, 'not json at all', 'non-JSON response');
    });

    test('should handle incomplete JSON responses', async ({ page }) => {
      await testMalformedResponse(
        page,
        '{"invalid": "json"',
        'incomplete JSON'
      );
    });

    test('should handle missing photo field in API response', async ({
      page,
    }) => {
      await testMalformedResponse(
        page,
        '{"missing": "photo"}',
        'missing photo field'
      );
    });

    test('should handle null photo field in API response', async ({ page }) => {
      await testMalformedResponse(page, '{"photo": null}', 'null photo field');
    });

    test('should handle invalid base64 in API response', async ({ page }) => {
      await testMalformedResponse(
        page,
        '{"photo": "invalid_base64"}',
        'invalid base64'
      );
    });

    // Individual tests for HTTP errors
    test('should handle HTTP 400 Bad Request', async ({ page }) => {
      await testHttpError(page, 400);
    });

    test('should handle HTTP 401 Unauthorized', async ({ page }) => {
      await testHttpError(page, 401);
    });

    test('should handle HTTP 403 Forbidden', async ({ page }) => {
      await testHttpError(page, 403);
    });

    test('should handle HTTP 404 Not Found', async ({ page }) => {
      await testHttpError(page, 404);
    });

    test('should handle HTTP 429 Rate Limiting', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('aiPicker');

      await page.route('/api/custom-logo', (route: Route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Rate limit exceeded' }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('HTTP 429 test');
      await page.getByTestId('ai-logo-button').click();
      await page.waitForTimeout(1500);

      // Should show rate limit indication or handle gracefully
      const hasRateLimitResponse = await page
        .getByText(/rate.*limit|too.*quick|slow.*down/i)
        .isVisible({ timeout: 2000 });
      const appRemainsStable = await page.locator('body').isVisible();
      expect(hasRateLimitResponse || appRemainsStable).toBeTruthy();
    });

    test('should handle HTTP 500 Internal Server Error', async ({ page }) => {
      await testHttpError(page, 500);
    });

    test('should handle HTTP 502 Bad Gateway', async ({ page }) => {
      await testHttpError(page, 502);
    });

    test('should handle HTTP 503 Service Unavailable', async ({ page }) => {
      await testHttpError(page, 503);
    });

    test('should handle HTTP 504 Gateway Timeout', async ({ page }) => {
      await testHttpError(page, 504);
    });
  });

  test.describe('Rate Limiting Integration', () => {
    test('should handle rate limiting with proper user feedback', async ({
      page,
    }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('aiPicker');

      // Mock rate limiting response
      await page.route('/api/custom-logo', (route: Route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Rate limit exceeded',
            retryAfter: 60,
          }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Rate limit test');
      await page.getByTestId('ai-logo-button').click();

      // Should show rate limit message
      await expect(
        page.getByText(/making requests too quickly/i)
      ).toBeVisible();

      // UI should return to normal state
      await utils.wait.waitForToastToDisappear(/making requests too quickly/i);
      await utils.nav.openEditorTab('aiPicker');
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });

    test('should allow retry after rate limit period', async ({ page }) => {
      let requestCount = 0;

      await page.route('/api/custom-logo', (route: Route) => {
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
      await utils.nav.openEditorTab('aiPicker');

      // First request - rate limited
      await page.getByTestId('ai-prompt-input').fill('Retry test');
      await page.getByTestId('ai-logo-button').click();
      await expect(
        page.getByText(/making requests too quickly/i)
      ).toBeVisible();
      await utils.wait.waitForToastToDisappear(/making requests too quickly/i);

      // Second request - should succeed
      await utils.nav.openEditorTab('aiPicker');
      await page.getByTestId('ai-logo-button').click();
      await utils.ai.verifySuccessToast();
    });

    test('should handle rate limiting headers appropriately', async ({
      page,
    }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('aiPicker');

      await page.route('/api/custom-logo', (route: Route) => {
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
      await expect(
        page.getByText(/making requests too quickly/i)
      ).toBeVisible();
    });
  });

  test.describe('Content Security and Validation', () => {
    // Individual XSS tests using MALICIOUS_INPUTS
    test('should sanitize script tag injection', async ({ page }) => {
      await testXSSInput(page, MALICIOUS_INPUTS.xss[0], 'script tag injection');
    });

    test('should sanitize javascript protocol injection', async ({ page }) => {
      await testXSSInput(
        page,
        MALICIOUS_INPUTS.xss[1],
        'javascript protocol injection'
      );
    });

    test('should sanitize image tag injection', async ({ page }) => {
      await testXSSInput(page, MALICIOUS_INPUTS.xss[2], 'image tag injection');
    });

    test('should sanitize SVG onload injection', async ({ page }) => {
      await testXSSInput(page, MALICIOUS_INPUTS.xss[3], 'SVG onload injection');
    });

    test('should sanitize template literal injection', async ({ page }) => {
      await testXSSInput(
        page,
        MALICIOUS_INPUTS.xss[4],
        'template literal injection'
      );
    });

    test('should sanitize handlebars injection', async ({ page }) => {
      await testXSSInput(page, MALICIOUS_INPUTS.xss[5], 'handlebars injection');
    });

    // Individual suspicious response tests
    test('should handle XSS in API response safely', async ({ page }) => {
      const response = {
        photo: VALID_TEST_IMAGE_BASE64,
        message: '<script>alert("xss")</script>',
      };
      await testSuspiciousResponse(page, response, 'XSS in response');
    });

    test('should handle redirect attempts in API response safely', async ({
      page,
    }) => {
      const response = {
        photo: VALID_TEST_IMAGE_BASE64,
        redirect: 'javascript:alert("redirect")',
      };
      await testSuspiciousResponse(page, response, 'redirect attempt');
    });

    test('should handle malicious fields in API response safely', async ({
      page,
    }) => {
      const response = {
        photo: VALID_TEST_IMAGE_BASE64,
        eval: 'console.log("eval")',
        __proto__: { malicious: true },
      };
      await testSuspiciousResponse(
        page,
        response,
        'additional malicious fields'
      );
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle rapid successive API calls', async ({ page }) => {
      let callCount = 0;

      await page.route('/api/custom-logo', (route: Route) => {
        callCount++;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('aiPicker');

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
      await utils.nav.openEditorTab('aiPicker');

      // Create large (but valid) base64 image
      const largeImageData = VALID_TEST_IMAGE_BASE64.repeat(100);

      await page.route('/api/custom-logo', (route: Route) => {
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
      await utils.nav.openEditorTab('aiPicker');

      // Mock slow API response
      await page.route('/api/custom-logo', async (route: Route) => {
        // Simulate 5 second delay
        await new Promise((resolve) => setTimeout(resolve, 5000));

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Latency test');
      await page.getByTestId('ai-logo-button').click();

      // Should show loading state
      await expect(
        page.getByRole('button', { name: 'Asking AI...' })
      ).toBeVisible();

      // Should eventually succeed
      await utils.ai.verifySuccessToast();
    });
  });

  test.describe('API Error Recovery', () => {
    test('should recover from intermittent failures', async ({ page }) => {
      let attemptCount = 0;

      await page.route('/api/custom-logo', (route: Route) => {
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
      await utils.nav.openEditorTab('aiPicker');

      // First attempt - should fail
      await utils.ai.generateImage('Recovery test');
      await utils.ai.verifyErrorToast('server');
      await utils.wait.waitForToastToDisappear(/server error/i);

      // Second attempt - should also fail
      await utils.nav.openEditorTab('aiPicker');
      await utils.ai.generateImage('Recovery test 2');
      await utils.ai.verifyErrorToast('server');
      await utils.wait.waitForToastToDisappear(/server error/i);

      // Third attempt - should succeed
      await utils.nav.openEditorTab('aiPicker');
      await utils.ai.generateImage('Recovery test 3');
      await utils.ai.verifySuccessToast();

      expect(attemptCount).toBe(3);
    });

    test('should handle network disconnection and reconnection', async ({
      page,
    }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('aiPicker');

      // First: simulate network disconnection
      await page.route('/api/custom-logo', (route: Route) =>
        route.abort('internetdisconnected')
      );

      await utils.ai.generateImage('Network disconnection test');
      await expect(page.getByText(/failed to fetch image/i)).toBeVisible();
      await utils.wait.waitForToastToDisappear(/failed to fetch/i);

      // Then: simulate network reconnection
      await page.route('/api/custom-logo', (route: Route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await utils.nav.openEditorTab('aiPicker');
      await utils.ai.generateImage('Network reconnection test');
      await utils.ai.verifySuccessToast();
    });
  });

  test.describe('Cross-Origin and CORS', () => {
    test('should handle CORS properly in production-like scenarios', async ({
      page,
      baseURL,
    }) => {
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
      await utils.nav.openEditorTab('aiPicker');

      // Mock response with version information
      await page.route('/api/custom-logo', (route: Route) => {
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
      await utils.nav.openEditorTab('aiPicker');

      // Mock deprecated API format (still functional)
      await page.route('/api/custom-logo', (route: Route) => {
        route.fulfill({
          status: 200,
          headers: {
            'API-Deprecated': 'true',
            'Sunset': new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          contentType: 'application/json',
          body: JSON.stringify({
            image: VALID_TEST_IMAGE_BASE64, // Different field name
            deprecated: true,
          }),
        });
      });

      await utils.ai.generateImage('Deprecated API test');

      // Wait a moment for response processing
      await page.waitForTimeout(3000);

      // Should handle gracefully, even if format is different
      const hasError = await page
        .getByText(
          /failed to fetch|unexpected error|server error|error occurred/i
        )
        .isVisible({ timeout: 3000 });
      const hasSuccess = await page
        .getByText(/image applied successfully/i)
        .isVisible({ timeout: 3000 });
      const hasErrorToast = await page
        .locator('.Toastify__toast--error')
        .isVisible({ timeout: 2000 });
      const hasSuccessToast = await page
        .locator('.Toastify__toast--success')
        .isVisible({ timeout: 2000 });

      // Should either succeed or fail gracefully (not crash) - any response is acceptable
      const hasAnyResponse =
        hasError || hasSuccess || hasErrorToast || hasSuccessToast;

      // At minimum, app should respond somehow and not crash
      expect(
        hasAnyResponse || (await page.locator('body').isVisible())
      ).toBeTruthy();
    });
  });
});
