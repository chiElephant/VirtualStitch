// AIPicker.ui.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base64Emblem = fs
  .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
  .toString('base64');

test.describe('AI picker UI interactions and states', () => {
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

  test('UI interactions and states', async ({ page }) => {
    // typing preserves value
    const input = page.getByTestId('ai-prompt-input');
    await input.fill('Sample prompt');
    await expect(input).toHaveValue('Sample prompt');

    // simulate AI response immediately
    await page.route('**/api/custom-logo', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ photo: base64Emblem }),
      })
    );
    await page.getByTestId('ai-logo-button').click();
    await expect(page.getByText(/image applied successfully/i)).toBeVisible();

    // closing picker on success
    await expect(page.getByTestId('ai-picker')).not.toBeVisible();

    // tab switching preserves prompt
    await page.getByRole('img', { name: 'colorPicker' }).click();
    await page.getByRole('img', { name: 'aiPicker' }).click();
    await expect(input).toHaveValue('Sample prompt');
  });
});
