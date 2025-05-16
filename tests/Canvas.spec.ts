import { test, expect } from '@playwright/test';

test.describe('Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize It' }).click();
  });

  test.describe('Initial State', () => {
    test('should not display logo or fullLogo textures on initial load', async ({
      page,
    }) => {
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
    });

    test('should display the canvas container', async ({ page }) => {
      await expect(page.locator('canvas')).toBeVisible();
    });
  });

  test.describe('Logo Filter Behavior', () => {
    test('should display the logo when logo filter is active', async ({
      page,
    }) => {
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
      await page.getByTestId('filter-tab-logoShirt').click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });

    test('should remove the logo when logo filter is deactived', async ({
      page,
    }) => {
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
      await page.getByTestId('filter-tab-logoShirt').click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
      await page.getByTestId('filter-tab-logoShirt').click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
    });
  });

  test.describe('FullLogo Filter Behavior', () => {
    test('should display the fullLogo when stylish filter is active', async ({
      page,
    }) => {
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('full-texture')).toHaveCount(1);
    });

    test('should remove the fullLogo when stylish filter is deactived', async ({
      page,
    }) => {
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('full-texture')).toHaveCount(1);
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
    });
  });

  test.describe('Combined Filters', () => {
    test('should display logo and fullLogo when both filters are active', async ({
      page,
    }) => {
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByTestId('filter-tab-stylishShirt').click();

      await expect(page.getByTestId('full-texture')).toHaveCount(1);
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);

      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
    });
  });
});
