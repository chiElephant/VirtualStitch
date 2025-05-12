import { test, expect } from '@playwright/test';

test.describe('File Picker - Button States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'filePicker' }).click();
  });

  test('should have Logo and Full buttons enabled even when no file is selected', async ({
    page,
  }) => {
    const logoButton = page.getByRole('button', { name: 'Logo' });
    const fullButton = page.getByRole('button', { name: 'Full' });

    await expect(logoButton).toBeEnabled();
    await expect(fullButton).toBeEnabled();
  });
});
