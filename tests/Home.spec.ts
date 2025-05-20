import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Go to the starting url before each test.
    await page.goto(`${baseURL}`);
  });

  test.describe('Static Content', () => {
    test('should display the heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /LET'S DO IT\./ })
      ).toBeVisible();
    });

    test('should display the logo', async ({ page }) => {
      await expect(page.getByRole('img', { name: 'logo' })).toBeVisible();
    });

    test('should display the paragraph with expected text', async ({
      page,
    }) => {
      const expectedText =
        'Create your unique and exclusive shirt with our 3D customization tool. Unleash your Imagination and define your style.';
      await expect(
        page.getByText(expectedText, { exact: false })
      ).toBeVisible();
    });

    test('should display the canvas', async ({ page }) => {
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should display a navigation button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
    });
  });

  test.describe('Interactions', () => {
    test('should display Customizer when navigation button is clicked', async ({
      page,
    }) => {
      await expect(page.getByTestId('customizer-main')).toHaveCount(0);

      await page.getByRole('button', { name: 'Customize It' }).click();

      await expect(page.getByTestId('customizer-main')).toHaveCount(1);
    });
  });
});
