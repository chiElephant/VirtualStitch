import { test, expect } from '@playwright/test';
import { TestUtils, MALICIOUS_INPUTS } from '../utils/test-helpers';

test.describe('AI Picker', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
    await utils.nav.openEditorTab('ai-picker');
  });

  test.describe('UI Components', () => {
    test('should display AI picker interface', async ({ page }) => {
      await expect(page.getByTestId('ai-picker')).toBeVisible();
      await expect(page.getByTestId('ai-prompt-input')).toBeVisible();
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });

    test('should accept and display prompt text', async ({ page }) => {
      const testPrompt = 'Generate a modern logo';
      await page.getByTestId('ai-prompt-input').fill(testPrompt);
      await expect(page.getByTestId('ai-prompt-input')).toHaveValue(testPrompt);
    });
  });

  test.describe('Successful AI Generation', () => {
    test('should generate and apply logo successfully', async ({ page }) => {
      await utils.ai.mockSuccessfulResponse();
      
      await utils.ai.generateImage('Modern tech logo', 'logo');
      
      await utils.ai.verifySuccessToast();
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should generate and apply full texture successfully', async ({ page }) => {
      await utils.ai.mockSuccessfulResponse();
      
      await utils.ai.generateImage('Abstract pattern', 'full');
      
      await utils.ai.verifySuccessToast();
      await utils.texture.verifyTextureVisible('full');
    });

    test('should close AI picker after successful generation', async ({ page }) => {
      await utils.ai.mockSuccessfulResponse();
      
      await utils.ai.generateImage('Test prompt', 'logo');
      await utils.ai.verifySuccessToast();
      
      await expect(page.getByTestId('ai-picker')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show warning for empty prompt', async ({ page }) => {
      await page.getByTestId('ai-logo-button').click();
      await expect(page.getByText(/please enter a prompt/i)).toBeVisible();
    });

    test('should handle rate limiting (429)', async ({ page }) => {
      await utils.ai.mockErrorResponse(429);
      
      await utils.ai.generateImage('Test rate limit');
      
      await utils.ai.verifyErrorToast('rate-limit');
    });

    test('should handle server errors (500)', async ({ page }) => {
      await utils.ai.mockErrorResponse(500);
      
      await utils.ai.generateImage('Test server error');
      
      await utils.ai.verifyErrorToast('server');
    });

    test('should handle unexpected errors', async ({ page }) => {
      await utils.ai.mockErrorResponse(418); // Teapot error
      
      await utils.ai.generateImage('Test unexpected error');
      
      await utils.ai.verifyErrorToast('unexpected');
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state during generation', async ({ page }) => {
      let resolveResponse: () => void;
      const responsePromise = new Promise<void>((resolve) => {
        resolveResponse = resolve;
      });

      await page.route('/api/custom-logo', async (route) => {
        await responsePromise;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: 'fakebase64image' }),
        });
      });

      await utils.ai.generateImage('Test loading');
      
      await expect(page.getByRole('button', { name: 'Asking AI...' })).toBeVisible();
      await expect(page.getByTestId('ai-logo-button')).not.toBeVisible();
      await expect(page.getByTestId('ai-full-button')).not.toBeVisible();

      resolveResponse!();
    });
  });

  test.describe('Input Validation and Security', () => {
    test('should handle malicious prompts safely', async ({ page }) => {
      await utils.ai.mockSuccessfulResponse();
      
      for (const maliciousPrompt of MALICIOUS_INPUTS.xss) {
        let scriptExecuted = false;
        page.on('dialog', () => {
          scriptExecuted = true;
        });

        await page.getByTestId('ai-prompt-input').fill(maliciousPrompt);
        await page.getByTestId('ai-logo-button').click();
        
        // Ensure no script execution
        expect(scriptExecuted).toBe(false);
        
        // Wait for response and clear input
        await utils.ai.verifySuccessToast();
        await utils.wait.waitForToastToDisappear(/image applied successfully/i);
        await utils.nav.openEditorTab('ai-picker');
        await page.getByTestId('ai-prompt-input').fill('');
      }
    });

    test('should handle extremely long prompts', async ({ page }) => {
      await page.route('/api/custom-logo', (route) => {
        const body = route.request().postDataJSON();
        expect(body.prompt).toBeDefined();
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Prompt too long' }),
        });
      });

      await utils.ai.generateImage(MALICIOUS_INPUTS.longInput);
      
      // Should handle gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('State Persistence', () => {
    test('should preserve prompt when switching tabs', async ({ page }) => {
      const testPrompt = 'Preserve this prompt';
      await page.getByTestId('ai-prompt-input').fill(testPrompt);
      
      await page.getByTestId('editor-tab-colorPicker').click();
      await utils.nav.openEditorTab('ai-picker');
      
      await expect(page.getByTestId('ai-prompt-input')).toHaveValue(testPrompt);
    });
  });
});
