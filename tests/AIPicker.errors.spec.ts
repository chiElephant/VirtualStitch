// AIPicker.errors.spec.ts
import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base64Emblem = fs
  .readFileSync(path.resolve(__dirname, './fixtures/emblem.png'))
  .toString('base64');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Customize")');
  await page.click('img[alt="aiPicker"]');
  await page.waitForSelector('[data-testid="ai-prompt-input"]', {
    state: 'visible',
    timeout: 10000,
  });
  // global mock for custom-logo endpoint
  await page.route('**/api/custom-logo', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photo: base64Emblem }),
    })
  );
});

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
