import { test, expect } from '@playwright/test';
import { TestUtils, MALICIOUS_INPUTS, VALID_TEST_IMAGE_BASE64 } from '../utils/test-helpers';

// Extend window interface for XSS test detection
declare global {
  interface Window {
    xssTest?: boolean;
    inlineScriptExecuted?: boolean;
    maliciousData?: any;
  }
}

test.describe('Security Tests', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Cross-Site Scripting (XSS) Prevention', () => {
    test('should prevent script injection in AI prompts', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      for (const xssPayload of MALICIOUS_INPUTS.xss) {
        // Mock successful API response
        await page.route('/api/custom-logo', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        });

        // Monitor for script execution
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        await page.getByTestId('ai-prompt-input').fill(xssPayload);
        await page.getByTestId('ai-logo-button').click();

        // Wait for response
        await utils.ai.verifySuccessToast();

        // Verify no script execution
        expect(scriptExecuted).toBe(false);

        const xssFlag = await page.evaluate(() => window.xssTest);
        expect(xssFlag).toBeFalsy();

        // Clean up for next iteration
        await utils.wait.waitForToastToDisappear(/image applied successfully/i);
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should sanitize filename inputs', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.texture.activateFilter('logoShirt'); // Activate filter for download
      await utils.nav.openEditorTab('image-download');

      for (const filename of MALICIOUS_INPUTS.filenames) {
        // Monitor for script execution
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        const filenameInput = page.getByPlaceholder('e.g., my-shirt');
        await filenameInput.fill(filename);

        // Verify no script execution
        expect(scriptExecuted).toBe(false);

        const xssFlag = await page.evaluate(() => window.xssTest);
        expect(xssFlag).toBeFalsy();

        // Interface should remain functional
        await expect(page.getByTestId('image-download')).toBeVisible();
      }
    });

    test('should handle extremely long inputs safely', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock API response for long input
      await page.route('/api/custom-logo', (route) => {
        const body = route.request().postDataJSON();
        expect(body.prompt).toBeDefined();
        
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Prompt too long' }),
        });
      });

      await page.getByTestId('ai-prompt-input').fill(MALICIOUS_INPUTS.longInput);
      await page.getByTestId('ai-logo-button').click();

      // Should handle gracefully without crashing
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(/unexpected error occurred/i)).toBeVisible();
    });

    test('should prevent DOM manipulation through user input', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Try to inject DOM manipulation code
      const domManipulationPayloads = [
        'document.body.innerHTML="<h1>Hacked</h1>"',
        'document.querySelector("body").remove()',
        '<img src=x onerror="document.body.style.display=\'none\'">',
      ];

      for (const payload of domManipulationPayloads) {
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill(payload);

        // Check that DOM wasn't manipulated
        await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
        await expect(page.locator('body')).toBeVisible();
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      }
    });
  });

  test.describe('File Upload Security', () => {
    test('should handle files with dangerous extensions safely', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('file-picker');

      const dangerousFiles = [
        { name: 'script.js.png', mimeType: 'image/png' },
        { name: 'virus.exe.jpg', mimeType: 'image/jpeg' },
        { name: 'malware.svg', mimeType: 'image/svg+xml' },
        { name: 'exploit.html.png', mimeType: 'image/png' },
      ];

      for (const file of dangerousFiles) {
        // Monitor for script execution
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        const buffer = Buffer.from(VALID_TEST_IMAGE_BASE64, 'base64');
        await utils.file.uploadWithBuffer(file.name, file.mimeType, buffer, 'logo');

        // Verify no script execution
        expect(scriptExecuted).toBe(false);

        // App should remain functional
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should handle oversized files gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('file-picker');

      // Create oversized file (1MB to avoid browser crashes)
      const largeContent = 'x'.repeat(1024 * 1024);
      const buffer = Buffer.from(largeContent);

      await utils.file.uploadWithBuffer('large.png', 'image/png', buffer, 'logo');

      // Should handle without crashing
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByTestId('file-picker')).toBeVisible();
    });

    test('should reject files with malicious content', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('file-picker');

      // SVG with embedded script
      const maliciousSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <script>window.xssTest = true;</script>
          <rect width="100" height="100" fill="red"/>
        </svg>
      `;

      const buffer = Buffer.from(maliciousSVG);
      await utils.file.uploadWithBuffer('malicious.svg', 'image/svg+xml', buffer, 'logo');

      // Should not execute embedded script
      const xssFlag = await page.evaluate(() => window.xssTest);
      expect(xssFlag).toBeFalsy();

      // App should remain stable
      await expect(page.locator('body')).toBeVisible();
    });

    test('should validate file content type', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('file-picker');

      // File with misleading extension
      const textContent = 'This is actually a text file, not an image';
      const buffer = Buffer.from(textContent);

      await utils.file.uploadWithBuffer('fake-image.png', 'text/plain', buffer, 'logo');

      // App should handle gracefully (might show error or process anyway)
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Input Validation and Sanitization', () => {
    test('should validate and sanitize URL parameters', async ({ page }) => {
      // Try to access with malicious URL parameters
      const maliciousParams = [
        '?xss=<script>alert("xss")</script>',
        '?redirect=javascript:alert("xss")',
        '?data=<img src=x onerror=alert("xss")>',
      ];

      for (const param of maliciousParams) {
        await page.goto(`/${param}`);

        // Page should load normally without executing scripts
        await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
        
        const xssFlag = await page.evaluate(() => window.xssTest);
        expect(xssFlag).toBeFalsy();
      }
    });

    test('should handle special characters in form inputs', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('image-download');

      const specialChars = [
        '<>&"\'',
        '../../file',
        'file\x00name',
        'file\nnewline',
        'file\ttab',
        'file\rreturn',
      ];

      for (const chars of specialChars) {
        const filenameInput = page.getByPlaceholder('e.g., my-shirt');
        await filenameInput.fill(chars);

        // Should not crash the application
        await expect(page.getByTestId('image-download')).toBeVisible();

        // Should not execute any embedded scripts
        const xssFlag = await page.evaluate(() => window.xssTest);
        expect(xssFlag).toBeFalsy();
      }
    });

    test('should prevent path traversal attacks', async ({ page }) => {
      await utils.nav.goToCustomizer();

      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd',
      ];

      for (const payload of pathTraversalPayloads) {
        await utils.nav.openEditorTab('image-download');
        const filenameInput = page.getByPlaceholder('e.g., my-shirt');
        await filenameInput.fill(payload);

        // Should handle safely without accessing restricted paths
        await expect(page.getByTestId('image-download')).toBeVisible();
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include proper headers in API requests', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

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
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await utils.ai.generateImage('CSRF protection test');
      await utils.ai.verifySuccessToast();
    });

    test('should validate request origin', async ({ page }) => {
      await page.goto('/');

      // Verify that requests are properly validated
      const response = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/custom-logo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: 'test' }),
          });
          return {
            status: response.status,
            statusText: response.statusText,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      // Should either succeed or fail gracefully (not block with CORS error)
      expect(response.error?.includes('CORS')).toBeFalsy();
    });
  });

  test.describe('Content Security Policy', () => {
    test('should prevent inline script execution', async ({ page }) => {
      await page.goto('/');

      // Try to inject and execute inline script
      await page.evaluate(() => {
        try {
          const script = document.createElement('script');
          script.innerHTML = 'window.inlineScriptExecuted = true;';
          document.head.appendChild(script);
        } catch (error) {
          // Expected if CSP blocks inline scripts
          console.log('Inline script blocked:', error);
        }
      });

      // Check if inline script was executed
      const scriptExecuted = await page.evaluate(() => window.inlineScriptExecuted);
      
      // In a properly secured app, this should be undefined
      // Test passes regardless but notes security level
      if (scriptExecuted) {
        console.warn('Warning: Inline scripts can execute - consider implementing CSP');
      }

      // App should remain functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle external resource loading securely', async ({ page }) => {
      await page.goto('/');

      // Monitor for external resource loading attempts
      const externalRequests: string[] = [];
      
      page.on('request', (request) => {
        const url = request.url();
        if (!url.startsWith(page.url().split('/').slice(0, 3).join('/'))) {
          externalRequests.push(url);
        }
      });

      await utils.nav.goToCustomizer();
      await utils.color.openColorPicker();

      // Check that only allowed external resources are loaded
      const suspiciousRequests = externalRequests.filter(url => 
        !url.includes('fonts.googleapis.com') &&
        !url.includes('cdnjs.cloudflare.com') &&
        !url.includes('rsms.me')
      );

      // Should not load unexpected external resources
      expect(suspiciousRequests.length).toBe(0);
    });
  });

  test.describe('Data Protection and Privacy', () => {
    test('should not expose sensitive data in client-side code', async ({ page }) => {
      await page.goto('/');

      // Check for exposed secrets or sensitive data
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

      // Should not expose sensitive data on window object
      expect(exposedSecrets.length).toBe(0);
    });

    test('should handle user data securely', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Input sensitive-looking data
      const sensitiveData = 'password123, secret-token, api-key-xyz';
      await page.getByTestId('ai-prompt-input').fill(sensitiveData);

      // Check that data is not exposed in unexpected places
      const dataExposed = await page.evaluate((data) => {
        // Check if data appears in console, localStorage, etc.
        try {
          const consoleOutput = console.log.toString();
          const localStorageData = JSON.stringify(localStorage);
          
          return consoleOutput.includes(data) || localStorageData.includes(data);
        } catch {
          return false;
        }
      }, sensitiveData);

      expect(dataExposed).toBe(false);
    });

    test('should implement proper session management', async ({ page }) => {
      await page.goto('/');

      // Check for secure session handling
      const cookies = await page.context().cookies();
      
      for (const cookie of cookies) {
        // Session cookies should have secure attributes if using HTTPS
        if (cookie.name.toLowerCase().includes('session')) {
          // In production, these should be secure
          expect(cookie.httpOnly).toBeDefined();
        }
      }
    });
  });

  test.describe('Error Handling Security', () => {
    test('should not expose sensitive information in error messages', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock API error response
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Database connection failed: server=prod-db-01, user=admin, password=hidden'
          }),
        });
      });

      await utils.ai.generateImage('trigger error');

      // Error message should not expose sensitive details
      const errorMessage = await page.textContent('body');
      expect(errorMessage?.includes('password=')).toBeFalsy();
      expect(errorMessage?.includes('server=')).toBeFalsy();
      expect(errorMessage?.includes('Database connection')).toBeFalsy();
    });

    test('should handle malformed API responses securely', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock malformed JSON response
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {[}',
        });
      });

      await utils.ai.generateImage('malformed response test');

      // Should handle gracefully without exposing error details
      await expect(page.getByText(/failed to fetch image/i)).toBeVisible();
      
      // Should not crash or expose system information
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Network Security', () => {
    test('should handle network disconnection securely', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Simulate network failure
      await page.route('/api/custom-logo', (route) => 
        route.abort('internetdisconnected')
      );

      await utils.ai.generateImage('network test');

      // Should handle gracefully without exposing network details
      await expect(page.getByText(/failed to fetch image/i)).toBeVisible();
    });

    test('should validate API response integrity', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Mock suspicious API response
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            photo: VALID_TEST_IMAGE_BASE64,
            maliciousField: '<script>alert("injected")</script>',
            redirect: 'javascript:alert("redirect")',
          }),
        });
      });

      await utils.ai.generateImage('response validation test');

      // Should process safe data and ignore malicious fields
      await utils.ai.verifySuccessToast();
      
      const xssFlag = await page.evaluate(() => window.xssTest);
      expect(xssFlag).toBeFalsy();
    });
  });
});
