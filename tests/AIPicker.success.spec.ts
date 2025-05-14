// AIPicker.success.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI picker success handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

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
    await page.getByTestId('ai-prompt-input').fill('Test success');
    await page.getByTestId('ai-logo-button').click();
    await expect(page.getByText(/image applied successfully/i)).toBeVisible();
    await expect(page.getByTestId('logo-texture')).toHaveCount(1);
  });
});
