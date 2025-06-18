import { test, expect } from '@playwright/test';

test.describe('Smoke Tests @smoke', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Virtual Stitch/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('can navigate to customizer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize It' }).click();

    // Wait for animations to complete - framer-motion needs time
    await page.waitForTimeout(1500);

    // FIXED: Check for visible customizer elements instead of hidden customizer-main
    await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible();
  });

  test('color picker works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize It' }).click();

    // Wait for animations
    await page.waitForTimeout(1500);

    await page.getByTestId('editor-tab-colorPicker').click();
    await expect(page.getByTestId('color-picker')).toBeVisible();
  });

  test('file picker accepts uploads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize It' }).click();

    // Wait for animations
    await page.waitForTimeout(1500);

    await page.getByTestId('editor-tab-filePicker').click();
    await expect(page.getByTestId('file-picker')).toBeVisible();
    await expect(page.getByText('No file selected')).toBeVisible();
  });
});
