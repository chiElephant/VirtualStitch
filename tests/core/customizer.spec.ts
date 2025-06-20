import { test, expect } from '@playwright/test';
import { TestUtils } from '../utils/test-helpers';

test.describe('Customizer', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
  });

  test.describe('Layout and Navigation', () => {
    test('should display all tab containers and controls', async ({ page }) => {
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible();
    });

    test('should display all editor tabs', async ({ page }) => {
      const editorTabs = [
        'colorPicker',
        'filePicker',
        'aiPicker',
        'imageDownload',
      ];

      for (const tab of editorTabs) {
        await expect(page.getByRole('img', { name: tab })).toBeVisible();
      }
    });

    test('should display all filter tabs', async ({ page }) => {
      await expect(page.getByTestId('filter-tab-logoShirt')).toBeVisible();
      await expect(page.getByTestId('filter-tab-stylishShirt')).toBeVisible();
    });

    test('should navigate back to home when back button is clicked', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Go Back' }).click();

      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(page.getByTestId('filter-tabs-container')).toHaveCount(0);
      await expect(page.getByTestId('editor-tabs-container')).toHaveCount(0);
    });
  });

  test.describe('Editor Tab Behavior', () => {
    test('should toggle editor tabs open and close', async ({ page }) => {
      // Open tab
      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('color-picker')).toBeVisible();

      // Close tab
      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('color-picker')).toHaveCount(0);
    });

    test('should only display one editor tab at a time', async ({ page }) => {
      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('color-picker')).toBeVisible();

      await page.getByTestId('editor-tab-filePicker').click();
      await expect(page.getByTestId('file-picker')).toBeVisible();
      await expect(page.getByTestId('color-picker')).toHaveCount(0);
    });
  });

  test.describe('Filter Tab Behavior', () => {
    test('should not affect filter state when toggling editor tabs', async ({
      page,
    }) => {
      await page.getByTestId('filter-tab-logoShirt').click();

      const isActive = await page
        .getByTestId('filter-tab-logoShirt')
        .getAttribute('data-is-active');
      expect(isActive).toBeTruthy();

      // Toggle editor tab
      await page.getByTestId('editor-tab-colorPicker').click();

      const stillActive = await page
        .getByTestId('filter-tab-logoShirt')
        .getAttribute('data-is-active');
      expect(stillActive).toBeTruthy();
    });
  });

  test.describe('State Persistence', () => {
    test('should maintain state when navigating back and forth', async ({
      page,
    }) => {
      // Make changes
      await utils.color.openColorPicker();
      await utils.color.selectColor('#80C670');
      await utils.nav.openEditorTab('filePicker');
      await utils.file.uploadFile('tests/fixtures/emblem.png', 'logo');

      // Navigate away and back
      await utils.nav.goToHome();
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForSelector('[data-testid="editor-tabs-container"]', {
        state: 'visible',
      });

      // Verify state persisted
      await utils.color.verifyColorApplied('#80C670');
      await utils.texture.verifyTextureVisible('logo');
    });
  });
});
