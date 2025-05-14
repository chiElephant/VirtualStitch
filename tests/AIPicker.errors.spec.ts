// AIPicker.errors.spec.ts
import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base64Emblem = fs
  .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
  .toString('base64');

async function mockAiErrorResponse(page: Page, status: number) {
  await page.route('**/api/custom-logo', (route: Route) => {
    route.fulfill({ status });
  });
}

async function submitAiPrompt(page: Page, prompt: string) {
  await page.getByTestId('ai-prompt-input').fill(prompt);
  await page.getByTestId('ai-logo-button').click();
}

test.describe('AI picker error handling', () => {
  test.describe.configure({ retries: 2, timeout: 60_000 });
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
    const customizeBtn = page.getByRole('button', { name: /customize/i });
    await customizeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await customizeBtn.click();

    await page.waitForSelector('img[alt="aiPicker"]', {
      state: 'visible',
      timeout: 10_000,
    });
    const aiPickerTab = page.locator('img[alt="aiPicker"]');
    await aiPickerTab.scrollIntoViewIfNeeded();
    let clicked = false;
    for (let i = 0; i < 3; i++) {
      try {
        await aiPickerTab.click();
        clicked = true;
        break;
      } catch {
        console.warn(`aiPickerTab click attempt ${i + 1} failed`);
        await page.waitForTimeout(200);
      }
    }
    if (!clicked)
      throw new Error('aiPickerTab could not be clicked after 3 attempts');

    // global mock for custom-logo endpoint
    await page.route('**/api/custom-logo', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ photo: base64Emblem }),
      })
    );
  });

  test('should show a warning toast if trying to submit an empty prompt', async ({
    page,
  }) => {
    await submitAiPrompt(page, '');
    await expect(page.getByText(/please enter a prompt/i)).toBeVisible();
  });

  test('should show rate limit error toast (429)', async ({ page }) => {
    await mockAiErrorResponse(page, 429);
    await submitAiPrompt(page, 'Test rate limit');
    await expect(
      page.getByText(
        'You are making requests too quickly 🚫. Please wait a minute.'
      )
    ).toBeVisible();
  });

  test('should show server error toast (500)', async ({ page }) => {
    await mockAiErrorResponse(page, 500);
    await submitAiPrompt(page, 'Test server error');
    await expect(
      page.getByText('Server error while generating the image ⚠️.')
    ).toBeVisible();
  });

  test('should show unexpected error toast (fallback error)', async ({
    page,
  }) => {
    await mockAiErrorResponse(page, 418); // some unexpected status
    await submitAiPrompt(page, 'Test fallback error');
    await expect(page.getByText('Unexpected error occurred ❌.')).toBeVisible();
  });
});
