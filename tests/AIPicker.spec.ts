import { test, expect, type Page } from '@playwright/test';
import type { Route } from '@playwright/test';
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

test.describe('AI picker', () => {
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

  test.describe('Error Handling', () => {
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
      await expect(
        page.getByText('Unexpected error occurred ❌.')
      ).toBeVisible();
    });
  });

  test.describe('Success Handling', () => {
    test('should show success toast and apply decal after successful image fetch', async ({
      page,
    }) => {
      await page.route('**/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: 'fakebase64image' }),
        });
      });
      await submitAiPrompt(page, 'Test success');
      await expect(page.getByText(/image applied successfully/i)).toBeVisible();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });
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
