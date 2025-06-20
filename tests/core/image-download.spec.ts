import { test, expect } from '@playwright/test';
import { TestUtils, TEST_FILES } from '../utils/test-helpers';

test.describe('Image Download', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
    await utils.nav.openEditorTab('image-download');
  });

  test.describe('Initial State', () => {
    test('should display download interface', async ({ page }) => {
      await expect(page.getByTestId('image-download')).toBeVisible();
      await expect(page.getByPlaceholder('e.g., my-shirt')).toBeVisible();
    });

    test('should have disabled buttons when no active filter', async ({ page }) => {
      await utils.download.verifyDownloadDisabled('Download Logo');
      await utils.download.verifyDownloadDisabled('Download Shirt');
    });

    test('should have disabled buttons when no filename', async ({ page }) => {
      await utils.texture.activateFilter('logoShirt');
      
      await utils.download.verifyDownloadDisabled('Download Logo');
      await utils.download.verifyDownloadDisabled('Download Shirt');
    });
  });

  test.describe('Button States with Default Textures', () => {
    test('should disable buttons with default logo texture', async ({ page }) => {
      await utils.texture.activateFilter('logoShirt');
      await page.getByPlaceholder('e.g., my-shirt').fill('test-name');
      
      // Default logo should keep buttons disabled
      await utils.download.verifyDownloadDisabled('Download Logo');
      await utils.download.verifyDownloadDisabled('Download Shirt');
    });

    test('should disable buttons with default full texture', async ({ page }) => {
      await utils.texture.activateFilter('stylishShirt');
      await page.getByPlaceholder('e.g., my-shirt').fill('test-name');
      
      // Default pattern should keep buttons disabled
      await utils.download.verifyDownloadDisabled('Download Pattern');
      await utils.download.verifyDownloadDisabled('Download Shirt');
    });
  });

  test.describe('Button States with Custom Textures', () => {
    test('should enable buttons when logo uploaded and filename provided', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.nav.openEditorTab('image-download');
      await page.getByPlaceholder('e.g., my-shirt').fill('my-logo');
      
      await utils.download.verifyDownloadEnabled('Download Logo');
      await utils.download.verifyDownloadEnabled('Download Shirt');
    });

    test('should enable buttons when full texture uploaded and filename provided', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'full');
      await utils.nav.openEditorTab('image-download');
      await page.getByPlaceholder('e.g., my-shirt').fill('my-pattern');
      
      await utils.download.verifyDownloadEnabled('Download Pattern');
      await utils.download.verifyDownloadEnabled('Download Shirt');
    });
  });

  test.describe('Download Functionality', () => {
    test('should download logo with correct filename', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      
      const download = await utils.download.downloadImage('my-custom-logo', 'Download Logo');
      
      expect(download.suggestedFilename()).toContain('my-custom-logo');
    });

    test('should download pattern with correct filename', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'full');
      
      const download = await utils.download.downloadImage('my-pattern', 'Download Pattern');
      
      expect(download.suggestedFilename()).toContain('my-pattern');
    });

    test('should download shirt canvas with correct filename', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      
      const download = await utils.download.downloadImage('my-shirt', 'Download Shirt');
      
      expect(download.suggestedFilename()).toContain('my-shirt');
    });

    test('should reset filename after successful download', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      
      await utils.download.downloadImage('reset-test', 'Download Logo');
      
      const filenameInput = page.getByPlaceholder('e.g., my-shirt');
      await expect(filenameInput).toHaveValue('');
    });

    test('should disable buttons after filename reset', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      
      await utils.download.downloadImage('disable-test', 'Download Logo');
      
      await utils.download.verifyDownloadDisabled('Download Logo');
      await utils.download.verifyDownloadDisabled('Download Shirt');
    });
  });

  test.describe('Label Changes Based on Filter', () => {
    test('should show "Download Logo" when logo filter active', async ({ page }) => {
      await utils.texture.activateFilter('logoShirt');
      await utils.nav.openEditorTab('image-download');
      
      await expect(page.getByRole('button', { name: 'Download Logo' })).toBeVisible();
    });

    test('should show "Download Pattern" when stylish filter active', async ({ page }) => {
      await utils.texture.activateFilter('stylishShirt');
      await utils.nav.openEditorTab('image-download');
      
      await expect(page.getByRole('button', { name: 'Download Pattern' })).toBeVisible();
    });
  });

  test.describe('Filename Validation', () => {
    test('should handle whitespace-only filenames', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.nav.openEditorTab('image-download');
      await page.getByPlaceholder('e.g., my-shirt').fill('   ');
      
      await utils.download.verifyDownloadDisabled('Download Logo');
    });

    test('should trim whitespace from filenames', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      
      const download = await utils.download.downloadImage('  trimmed-name  ', 'Download Logo');
      
      expect(download.suggestedFilename()).toContain('trimmed-name');
    });
  });

  test.describe('Error Handling', () => {
    test('should not trigger download for disabled buttons', async ({ page }) => {
      let downloadTriggered = false;
      page.on('download', () => {
        downloadTriggered = true;
      });

      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      await expect(logoButton).toBeDisabled();
      await logoButton.click({ force: true });

      expect(downloadTriggered).toBe(false);
    });
  });
});
