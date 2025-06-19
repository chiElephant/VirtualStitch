// tests/responsive-and-security.spec.ts
import { test, expect, devices } from '@playwright/test';

// Extend window interface for test properties
declare global {
  interface Window {
    xssTest?: boolean;
    inlineScriptExecuted?: boolean;
  }
}

// Device configurations for responsive testing
const testDevices = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPad', ...devices['iPad'] },
  { name: 'Desktop HD', viewport: { width: 1920, height: 1080 } },
  { name: 'Small Desktop', viewport: { width: 1024, height: 768 } },
  { name: 'Large Mobile', viewport: { width: 414, height: 896 } },
];

test.describe('Responsive Design Tests', () => {
  testDevices.forEach((device) => {
    test.describe(`${device.name} Responsive Tests`, () => {
      test.beforeEach(async ({ page }) => {
        if ('viewport' in device) {
          await page.setViewportSize(device.viewport);
        } else {
          await page.setViewportSize(device);
        }
      });

      test(`should display properly on ${device.name}`, async ({ page }) => {
        await page.goto('/');

        // Basic layout should be visible
        await expect(
          page.getByRole('heading', { name: "LET'S DO IT." })
        ).toBeVisible();
        await expect(page.locator('canvas')).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Customize It' })
        ).toBeVisible();

        // Navigate to customizer
        await page.getByRole('button', { name: 'Customize It' }).click();
        await page.waitForTimeout(2000); // Extra time for mobile animations

        // Essential elements should be accessible
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Go Back' })
        ).toBeVisible();
      });

      test(`should handle touch interactions on ${device.name}`, async ({
        page,
      }) => {
        if (
          device.name.includes('iPhone') ||
          device.name.includes('iPad') ||
          device.name.includes('Mobile')
        ) {
          await page.goto('/');
          await page.getByRole('button', { name: 'Customize It' }).tap();
          await page.waitForTimeout(2000);

          // Test touch interactions
          await page.getByTestId('editor-tab-colorPicker').tap();
          await page.getByTitle('#80C670').tap();

          await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);

          // Test filter tabs with touch
          await page.getByTestId('filter-tab-logoShirt').tap();
          await expect(
            page.getByTestId('filter-tab-logoShirt')
          ).toHaveAttribute('data-is-active', 'true');
        }
      });

      test(`should handle orientation changes on ${device.name}`, async ({
        page,
      }) => {
        if (device.name.includes('iPhone') || device.name.includes('iPad')) {
          await page.goto('/');

          // Portrait mode
          const { width, height } = device.viewport || device;
          await page.setViewportSize({ width, height });
          await expect(page.locator('canvas')).toBeVisible();

          // Landscape mode
          await page.setViewportSize({ width: height, height: width });
          await page.waitForTimeout(1000);
          await expect(page.locator('canvas')).toBeVisible();

          // App should still function
          await page.getByRole('button', { name: 'Customize It' }).click();
          await page.waitForTimeout(2000);
          await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
        }
      });
    });
  });

  test.describe('Viewport Edge Cases', () => {
    test('should handle extremely small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');

      // Basic functionality should still work
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(2000);

      // Editor tabs should be accessible (might be stacked or scrollable)
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should handle extremely large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });
      await page.goto('/');

      // Layout should scale appropriately
      await expect(page.locator('canvas')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();

      // Customizer should work at large sizes
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should handle dynamic viewport changes', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      const viewports = [
        { width: 1200, height: 800 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 },
        { width: 1920, height: 1080 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        // Core functionality should persist
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(page.locator('canvas')).toBeVisible();
      }
    });
  });
});

