import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base64Emblem = fs
  .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
  .toString('base64');

test.describe('AI picker rendering', () => {
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

    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'aiPicker' }).click();
  });

  test('should display the ai picker when ai picker tab is clicked', async ({
    page,
  }) => {
    await expect(page.getByTestId('ai-picker')).toBeVisible();
  });
});
