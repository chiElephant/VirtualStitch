import { test, expect } from '@playwright/test';
import { TestUtils, TEST_FILES, VALID_TEST_IMAGE_BASE64 } from '../utils/test-helpers';

test.describe('File Picker', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
    await utils.nav.openEditorTab('file-picker');
  });

  test.describe('Initial State', () => {
    test('should display "No file selected" initially', async ({ page }) => {
      await expect(page.getByText('No file selected')).toBeVisible();
    });

    test('should have enabled action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Logo' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Full' })).toBeEnabled();
    });
  });

  test.describe('File Upload', () => {
    test('should display filename after upload', async ({ page }) => {
      await page.getByTestId('file-picker-input').setInputFiles(TEST_FILES.emblem);
      await expect(page.getByText('emblem.png')).toBeVisible();
    });

    test('should replace previous filename with new upload', async ({ page }) => {
      await page.getByTestId('file-picker-input').setInputFiles(TEST_FILES.emblem);
      await expect(page.getByText('emblem.png')).toBeVisible();

      await page.getByTestId('file-picker-input').setInputFiles(TEST_FILES.emblem2);
      await expect(page.getByText('emblem2.png')).toBeVisible();
      await expect(page.getByText('emblem.png')).toHaveCount(0);
    });

    test('should accept non-image files but still show filename', async ({ page }) => {
      await page.getByTestId('file-picker-input').setInputFiles(TEST_FILES.invalidFile);
      await expect(page.getByText('sample.txt')).toBeVisible();
    });
  });

  test.describe('Texture Application', () => {
    test('should apply uploaded file as logo texture', async ({ page }) => {
      await utils.texture.verifyTextureHidden('logo');
      
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should apply uploaded file as full texture', async ({ page }) => {
      await utils.texture.verifyTextureHidden('full');
      
      await utils.file.uploadFile(TEST_FILES.emblem, 'full');
      
      await utils.texture.verifyTextureVisible('full');
    });
  });

  test.describe('State Persistence', () => {
    test('should preserve filename after applying as logo', async ({ page }) => {
      await page.getByTestId('file-picker-input').setInputFiles(TEST_FILES.emblem);
      await page.getByRole('button', { name: 'Logo' }).click();
      
      // Reopen file picker
      await utils.nav.openEditorTab('file-picker');
      await expect(page.getByText('emblem.png')).toBeVisible();
    });

    test('should preserve filename after applying as full texture', async ({ page }) => {
      await page.getByTestId('file-picker-input').setInputFiles(TEST_FILES.emblem);
      await page.getByRole('button', { name: 'Full' }).click();
      
      // Reopen file picker
      await utils.nav.openEditorTab('file-picker');
      await expect(page.getByText('emblem.png')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle files with suspicious names safely', async ({ page }) => {
      const buffer = Buffer.from(VALID_TEST_IMAGE_BASE64, 'base64');
      
      await utils.file.uploadWithBuffer('script.js.png', 'image/png', buffer, 'logo');
      
      // App should handle safely without executing scripts
      await expect(page.locator('body')).toBeVisible();
      
      // Verify texture applied
      await utils.wait.waitForTextureApplication();
      const logoTextureCount = await page.getByTestId('logo-texture').count();
      if (logoTextureCount === 0) {
        await utils.texture.activateFilter('logoShirt');
      }
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should handle oversized files gracefully', async ({ page }) => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const buffer = Buffer.from(largeContent);
      
      await utils.file.uploadWithBuffer('large.png', 'image/png', buffer, 'logo');
      
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
