/**
 * 💾 IMAGE DOWNLOAD TEST SUITE
 * Testing download functionality, button states, and filename validation
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('💾 Image Download', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: true,
      openEditorTab: 'imageDownload',
    });
  });

  // ====================================================================
  // 🎯 INITIAL STATE
  // ====================================================================

  test.describe('Initial State', () => {
    test('should display download interface correctly', async ({ page, suite }) => {
      await suite.assert.verifyPickerOpen('imageDownload');
      await suite.assert.verifyComponentVisible('imageDownload');
      await expect(page.getByPlaceholder('e.g., my-shirt')).toBeVisible();
    });

    test('should have disabled buttons when no active content', async ({ suite }) => {
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should have disabled buttons when no filename provided', async ({ suite }) => {
      await suite.activateFilter('logoShirt');
      
      // Even with active filter, no filename means disabled buttons
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should show proper placeholder text', async ({ page }) => {
      const input = page.getByPlaceholder('e.g., my-shirt');
      await expect(input).toBeVisible();
      
      const placeholder = await input.getAttribute('placeholder');
      expect(placeholder).toBe('e.g., my-shirt');
    });
  });

  // ====================================================================
  // 🔘 BUTTON STATES WITH DEFAULT TEXTURES
  // ====================================================================

  test.describe('Button States with Default Textures', () => {
    test('should keep buttons disabled with default logo texture', async ({ page, suite }) => {
      await suite.activateFilter('logoShirt');
      await page.getByPlaceholder('e.g., my-shirt').fill('test-filename');

      // Default logo should keep buttons disabled
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should keep buttons disabled with default full texture', async ({ page, suite }) => {
      await suite.activateFilter('stylishShirt');
      await page.getByPlaceholder('e.g., my-shirt').fill('test-filename');

      // Default pattern should keep buttons disabled
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadPattern);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should maintain disabled state even with valid filename', async ({ page, suite }) => {
      // Valid filename but no custom texture
      await page.getByPlaceholder('e.g., my-shirt').fill('valid-filename');
      
      // All download buttons should remain disabled
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadPattern);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadShirt);
    });
  });

  // ====================================================================
  // ✅ BUTTON STATES WITH CUSTOM TEXTURES
  // ====================================================================

  test.describe('Button States with Custom Textures', () => {
    test('should enable buttons when logo uploaded and filename provided', async ({ page, suite }) => {
      // Upload custom logo
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Navigate to download tab and provide filename
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('my-custom-logo');

      // Buttons should now be enabled
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should enable buttons when full texture uploaded and filename provided', async ({ page, suite }) => {
      // Upload custom pattern
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      
      // Navigate to download tab and provide filename
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('my-custom-pattern');

      // Buttons should now be enabled
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadPattern);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should enable appropriate buttons for multiple textures', async ({ page, suite }) => {
      // Upload both logo and pattern
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      
      // Navigate to download tab and provide filename
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('multi-texture');

      // All relevant buttons should be enabled
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadPattern);
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should update button states dynamically', async ({ page, suite }) => {
      // Start with no filename - buttons disabled
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      
      // Add filename - buttons should enable
      await page.getByPlaceholder('e.g., my-shirt').fill('dynamic-test');
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadLogo);
      
      // Clear filename - buttons should disable again
      await page.getByPlaceholder('e.g., my-shirt').fill('');
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
    });
  });

  // ====================================================================
  // 📥 DOWNLOAD FUNCTIONALITY
  // ====================================================================

  test.describe('Download Functionality', () => {
    test('should download logo with correct filename', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const download = await suite.downloadImage('my-custom-logo', suite.data.buttonLabels.actions.downloadLogo);

      expect(download.suggestedFilename()).toContain('my-custom-logo');
    });

    test('should download pattern with correct filename', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validPattern, 'full');

      const download = await suite.downloadImage('my-custom-pattern', suite.data.buttonLabels.actions.downloadPattern);

      expect(download.suggestedFilename()).toContain('my-custom-pattern');
    });

    test('should download shirt canvas with correct filename', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const download = await suite.downloadImage('my-custom-shirt', suite.data.buttonLabels.actions.downloadShirt);

      expect(download.suggestedFilename()).toContain('my-custom-shirt');
    });

    test('should reset filename after successful download', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.downloadImage('reset-test', suite.data.buttonLabels.actions.downloadLogo);

      // Filename input should be cleared
      const filenameInput = page.getByPlaceholder('e.g., my-shirt');
      await expect(filenameInput).toHaveValue('');
    });

    test('should disable buttons after filename reset', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.downloadImage('disable-test', suite.data.buttonLabels.actions.downloadLogo);

      // Buttons should be disabled after reset
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadShirt);
    });

    test('should complete download within performance threshold', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const { duration } = await suite.measureOperation(
        async () => {
          await suite.downloadImage('performance-test', suite.data.buttonLabels.actions.downloadLogo);
        },
        'Download Operation',
        suite.config.performance.maxInteractionTime
      );

      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
    });

    test('should handle multiple downloads sequentially', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');

      const downloads = [
        suite.data.buttonLabels.actions.downloadLogo,
        suite.data.buttonLabels.actions.downloadPattern,
        suite.data.buttonLabels.actions.downloadShirt
      ];

      for (let i = 0; i < downloads.length; i++) {
        const filename = `sequential-${i}`;
        const download = await suite.downloadImage(filename, downloads[i]);
        expect(download.suggestedFilename()).toContain(filename);
        
        // Brief pause between downloads
        await suite.wait.waitStandard(suite.config.delays.brief);
      }
    });
  });

  // ====================================================================
  // 🏷️ LABEL CHANGES BASED ON FILTER
  // ====================================================================

  test.describe('Dynamic Label Changes', () => {
    test('should show "Download Logo" when logo content is active', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('logo-test');

      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadLogo })
      ).toBeVisible();
    });

    test('should show "Download Pattern" when full texture is active', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('pattern-test');

      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadPattern })
      ).toBeVisible();
    });

    test('should show both labels when both textures are active', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('both-test');

      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadLogo })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadPattern })
      ).toBeVisible();
    });

    test('should always show shirt download option when content is available', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('shirt-test');

      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadShirt })
      ).toBeVisible();
    });
  });

  // ====================================================================
  // ✏️ FILENAME VALIDATION
  // ====================================================================

  test.describe('Filename Validation', () => {
    test('should handle whitespace-only filenames', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('   ');

      // Whitespace-only should keep buttons disabled
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
    });

    test('should trim whitespace from filenames during download', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const download = await suite.downloadImage('  trimmed-filename  ', suite.data.buttonLabels.actions.downloadLogo);

      expect(download.suggestedFilename()).toContain('trimmed-filename');
      expect(download.suggestedFilename()).not.toMatch(/^\s+|\s+$/);
    });

    test('should handle special characters in filenames', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const specialFilenames = [
        'file-with-dashes',
        'file_with_underscores',
        'file123with456numbers',
        'file.with.dots'
      ];

      for (const filename of specialFilenames) {
        const download = await suite.downloadImage(filename, suite.data.buttonLabels.actions.downloadLogo);
        expect(download.suggestedFilename()).toContain(filename);
        
        // Brief pause between downloads
        await suite.wait.waitStandard(suite.config.delays.brief);
      }
    });

    test('should handle very long filenames gracefully', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const longFilename = 'very-long-filename-that-exceeds-normal-length-expectations-for-testing-edge-cases';
      const download = await suite.downloadImage(longFilename, suite.data.buttonLabels.actions.downloadLogo);

      // Should either truncate or handle gracefully
      expect(download.suggestedFilename()).toBeTruthy();
    });

    test('should prevent malicious filename injection', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');

      const maliciousFilenames = suite.data.filenames.invalid;

      for (const maliciousName of maliciousFilenames) {
        await suite.testMaliciousInput(maliciousName, 'filename', 'sanitize');
        
        // Application should remain stable
        await suite.assert.verifyApplicationStable();
      }
    });

    test('should handle empty filename edge case', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      
      // Empty filename should disable buttons
      await page.getByPlaceholder('e.g., my-shirt').fill('');
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
      
      // Add and remove filename
      await page.getByPlaceholder('e.g., my-shirt').fill('test');
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadLogo);
      
      await page.getByPlaceholder('e.g., my-shirt').fill('');
      await suite.assert.verifyButtonDisabled(suite.data.buttonLabels.actions.downloadLogo);
    });
  });

  // ====================================================================
  // ⚠️ ERROR HANDLING
  // ====================================================================

  test.describe('Error Handling', () => {
    test('should not trigger download for disabled buttons', async ({ page }) => {
      let downloadTriggered = false;
      page.on('download', () => {
        downloadTriggered = true;
      });

      const logoButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadLogo });
      await expect(logoButton).toBeDisabled();
      
      // Force click should not trigger download
      await logoButton.click({ force: true });
      await page.waitForTimeout(1000); // Wait to see if download triggers

      expect(downloadTriggered).toBe(false);
    });

    test('should handle download failures gracefully', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Mock download failure
      await page.route('**/download/**', route => route.abort('failed'));
      
      try {
        await suite.downloadImage('failure-test', suite.data.buttonLabels.actions.downloadLogo);
      } catch (error) {
        // Download failure should be handled gracefully
        console.log('Download failure handled:', error);
      }
      
      // Application should remain stable
      await suite.assert.verifyApplicationStable();
      
      await page.unroute('**/download/**');
    });

    test('should handle rapid button clicking', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      await page.getByPlaceholder('e.g., my-shirt').fill('rapid-click-test');

      const logoButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadLogo });
      
      // Rapid clicking should not cause issues
      await logoButton.click();
      await logoButton.click();
      await logoButton.click();
      
      await suite.assert.verifyApplicationStable();
    });

    test('should handle network interruption during download', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Simulate network interruption
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      try {
        await suite.downloadImage('network-test', suite.data.buttonLabels.actions.downloadLogo);
      } catch (error) {
        console.log('Network interruption handled:', error);
      }
      
      await suite.assert.verifyApplicationStable();
      await page.unroute('**/*');
    });
  });

  // ====================================================================
  // 🎯 ACCESSIBILITY
  // ====================================================================

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      
      // Tab to filename input
      await page.keyboard.press('Tab');
      const filenameInput = page.getByPlaceholder('e.g., my-shirt');
      await expect(filenameInput).toBeFocused();
      
      // Type filename
      await page.keyboard.type('keyboard-nav-test');
      
      // Tab to download button
      await page.keyboard.press('Tab');
      const logoButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadLogo });
      await expect(logoButton).toBeFocused();
      
      // Should be able to activate with Enter
      await expect(logoButton).toBeEnabled();
    });

    test('should have proper ARIA labels', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      
      // Check for proper labeling
      const filenameInput = page.getByPlaceholder('e.g., my-shirt');
      const inputLabel = await filenameInput.getAttribute('aria-label');
      const inputId = await filenameInput.getAttribute('id');
      
      // Should have proper accessibility attributes
      expect(inputLabel || inputId).toBeTruthy();
      
      // Buttons should have descriptive text
      const logoButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.downloadLogo });
      const buttonText = await logoButton.textContent();
      expect(buttonText).toBeTruthy();
      expect(buttonText!.length).toBeGreaterThan(5); // Should be descriptive
    });

    test('should provide clear focus indicators', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      
      const filenameInput = page.getByPlaceholder('e.g., my-shirt');
      await filenameInput.focus();
      await expect(filenameInput).toBeFocused();
      
      // Should have visible focus indicator
      const focusStyles = await filenameInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow
        };
      });
      
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' || 
        focusStyles.boxShadow !== 'none';
        
      expect(hasFocusIndicator).toBeTruthy();
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE AND USABILITY
  // ====================================================================

  test.describe('Performance and Usability', () => {
    test('should respond to filename input immediately', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      
      const startTime = Date.now();
      await page.getByPlaceholder('e.g., my-shirt').fill('immediate-response');
      
      // Button should enable quickly
      await suite.assert.verifyButtonEnabled(suite.data.buttonLabels.actions.downloadLogo);
      const responseTime = Date.now() - startTime;
      
      // Should respond within 500ms
      expect(responseTime).toBeLessThan(500);
    });

    test('should handle large filename inputs efficiently', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.openEditorTab('imageDownload');
      
      const largeFilename = 'x'.repeat(1000);
      
      const { duration } = await suite.measureOperation(
        async () => {
          await page.getByPlaceholder('e.g., my-shirt').fill(largeFilename);
        },
        'Large Filename Input',
        1000
      );
      
      expect(duration).toBeLessThan(1000);
      await suite.assert.verifyApplicationStable();
    });

    test('should maintain responsiveness during multiple operations', async ({ suite }) => {
      // Perform multiple operations rapidly
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.selectColor(suite.data.colors.purple);
      await suite.openEditorTab('imageDownload');
      
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.downloadImage('multi-op-test', suite.data.buttonLabels.actions.downloadShirt);
        },
        'Multi-Operation Download',
        suite.config.performance.maxInteractionTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
    });
  });
});
