import { test, expect } from '@playwright/test';
import { TestUtils } from '../utils/test-helpers';

test.describe('Home Page', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await page.goto('/');
  });

  test.describe('Static Content', () => {
    test('should display all essential elements', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /LET'S DO IT\./ })
      ).toBeVisible();
      
      await expect(page.getByRole('img', { name: 'logo' })).toBeVisible();
      
      await expect(
        page.getByText(/Create your unique and exclusive shirt/i)
      ).toBeVisible();
      
      await expect(page.locator('canvas')).toBeVisible();
      
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to customizer when button is clicked', async ({ page }) => {
      await expect(page.getByTestId('customizer-main')).toHaveCount(0);

      await page.getByRole('button', { name: 'Customize It' }).click();
      await utils.wait.waitForAnimations();

      await expect(page.getByTestId('customizer-main')).toHaveCount(1);
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
    });
  });
});
