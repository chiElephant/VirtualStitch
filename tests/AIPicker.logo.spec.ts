// AIPicker.logo.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base64Emblem = fs
  .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
  .toString('base64');

test.describe('AI picker logo image fetch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // global mock for custom-logo endpoint
    await page.route('**/api/custom-logo', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ photo: base64Emblem }),
      })
    );

    const customizeBtn = page.getByRole('button', { name: /customize/i });
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();

    const aiPickerTab = page.getByRole('img', { name: 'aiPicker' });
    await expect(aiPickerTab).toBeVisible();
    try {
      await aiPickerTab.click();
    } catch (err) {
      console.error('aiPickerTab click failed');
      throw err;
    }
  });

  test('should fetch an ai image and apply it as a logo (mocked)', async ({
    page,
  }) => {
    const logoTexture = page.getByTestId('logo-texture');
    const aiPromptInput = page.getByTestId('ai-prompt-input');
    const aiLogoButton = page.getByTestId('ai-logo-button');

    // ✅ Apply as logo
    await aiPromptInput.fill('Make me a logo.');
    await aiLogoButton.click();
    await expect(page.getByText(/image applied successfully/i)).toBeVisible();
    await expect(logoTexture).toHaveCount(1);
  });
});
