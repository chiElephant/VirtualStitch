// File: ImageDownload.enabledState.spec.ts
import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /customize/i }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
});

// Helper for uploading, applying filter, and filling filename
async function uploadAndSetup(
  page: Page,
  options: { filter: string; filename: string }
) {
  const { filter, filename } = options;
  await page.getByRole('img', { name: 'filePicker' }).click();
  await page.getByText('Upload File').click();
  await page
    .getByTestId('file-picker-input')
    .setInputFiles('tests/fixtures/emblem.png');
  await page.getByRole('button', { name: filter }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
  await page.getByLabel(/filename/i).fill(filename);
}

test.describe('ImageDownload Component', () => {
  test.describe('Enabled State', () => {
    test('Logo filter is active, filename is filled, and logo is uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'logo-image' });
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', { name: 'Download Shirt' });
      await expect(logoButton).toBeEnabled();
      await expect(shirtButton).toBeEnabled();
    });

    test('Stylish filter is active, filename is filled, and fullLogo is uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Full', filename: 'logo-image' });
      const patternButton = page.getByRole('button', {
        name: 'Download Pattern',
      });
      const shirtButton = page.getByRole('button', { name: 'Download Shirt' });
      await expect(patternButton).toBeEnabled();
      await expect(shirtButton).toBeEnabled();
    });
  });
});
