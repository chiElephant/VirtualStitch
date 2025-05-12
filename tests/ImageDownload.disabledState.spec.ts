// File: ImageDownload.disabledState.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /customize/i }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
});

test.describe('ImageDownload Component', () => {
  test.describe('Disabled State', () => {
    test('No Active Filter, No Filename', async ({ page }) => {
      const input = '';
      await page.getByLabel(/filename/i).fill(input);
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });
    test('No Active Filter, Filled Filename', async ({ page }) => {
      const input = 'my-image';
      await page.getByLabel(/filename/i).fill(input);
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });
    test('No Active Filter, Whitespace Filename', async ({ page }) => {
      const input = '   ';
      await page.getByLabel(/filename/i).fill(input);
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });

    test('Logo Filter, No Filename', async ({ page }) => {
      const input = '';
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByLabel(/filename/i).fill(input);
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });
    test('Logo Filter, Whitespace Filename', async ({ page }) => {
      const input = '   ';
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByLabel(/filename/i).fill(input);
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });

    test('Full Filter, No Filename', async ({ page }) => {
      const input = '';
      await page.getByTestId('filter-tab-stylishShirt').click();
      await page.getByLabel(/filename/i).fill(input);
      const patternButton = page.getByRole('button', {
        name: 'Download Pattern',
      });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(patternButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });
    test('Full Filter, Whitespace Filename', async ({ page }) => {
      const input = '   ';
      await page.getByTestId('filter-tab-stylishShirt').click();
      await page.getByLabel(/filename/i).fill(input);
      const patternButton = page.getByRole('button', {
        name: 'Download Pattern',
      });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(patternButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });
  });
});
