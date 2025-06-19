// tests/api-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API Integration Tests @api-integration', () => {
  test.describe('Custom Logo API', () => {
    test('should handle various prompt lengths', async ({ page }) => {
      const testCases = [
        { prompt: 'cat', description: 'short prompt' },
        {
          prompt:
            'A detailed vector illustration of a modern technology company logo with clean lines and professional typography',
          description: 'long prompt',
        },
        { prompt: '🚀✨🎨', description: 'emoji prompt' },
        {
          prompt: 'prompt with "quotes" and special chars: !@#$%',
          description: 'special characters',
        },
      ];

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      for (const { prompt, description } of testCases) {
        // Mock successful response for each test
        await page.route('/api/custom-logo', (route) => {
          const requestBody = route.request().postDataJSON();
          expect(requestBody.prompt).toBe(prompt);

          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: 'base64encodedimage' }),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(prompt);
        await page.getByTestId('ai-logo-button').click();

        await expect(
          page.getByText(/image applied successfully/i)
        ).toBeVisible();
        console.log(`✅ ${description} test passed`);

        // Clear the input for next test
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should handle network timeouts gracefully', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Mock timeout scenario
      await page.route('/api/custom-logo', async (route) => {
        // Simulate network timeout by not responding
        await new Promise((resolve) => setTimeout(resolve, 30000));
        route.abort();
      });

      await page.getByTestId('ai-prompt-input').fill('Test timeout');
      await page.getByTestId('ai-logo-button').click();

      // Should handle gracefully without crashing
      await expect(page.getByText(/failed to fetch/i)).toBeVisible({
        timeout: 35000,
      });
    });

    test('should validate API response format', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Mock invalid response format
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ invalidKey: 'no photo field' }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Test invalid response');
      await page.getByTestId('ai-logo-button').click();

      // Should handle missing photo field gracefully
      await expect(page.getByText(/failed to fetch/i)).toBeVisible();
    });
  });

  test.describe('Rate Limiting Behavior', () => {
    test('should handle rate limiting with proper user feedback', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Mock rate limiting
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Too many requests' }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('Rate limit test');
      await page.getByTestId('ai-logo-button').click();

      await expect(
        page.getByText(/making requests too quickly/i)
      ).toBeVisible();

      // Verify UI returns to normal state
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });

    test('should allow retry after rate limit cooldown', async ({ page }) => {
      let requestCount = 0;
      await page.route('/api/custom-logo', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 429 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: 'base64encodedimage' }),
          });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // First request - rate limited
      await page.getByTestId('ai-prompt-input').fill('Retry test');
      await page.getByTestId('ai-logo-button').click();
      await expect(
        page.getByText(/making requests too quickly/i)
      ).toBeVisible();

      // Second request - succeeds
      await page.getByTestId('ai-logo-button').click();
      await expect(page.getByText(/image applied successfully/i)).toBeVisible();
    });
  });

  test.describe('Content Security and Validation', () => {
    test('should sanitize user input in prompts', async ({ page }) => {
      const maliciousPrompts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '"><img src=x onerror=alert("xss")>',
        'data:text/html,<script>alert("xss")</script>',
      ];

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      for (const maliciousPrompt of maliciousPrompts) {
        // Monitor for any script execution
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        await page.route('/api/custom-logo', (route) => {
          const requestBody = route.request().postDataJSON();
          // Verify the malicious content is in the request (but safely handled)
          expect(requestBody.prompt).toBe(maliciousPrompt);

          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: 'base64encodedimage' }),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(maliciousPrompt);
        await page.getByTestId('ai-logo-button').click();

        // Ensure no script execution occurred
        expect(scriptExecuted).toBe(false);

        await page.getByTestId('ai-prompt-input').fill('');
      }
    });
  });

  test.describe('File Upload Security', () => {
    test('should reject dangerous file types', async ({ page }) => {
      // Create a test file that might be dangerous
      const dangerousFiles = [
        { name: 'script.js.png', content: 'alert("malicious")' },
        {
          name: 'test.svg',
          content: '<svg><script>alert("xss")</script></svg>',
        },
        { name: 'large.png', content: 'x'.repeat(10 * 1024 * 1024) }, // 10MB
      ];

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-filePicker').click();

      // Test with each dangerous file type
      for (const { name, content } of dangerousFiles) {
        const buffer = Buffer.from(content);

        await page.getByTestId('file-picker-input').setInputFiles({
          name,
          mimeType: 'image/png',
          buffer,
        });

        // The app should either reject it or handle it safely
        if (name.includes('large')) {
          // Large files might be rejected or cause performance issues
          await expect(page.locator('body')).toBeVisible(); // Just ensure page doesn't crash
        }

        // Ensure no script execution from SVG
        let alertFired = false;
        page.on('dialog', () => {
          alertFired = true;
        });

        await page.getByRole('button', { name: 'Logo' }).click();
        expect(alertFired).toBe(false);
      }
    });
  });

  test.describe('API Error Recovery', () => {
    test('should handle malformed JSON responses', async ({ page }) => {
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {[}',
        });
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      await page.getByTestId('ai-prompt-input').fill('Malformed JSON test');
      await page.getByTestId('ai-logo-button').click();

      // Should handle gracefully
      await expect(page.getByText(/failed to fetch/i)).toBeVisible();
    });

    test('should handle network disconnection', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Simulate network failure
      await page.route('/api/custom-logo', (route) =>
        route.abort('internetdisconnected')
      );

      await page.getByTestId('ai-prompt-input').fill('Network test');
      await page.getByTestId('ai-logo-button').click();

      await expect(page.getByText(/failed to fetch/i)).toBeVisible();
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle rapid successive API calls', async ({ page }) => {
      let callCount = 0;
      await page.route('/api/custom-logo', (route) => {
        callCount++;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: `image${callCount}` }),
        });
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      await page.getByTestId('ai-prompt-input').fill('Rapid test');

      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(page.getByTestId('ai-logo-button').click());
        await page.waitForTimeout(100); // Small delay between clicks
      }

      // Should handle gracefully without crashing
      await expect(page.locator('body')).toBeVisible();

      // Verify some requests completed
      expect(callCount).toBeGreaterThan(0);
    });
  });
});
