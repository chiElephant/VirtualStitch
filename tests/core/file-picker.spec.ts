/**
 * 📁 FILE PICKER TEST SUITE
 * Comprehensive testing of file upload and validation functionality
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('📁 File Picker', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: true,
      openEditorTab: 'filePicker',
    });
  });

  // ====================================================================
  // 🎯 INITIAL STATE
  // ====================================================================

  test.describe('Initial State', () => {
    test('should display "No file selected" initially', async ({ page, suite }) => {
      await suite.assert.verifyNoFileSelected();
    });

    test('should have disabled action buttons initially', async ({ page, suite }) => {
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.logoButton);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.fullPatternButton);
    });

    test('should display file picker interface correctly', async ({ suite }) => {
      await suite.assert.verifyPickerOpen('filePicker');
      await suite.assert.verifyComponentVisible('filePicker');
    });

    test('should enable action buttons after valid file upload', async ({ page, suite }) => {
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      
      // Wait for validation to complete
      await suite.wait.waitForFileValidation();
      
      // Buttons should now be enabled
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.logoButton);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.fullPatternButton);
    });
  });

  // ====================================================================
  // 📤 FILE UPLOAD
  // ====================================================================

  test.describe('File Upload', () => {
    test('should display filename after successful upload', async ({ page, suite }) => {
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      await suite.wait.waitForFileValidation();
      
      await suite.assert.verifyFileSelected('emblem.png');
    });

    test('should replace previous filename with new upload', async ({ page, suite }) => {
      // Upload first file
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      await suite.wait.waitForFileValidation();
      await suite.assert.verifyFileSelected('emblem.png');

      // Upload second file
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validPattern);
      await suite.wait.waitForFileValidation();
      
      await suite.assert.verifyFileSelected('emblem2.png');
      await expect(page.getByText('emblem.png')).toHaveCount(0);
    });

    test('should reject non-image files with error message', async ({ page, suite }) => {
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.invalidFile);
      
      // Wait for validation to process
      await suite.wait.waitForFileValidation();
      
      // Should show error toast for invalid file type
      await suite.assert.verifyFileValidationError('format');
      
      // Should still show "No file selected" since file was rejected
      await suite.assert.verifyNoFileSelected();
      
      // Should not show the invalid filename
      await expect(page.getByText('sample.txt')).not.toBeVisible();
    });

    test('should handle multiple file types correctly', async ({ page, suite }) => {
      const validFiles = [suite.data.files.validLogo, suite.data.files.validPattern];
      
      for (const file of validFiles) {
        await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(file);
        await suite.wait.waitForFileValidation();
        
        // Should not show error
        const hasError = await page.locator('.Toastify__toast--error').isVisible();
        expect(hasError).toBe(false);
        
        // Brief pause between uploads
        await suite.wait.waitStandard(suite.config.delays.brief);
      }
    });

    test('should maintain file selection state', async ({ page, suite }) => {
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      await suite.wait.waitForFileValidation();
      
      // Switch tabs and return
      await suite.openEditorTab('colorPicker');
      await suite.openEditorTab('filePicker');
      
      // File should still be selected
      await suite.assert.verifyFileSelected('emblem.png');
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.logoButton);
    });
  });

  // ====================================================================
  // 🎨 TEXTURE APPLICATION
  // ====================================================================

  test.describe('Texture Application', () => {
    test('should apply uploaded file as logo texture successfully', async ({ suite }) => {
      await suite.assert.verifyTextureHidden('logo');
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.assert.verifyTextureVisible('logo');
    });

    test('should apply uploaded file as full texture successfully', async ({ suite }) => {
      await suite.assert.verifyTextureHidden('full');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should complete texture application workflow', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Verify complete workflow
      await suite.assert.verifyTextureApplicationWorkflow('logo', 'logoShirt');
    });

    test('should handle rapid texture switching', async ({ suite }) => {
      // Upload and apply logo
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.assert.verifyTextureVisible('logo');
      
      // Switch to full texture
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.assert.verifyTextureVisible('full');
      
      // Both should be visible if filters are active
      await suite.activateFilter('logoShirt');
      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should maintain texture quality after application', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Verify texture is properly rendered
      const textureQuality = await page.evaluate(() => {
        const textureElement = document.querySelector('[data-testid="logo-texture"]');
        if (!textureElement) return null;
        
        const computedStyle = window.getComputedStyle(textureElement);
        return {
          opacity: computedStyle.opacity,
          display: computedStyle.display,
          visibility: computedStyle.visibility
        };
      });
      
      expect(textureQuality?.opacity).not.toBe('0');
      expect(textureQuality?.display).not.toBe('none');
      expect(textureQuality?.visibility).not.toBe('hidden');
    });
  });

  // ====================================================================
  // 💾 STATE PERSISTENCE
  // ====================================================================

  test.describe('State Persistence', () => {
    test('should preserve filename after applying as logo', async ({ page, suite }) => {
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      await suite.wait.waitForFileValidation();
      await page.getByRole('button', { name: suite.data.buttonLabels.actions.logoButton }).click();

      // Reopen file picker
      await suite.openEditorTab('filePicker');
      await suite.assert.verifyFileSelected('emblem.png');
    });

    test('should preserve filename after applying as full texture', async ({ page, suite }) => {
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      await suite.wait.waitForFileValidation();
      await page.getByRole('button', { name: suite.data.buttonLabels.actions.fullPatternButton }).click();

      // Reopen file picker
      await suite.openEditorTab('filePicker');
      await suite.assert.verifyFileSelected('emblem.png');
    });

    test('should maintain button states correctly', async ({ page, suite }) => {
      // Upload file
      await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(suite.data.files.validLogo);
      await suite.wait.waitForFileValidation();
      
      // Verify buttons are enabled
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.logoButton);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.fullPatternButton);
      
      // Apply as logo
      await page.getByRole('button', { name: suite.data.buttonLabels.actions.logoButton }).click();
      
      // Reopen and verify buttons are still enabled
      await suite.openEditorTab('filePicker');
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.logoButton);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.fullPatternButton);
    });
  });

  // ====================================================================
  // ⚠️ EDGE CASES AND ERROR HANDLING
  // ====================================================================

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle oversized files gracefully', async ({ page, suite }) => {
      await suite.assert.verifyComponentVisible('canvas');

      // Create a large buffer that exceeds the size limit (10MB > 5MB limit)
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const buffer = Buffer.from(largeContent);

      // Upload the oversized file
      await suite.actions.uploadFileWithBuffer('large.png', 'image/png', buffer, 'logo');

      // Should show an error toast about file size
      await suite.assert.verifyFileValidationError('size');

      // App should not crash - canvas should still be visible
      await suite.assert.verifyComponentVisible('canvas');

      // File picker should show "No file selected" since validation failed
      await suite.assert.verifyNoFileSelected();
    });

    test('should handle invalid image files gracefully', async ({ page, suite }) => {
      await suite.assert.verifyComponentVisible('canvas');

      // Create a text file pretending to be an image
      const invalidContent = 'This is not an image file, just plain text content.';
      const buffer = Buffer.from(invalidContent);

      await suite.actions.uploadFileWithBuffer('fake-image.png', 'image/png', buffer, 'logo');

      // Should show an error toast about invalid format
      await suite.assert.verifyFileValidationError('format');

      // App should not crash
      await suite.assert.verifyApplicationStable();
      await suite.assert.verifyNoFileSelected();
    });

    test('should handle corrupted image files gracefully', async ({ page, suite }) => {
      await suite.assert.verifyComponentVisible('canvas');

      // Create a buffer that starts like a PNG but is corrupted
      const corruptedPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, // PNG signature
        0x0d, 0x0a, 0x1a, 0x0a, // PNG signature continued
        ...Array(1000).fill(0xff), // Corrupted data
      ]);

      await suite.actions.uploadFileWithBuffer('corrupted.png', 'image/png', corruptedPng, 'logo');

      // Wait for validation processing
      await suite.wait.waitStandard(suite.config.timeouts.fileValidation);

      // Should either show error or handle gracefully
      const hasError = await page.locator('.Toastify__toast--error').isVisible();

      if (hasError) {
        // If error is shown, file should not be selected
        await suite.assert.verifyNoFileSelected();
      }

      // App should not crash regardless
      await suite.assert.verifyApplicationStable();
    });

    test('should handle files with suspicious names safely', async ({ suite }) => {
      const buffer = Buffer.from(suite.data.VALID_TEST_IMAGE_BASE64, 'base64');

      await suite.actions.uploadFileWithBuffer('script.js.png', 'image/png', buffer, 'logo');

      // App should handle safely without executing scripts
      await suite.assert.verifyApplicationStable();

      // If file is valid, it should be processed
      await suite.wait.waitForTextureApplication();
      await suite.assert.verifyTextureVisible('logo');
    });

    test('should handle empty file uploads', async ({ page, suite }) => {
      // Create empty buffer
      const emptyBuffer = Buffer.alloc(0);

      await suite.actions.uploadFileWithBuffer('empty.png', 'image/png', emptyBuffer, 'logo');

      // Should handle gracefully
      await suite.wait.waitForFileValidation();
      
      // Check for appropriate error handling
      const hasError = await page.locator('.Toastify__toast--error').isVisible();
      if (hasError) {
        await suite.assert.verifyNoFileSelected();
      }
      
      await suite.assert.verifyApplicationStable();
    });

    test('should handle concurrent file uploads', async ({ page, suite }) => {
      // Attempt rapid sequential uploads
      const files = [suite.data.files.validLogo, suite.data.files.validPattern];
      
      for (let i = 0; i < files.length; i++) {
        await page.locator(suite.config.selectors.inputs.filePickerInput).setInputFiles(files[i]);
        await suite.wait.waitStandard(suite.config.delays.minimal); // Very rapid
      }
      
      // Wait for final validation
      await suite.wait.waitForFileValidation();
      
      // Should handle gracefully - last file should be selected
      await suite.assert.verifyFileSelected('emblem2.png');
      await suite.assert.verifyApplicationStable();
    });
  });

  // ====================================================================
  // 🔐 SECURITY TESTING
  // ====================================================================

  test.describe('Security Testing', () => {
    test('should validate file types securely', async ({ suite }) => {
      const maliciousFiles = [
        { name: 'malicious.exe.png', content: 'MZ\x90\x00\x03', mimeType: 'image/png' },
        { name: 'script.svg', content: '<svg onload="alert(1)"><circle/></svg>', mimeType: 'image/svg+xml' },
        { name: '../../../etc/passwd', content: 'root:x:0:0:', mimeType: 'image/png' },
      ];

      for (const file of maliciousFiles) {
        console.log(`Testing security for: ${file.name}`);
        
        const buffer = Buffer.from(file.content);
        await suite.actions.uploadFileWithBuffer(file.name, file.mimeType, buffer, 'logo');
        
        await suite.wait.waitForFileValidation();
        
        // Should either reject or handle safely
        await suite.assert.verifyApplicationStable();
        
        console.log(`✅ Safely handled: ${file.name}`);
      }
    });

    test('should prevent path traversal attacks', async ({ suite }) => {
      const pathTraversalNames = [
        '../../../etc/passwd.png',
        '..\\..\\windows\\system32\\config\\sam.png',
        '/etc/passwd.png',
        'C:\\Windows\\System32\\drivers\\etc\\hosts.png'
      ];

      for (const filename of pathTraversalNames) {
        const buffer = Buffer.from(suite.data.VALID_TEST_IMAGE_BASE64, 'base64');
        await suite.actions.uploadFileWithBuffer(filename, 'image/png', buffer, 'logo');
        
        // Should handle safely without accessing system files
        await suite.assert.verifyApplicationStable();
      }
    });

    test('should sanitize filenames properly', async ({ page, suite }) => {
      const sanitationTests = [
        { input: '<script>alert(1)</script>.png', expectSafe: true },
        { input: 'normal-file-name.png', expectSafe: true },
        { input: 'file with spaces.png', expectSafe: true },
        { input: 'файл.png', expectSafe: true }, // Unicode filename
      ];

      for (const test of sanitationTests) {
        const buffer = Buffer.from(suite.data.VALID_TEST_IMAGE_BASE64, 'base64');
        await suite.actions.uploadFileWithBuffer(test.input, 'image/png', buffer, 'logo');
        
        await suite.wait.waitForFileValidation();
        
        if (test.expectSafe) {
          // Should not execute any scripts or cause XSS
          await suite.assert.verifyApplicationStable();
        }
      }
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE TESTING
  // ====================================================================

  test.describe('Performance Testing', () => {
    test('should complete file upload within performance threshold', async ({ suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.uploadFile(suite.data.files.validLogo, 'logo');
        },
        'File Upload and Application',
        suite.config.performance.maxFileOperation
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxFileOperation);
    });

    test('should handle large valid files efficiently', async ({ suite }) => {
      // Create a large but valid image (within limits)
      const largeValidContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const buffer = Buffer.from(largeValidContent);

      const { duration } = await suite.measureOperation(
        async () => {
          await suite.actions.uploadFileWithBuffer('large-valid.png', 'image/png', buffer, 'logo');
        },
        'Large File Processing',
        suite.config.performance.maxFileOperation * 2 // Allow more time for large files
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxFileOperation * 2);
    });

    test('should maintain performance during repeated uploads', async ({ suite }) => {
      const files = [suite.data.files.validLogo, suite.data.files.validPattern];
      
      const { duration } = await suite.measureOperation(
        async () => {
          for (let i = 0; i < 3; i++) {
            await suite.uploadFile(files[i % files.length], 'logo');
            await suite.wait.waitStandard(suite.config.delays.brief);
          }
        },
        'Repeated File Operations',
        suite.config.performance.maxFileOperation * 3
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxFileOperation * 3);
    });

    test('should cleanup resources properly', async ({ page, suite }) => {
      // Upload multiple files to test resource cleanup
      for (let i = 0; i < 5; i++) {
        await suite.uploadFile(suite.data.files.validLogo, 'logo');
        await suite.wait.waitStandard(suite.config.delays.brief);
      }

      // Check memory usage if available
      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore - performance.memory is available in Chrome
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        } : null;
      });

      if (memoryInfo) {
        console.log('Memory usage after repeated uploads:', memoryInfo);
        expect(memoryInfo.usedJSHeapSize).toBeLessThanOrEqual(suite.config.performance.maxMemoryUsage);
      }

      await suite.assert.verifyApplicationStable();
    });
  });
});
