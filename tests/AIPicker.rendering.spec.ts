import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Customize")');
  await page.click('img[alt="aiPicker"]');
  await page.waitForSelector('[data-testid="ai-picker"]', {
    state: 'visible',
    timeout: 10000,
  });
  // global mock for custom-logo endpoint
  const base64Emblem = fs
    .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
    .toString('base64');
  await page.route('**/api/custom-logo', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photo: base64Emblem }),
    })
  );
});

test.describe.configure({ retries: 2, timeout: 60_000 });

test('should display the ai picker when ai picker tab is clicked', async ({
  page,
}) => {
  await expect(page.getByTestId('ai-picker')).toBeVisible();
});
