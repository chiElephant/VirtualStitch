// File: ImageDownload.labelText.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /customize/i }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
});

test.describe('ImageDownload Component', () => {
  test.describe('Label & Button Text', () => {
    test('should display "Download Logo" when the logo filter is active', async ({
      page,
    }) => {
      await page.getByTestId('filter-tab-logoShirt').click();
      const button = page.getByRole('button', { name: 'Download Logo' });
      await expect(button).toBeVisible();
    });

    test('should display "Download Pattern" when the stylish filter is active', async ({
      page,
    }) => {
      await page.getByTestId('filter-tab-stylishShirt').click();
      const button = page.getByRole('button', { name: 'Download Pattern' });
      await expect(button).toBeVisible();
    });

    test('should keep the download button text unchanged when no filter is active', async ({
      page,
    }) => {
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeVisible();
      await expect(shirtButton).toBeVisible();
    });
  });
});