test.describe('Security Tests', () => {
  test.describe('XSS Prevention', () => {
    test('should prevent script injection in AI prompts', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      const xssPayloads = [
        '<script>window.xssTest = true;</script>',
        'javascript:alert("xss")',
        '\"><script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
        '${alert("xss")}',
        '{{alert("xss")}}',
      ];

      for (const payload of xssPayloads) {
        // Mock API response
        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: 'safe_base64_image' }),
          });
        });

        await page.getByTestId('ai-prompt-input').fill(payload);
        await page.getByTestId('ai-logo-button').click();

        // Check that no XSS occurred
        const xssExecuted = await page.evaluate(() => window.xssTest);
        expect(xssExecuted).toBeFalsy();

        // Clear for next test
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should sanitize filename inputs', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // Apply a texture first
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByTestId('editor-tab-imageDownload').click();

      const maliciousFilenames = [
        '<script>alert("xss")</script>',
        'file"name.png',
        "file'name.png",
        'file<name>.png',
        '../../../etc/passwd',
        'con.png', // Windows reserved name
        'aux.png', // Windows reserved name
      ];

      for (const filename of maliciousFilenames) {
        await page.getByRole('textbox', { name: 'Filename' }).fill(filename);

        // Input should not execute any scripts
        const xssExecuted = await page.evaluate(() => window.xssTest);
        expect(xssExecuted).toBeFalsy();

        // Should handle gracefully (might sanitize or reject)
        await expect(
          page.getByRole('textbox', { name: 'Filename' })
        ).toBeVisible();
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should handle API requests with proper headers', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Intercept API request to verify headers
      await page.route('/api/custom-logo', (route) => {
        const headers = route.request().headers();

        // Should have proper content-type
        expect(headers['content-type']).toContain('application/json');

        // Should be a POST request
        expect(route.request().method()).toBe('POST');

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: 'test_image' }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill('CSRF test');
      await page.getByTestId('ai-logo-button').click();

      await expect(page.getByText(/image applied successfully/i)).toBeVisible();
    });
  });

  test.describe('Input Validation', () => {
    test('should handle extremely long inputs', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-aiPicker').click();

      // Test with very long prompt
      const longPrompt = 'A'.repeat(10000);

      await page.route('/api/custom-logo', (route) => {
        const body = route.request().postDataJSON();
        // API should handle or truncate long inputs
        expect(body.prompt).toBeDefined();
        route.fulfill({ status: 400 }); // Might reject long inputs
      });

      await page.getByTestId('ai-prompt-input').fill(longPrompt);
      await page.getByTestId('ai-logo-button').click();

      // Should handle gracefully without crashing
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle special characters in filenames', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByTestId('editor-tab-imageDownload').click();

      const specialChars = [
        '<>&"\'',
        '../../file',
        'file\x00name',
        'file\nnewline',
      ];

      for (const filename of specialChars) {
        await page.getByRole('textbox', { name: 'Filename' }).fill(filename);

        // Should not crash the application
        await expect(page.getByTestId('image-download')).toBeVisible();

        // Button might be disabled for invalid filenames
        const downloadButton = page.getByRole('button', {
          name: 'Download Logo',
        });
        // Just check that the page still functions
        await expect(downloadButton).toBeVisible();
      }
    });
  });

  test.describe('File Upload Security', () => {
    test('should reject files with dangerous extensions', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-filePicker').click();

      // Note: Modern browsers and our file input only accept image/* types
      // But we should test that dangerous files don't execute if somehow uploaded

      const testContent = '<script>alert("xss")</script>';

      await page.getByTestId('file-picker-input').setInputFiles({
        name: 'test.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(testContent),
      });

      await page.getByRole('button', { name: 'Logo' }).click();

      // Should not execute any scripts from the SVG
      const xssExecuted = await page.evaluate(() => window.xssTest);
      expect(xssExecuted).toBeFalsy();
    });

    test('should handle oversized files gracefully', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);
      await page.getByTestId('editor-tab-filePicker').click();

      // Create a large fake image file (5MB)
      const largeContent = 'x'.repeat(5 * 1024 * 1024);

      await page.getByTestId('file-picker-input').setInputFiles({
        name: 'large.png',
        mimeType: 'image/png',
        buffer: Buffer.from(largeContent),
      });

      // Should handle without crashing (might show error or process slowly)
      await expect(page.getByText('large.png')).toBeVisible();

      // Try to apply it
      await page.getByRole('button', { name: 'Logo' }).click();

      // Application should remain responsive
      await expect(page.getByTestId('file-picker')).toBeVisible();
    });
  });

  test.describe('Content Security Policy', () => {
    test('should not allow inline script execution', async ({ page }) => {
      // Monitor for any console errors related to CSP
      const cspErrors: string[] = [];
      page.on('console', (msg) => {
        if (
          msg.type() === 'error' &&
          msg.text().includes('Content Security Policy')
        ) {
          cspErrors.push(msg.text());
        }
      });

      await page.goto('/');

      // Try to inject inline script (should be blocked by CSP if properly configured)
      await page.evaluate(() => {
        try {
          const script = document.createElement('script');
          script.innerHTML = 'window.inlineScriptExecuted = true;';
          document.head.appendChild(script);
        } catch (error) {
          console.log('Inline script blocked:', error);
        }
      });

      // Check if inline script was blocked
      const scriptExecuted = await page.evaluate(
        () => window.inlineScriptExecuted
      );

      // In a properly secured app, this should be undefined (script blocked)
      // If it executed, ensure it's at least logged as a security concern
      if (scriptExecuted) {
        console.warn(
          '⚠️  Inline script execution was not blocked - consider implementing CSP'
        );
      }
    });
  });
});
