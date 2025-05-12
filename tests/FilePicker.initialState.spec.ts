import { test, expect } from '@playwright/test';

test.describe('File Picker - Initial State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'filePicker' }).click();
  });

  test('should display "No file selected" initially', async ({ page }) => {
    await expect(page.getByText('No file selected')).toBeVisible();
  });
});
