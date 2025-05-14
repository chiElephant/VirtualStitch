// AIPicker.full.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base64Emblem = fs
  .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
  .toString('base64');

test.describe('AI picker full shirt image fetch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');

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
    await aiPickerTab.click();
  });

  test('should fetch an ai image and apply it as a full shirt (mocked)', async ({
    page,
  }) => {
    const fullTexture = page.getByTestId('full-texture');
    const aiPromptInput = page.getByTestId('ai-prompt-input');
    const aiFullButton = page.getByTestId('ai-full-button');

    await aiPromptInput.fill('Make me a full shirt design.');
    await aiFullButton.click();
    await expect(page.getByText(/image applied successfully/i)).toBeVisible();
    await expect(fullTexture).toHaveCount(1);
  });
});
