// File: ImageDownload.rendering.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /customize/i }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
});

test.describe('ImageDownload Component', () => {
  test.describe('Rendering', () => {
    test('should display the image download container', async ({ page }) => {
      await expect(page.getByTestId('image-download')).toBeVisible();
    });
  });
});
