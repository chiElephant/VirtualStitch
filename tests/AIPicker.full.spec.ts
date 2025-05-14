import { test } from '@playwright/test';
test.beforeAll(() => {
  test.setTimeout(60_000);
});
test.describe.configure({ retries: 2 });
import fs from 'fs';
import path from 'path';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const base64Emblem = fs
    .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
    .toString('base64');
  // global mock for custom-logo endpoint
  await page.route('**/api/custom-logo', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photo: base64Emblem }),
    })
  );
  const customizeBtn = page.getByRole('button', { name: /customize/i });
  await customizeBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await customizeBtn.click();
  const aiPickerTab = page.getByRole('img', { name: 'aiPicker' });
  await aiPickerTab.waitFor({ state: 'visible', timeout: 10_000 });
  await aiPickerTab.scrollIntoViewIfNeeded();
  let clicked = false;
  for (let i = 0; i < 3; i++) {
    try {
      await aiPickerTab.click();
      clicked = true;
      break;
    } catch {
      await page.waitForTimeout(200);
    }
  }
  if (!clicked)
    throw new Error('aiPickerTab could not be clicked after 3 attempts');
});
