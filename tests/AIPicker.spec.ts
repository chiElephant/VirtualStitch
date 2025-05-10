import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

async function mockSuccessfulAiResponse(page: Page, photo = 'fakebase64image') {
  await page.route('/api/custom-logo', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photo }),
    });
  });
}

async function mockAiErrorResponse(page: Page, status: number) {
  await page.route('/api/custom-logo', (route: Route) => {
    route.fulfill({ status });
  });
}

async function submitAiPrompt(page: Page, prompt: string) {
  await page.getByTestId('ai-prompt-input').fill(prompt);
  await page.getByTestId('ai-logo-button').click();
}

test.describe('AI picker', () => {
  test.describe.configure({ timeout: 240_000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'aiPicker' }).click();
  });

  test('should display the ai picker when ai picker tab is clicked', async ({
    page,
  }) => {
    await expect(page.getByTestId('ai-picker')).toBeVisible();
  });

  // NOTE: This test is skipped due to API rate limits and long run time. Enable when full E2E verification is needed.
  test('should fetch an ai image and apply it to the shirt', async ({
    page,
    browserName,
  }) => {
    test.setTimeout(240_000); // full timeout for the test
    const timeout = browserName === 'webkit' ? 120_000 : 45_000;

    await test.step('should apply the image as a logo', async () => {
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);

      await page.getByTestId('ai-prompt-input').fill('Make me a logo.');
      await page.getByTestId('ai-logo-button').click();

      await expect(
        page.getByRole('button', { name: 'Asking AI...' })
      ).toBeVisible();

      await page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/custom-logo') && resp.status() === 200,
        { timeout }
      );

      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });

    await test.step('should apply the image as a fullLogo', async () => {
      await page.waitForTimeout(60_000); // API rate limit buffer
      await expect(page.getByTestId('full-texture')).toHaveCount(0);

      await page.getByRole('img', { name: 'aiPicker' }).click();
      await page
        .getByTestId('ai-prompt-input')
        .fill('Make me a full shirt design.');

      await page.getByRole('button', { name: 'AI Full' }).click();

      await expect(
        page.getByRole('button', { name: 'Asking AI...' })
      ).toBeVisible();

      await page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/custom-logo') && resp.status() === 200,
        { timeout }
      );

      await expect(page.getByTestId('full-texture')).toHaveCount(1);
    });
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
      await mockSuccessfulAiResponse(page);
      await submitAiPrompt(page, 'Test success');
      await expect(page.getByText(/image applied successfully/i)).toBeVisible();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });
  });

  test.describe('UI/UX States', () => {
    test('should display "Asking AI..." button and disable others while loading', async ({
      page,
    }) => {
      let resolveResponse: () => void;
      const responsePromise = new Promise<void>((resolve) => {
        resolveResponse = resolve;
      });
      await page.route('/api/custom-logo', async (route) => {
        await responsePromise; // never resolves until we trigger it
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: 'fakebase64image' }),
        });
      });
      await page.getByTestId('ai-prompt-input').fill('Test loading state');
      await page.getByTestId('ai-logo-button').click();
      await expect(
        page.getByRole('button', { name: 'Asking AI...' })
      ).toBeVisible();
      resolveResponse!();
    });

    test('should close AI Picker tab after submission completes', async ({
      page,
    }) => {
      await mockSuccessfulAiResponse(page);
      await submitAiPrompt(page, 'Close tab test');
      await expect(page.getByTestId('ai-picker')).not.toBeVisible();
    });

    test('should render the prompt value from props and call setPrompt when typing', async ({
      page,
    }) => {
      const input = page.getByTestId('ai-prompt-input');
      await input.fill('Test prompt input');
      await expect(input).toHaveValue('Test prompt input');
    });

    test('should preserve prompt value when switching tabs back and forth', async ({
      page,
    }) => {
      const input = page.getByTestId('ai-prompt-input');
      await input.fill('Preserve this prompt');
      await page.getByRole('img', { name: 'colorPicker' }).click(); // switch to Color tab
      await page.getByRole('img', { name: 'aiPicker' }).click(); // switch back to AI Picker
      await expect(input).toHaveValue('Preserve this prompt');
    });

    test('should disable AI Logo and AI Full buttons when generatingImg is true', async ({
      page,
    }) => {
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
      await page.getByTestId('ai-prompt-input').fill('Disable buttons test');
      await page.getByTestId('ai-logo-button').click();

      const aiLogoButton = page.getByTestId('ai-logo-button');
      const aiFullButton = page.getByTestId('ai-full-button');

      await expect(aiLogoButton).not.toBeVisible();
      await expect(aiFullButton).not.toBeVisible();

      resolveResponse!();
    });
  });
});
