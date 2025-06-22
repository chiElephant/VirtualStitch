import { test, expect } from '@playwright/test';
import {
  TestUtils,
  TEST_FILES,
  VALID_TEST_IMAGE_BASE64,
} from '../utils/test-helpers';

test.describe('File Picker', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
    await utils.nav.openEditorTab('filePicker');
  });

  test.describe('Initial State', () => {
    test('should display "No file selected" initially', async ({ page }) => {
      await expect(page.getByText('No file selected')).toBeVisible();
    });

    test('should have disabled action buttons initially', async ({ page }) => {
      // Buttons should be disabled when no file is selected
      await expect(page.getByRole('button', { name: 'Logo' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Full Pattern' })).toBeDisabled();
    });

    test('should enable action buttons after valid file upload', async ({ page }) => {
      // Upload a valid image file
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.emblem);
      
      // Wait for validation to complete
      await page.waitForTimeout(2000);
      
      // Buttons should now be enabled
      await expect(page.getByRole('button', { name: 'Logo' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Full Pattern' })).toBeEnabled();
    });
  });

  test.describe('File Upload', () => {
    test('should display filename after upload', async ({ page }) => {
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.emblem);
      await expect(page.getByText('emblem.png')).toBeVisible();
    });

    test('should replace previous filename with new upload', async ({
      page,
    }) => {
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.emblem);
      await expect(page.getByText('emblem.png')).toBeVisible();

      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.emblem2);
      await expect(page.getByText('emblem2.png')).toBeVisible();
      await expect(page.getByText('emblem.png')).toHaveCount(0);
    });

    test('should reject non-image files with error message', async ({
      page,
    }) => {
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.invalidFile);
      
      // Wait for validation to process
      await page.waitForTimeout(2000);
      
      // Should show error toast for invalid file type
      await expect(page.locator('.Toastify__toast--error')).toBeVisible({
        timeout: 5000,
      });
      
      // Should still show "No file selected" since file was rejected
      await expect(page.getByText('No file selected')).toBeVisible();
      
      // Should not show the invalid filename
      await expect(page.getByText('sample.txt')).not.toBeVisible();
    });
  });

  test.describe('Texture Application', () => {
    test('should apply uploaded file as logo texture', async () => {
      await utils.texture.verifyTextureHidden('logo');
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should apply uploaded file as full texture', async ({}) => {
      await utils.texture.verifyTextureHidden('full');

      await utils.file.uploadFile(TEST_FILES.emblem, 'full');

      await utils.texture.verifyTextureVisible('full');
    });
  });

  test.describe('State Persistence', () => {
    test('should preserve filename after applying as logo', async ({
      page,
    }) => {
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.emblem);
      await page.getByRole('button', { name: 'Logo' }).click();

      // Reopen file picker
      await utils.nav.openEditorTab('filePicker');
      await expect(page.getByText('emblem.png')).toBeVisible();
    });

    test('should preserve filename after applying as full texture', async ({
      page,
    }) => {
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(TEST_FILES.emblem);
      await page.getByRole('button', { name: 'Full Pattern' }).click();

      // Reopen file picker
      await utils.nav.openEditorTab('filePicker');
      await expect(page.getByText('emblem.png')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle oversized files gracefully', async ({ page }) => {
      // Navigate to file picker
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('filePicker');

      // Wait for canvas to be visible initially
      await expect(page.locator('canvas')).toBeVisible();

      // Create a large buffer that exceeds the size limit (10MB > 5MB limit)
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const buffer = Buffer.from(largeContent);

      // Upload the oversized file
      await utils.file.uploadWithBuffer(
        'large.png',
        'image/png',
        buffer,
        'logo'
      );

      // Should show an error toast about file size
      await expect(page.locator('.Toastify__toast--error')).toBeVisible({
        timeout: 5000,
      });

      // Check that the error message mentions file size
      const errorToast = page.locator('.Toastify__toast--error');
      await expect(errorToast).toContainText(/too large|size/i);

      // App should not crash - canvas should still be visible
      await expect(page.locator('canvas')).toBeVisible();

      // File picker should show "No file selected" since validation failed
      await expect(page.getByText('No file selected')).toBeVisible();
    });

    test('should handle invalid image files gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('filePicker');
      await expect(page.locator('canvas')).toBeVisible();

      // Create a text file pretending to be an image
      const invalidContent =
        'This is not an image file, just plain text content.';
      const buffer = Buffer.from(invalidContent);

      await utils.file.uploadWithBuffer(
        'fake-image.png',
        'image/png',
        buffer,
        'logo'
      );

      // Should show an error toast about invalid format
      await expect(page.locator('.Toastify__toast--error')).toBeVisible({
        timeout: 5000,
      });

      const errorToast = page.locator('.Toastify__toast--error');
      await expect(errorToast).toContainText(/valid image|format/i);

      // App should not crash
      await expect(page.locator('canvas')).toBeVisible();
      await expect(page.getByText('No file selected')).toBeVisible();
    });

    test('should handle corrupted image files gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('filePicker');
      await expect(page.locator('canvas')).toBeVisible();

      // Create a buffer that starts like a PNG but is corrupted
      const corruptedPng = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47, // PNG signature
        0x0d,
        0x0a,
        0x1a,
        0x0a, // PNG signature continued
        ...Array(1000).fill(0xff), // Corrupted data
      ]);

      await utils.file.uploadWithBuffer(
        'corrupted.png',
        'image/png',
        corruptedPng,
        'logo'
      );

      // Wait for validation processing
      await page.waitForTimeout(3000);

      // Should either show error or handle gracefully
      const hasError = await page
        .locator('.Toastify__toast--error')
        .isVisible();

      if (hasError) {
        // If error is shown, file should not be selected
        await expect(page.getByText('No file selected')).toBeVisible();
      }

      // App should not crash regardless
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should handle files with suspicious names safely', async ({
      page,
    }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('filePicker');

      const buffer = Buffer.from(VALID_TEST_IMAGE_BASE64, 'base64');

      await utils.file.uploadWithBuffer(
        'script.js.png',
        'image/png',
        buffer,
        'logo'
      );

      // App should handle safely without executing scripts
      await expect(page.locator('body')).toBeVisible();

      // If file is valid, it should be processed
      await utils.wait.waitForTextureApplication();
      const logoTextureCount = await page.getByTestId('logo-texture').count();
      if (logoTextureCount === 0) {
        await utils.texture.activateFilter('logoShirt');
      }
      await utils.texture.verifyTextureVisible('logo');
    });
  });
});
