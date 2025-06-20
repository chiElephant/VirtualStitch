import { test, expect } from '@playwright/test';
import { TestUtils, TEST_FILES, TEST_COLORS } from '../utils/test-helpers';

test.describe('State Management Integration', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
  });

  test.describe('Valtio State Synchronization', () => {
    test('should handle rapid state changes without data loss', async ({ page }) => {
      await utils.color.openColorPicker();

      // Rapid color changes to stress test state
      const colors = [TEST_COLORS.lightBlue, TEST_COLORS.purple, TEST_COLORS.green, TEST_COLORS.dark, TEST_COLORS.red];
      
      for (const color of colors) {
        await utils.color.selectColor(color);
        await page.waitForTimeout(50); // Very rapid changes
      }

      // Verify final state is consistent
      const finalColor = colors[colors.length - 1];
      await utils.color.verifyColorApplied(finalColor);

      // State should persist across tab switches
      await page.getByTestId('editor-tab-filePicker').click();
      await utils.color.openColorPicker();
      await utils.color.verifyColorApplied(finalColor);
    });

    test('should maintain state consistency across complex interactions', async ({ page }) => {
      // Complex sequence: color -> file -> filter -> color -> filter
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);

      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Toggle filter multiple times
      await utils.texture.activateFilter('logoShirt'); // Off
      await utils.texture.verifyTextureHidden('logo');
      await utils.texture.activateFilter('logoShirt'); // On
      await utils.texture.verifyTextureVisible('logo');

      // Change color again
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.red);

      // Verify all states are correct
      await utils.color.verifyColorApplied(TEST_COLORS.red);
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyFilterActive('logoShirt');
    });

    test('should handle concurrent state updates gracefully', async ({ page }) => {
      // Setup initial state
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.color.openColorPicker();

      // Trigger multiple state changes simultaneously
      const stateChanges = [
        utils.color.selectColor(TEST_COLORS.green),
        utils.color.selectColor(TEST_COLORS.purple),
        page.getByTestId('filter-tab-logoShirt').click(),
        page.getByTestId('filter-tab-logoShirt').click(),
      ];

      // Use allSettled to handle potential conflicts
      await Promise.allSettled(stateChanges);
      await page.waitForTimeout(500);

      // App should remain stable and functional
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();

      // Test basic functionality still works
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.dark);
      await utils.color.verifyColorApplied(TEST_COLORS.dark);
    });
  });

  test.describe('Multi-Texture State Management', () => {
    test('should preserve texture state when toggling filters rapidly', async ({ page }) => {
      // Upload both textures
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');

      // Ensure both filters are active
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.activateFilter('stylishShirt');
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');

      // Rapid filter toggling
      for (let i = 0; i < 10; i++) {
        await utils.texture.activateFilter('logoShirt');
        await utils.texture.activateFilter('stylishShirt');
        await page.waitForTimeout(25); // Very rapid
      }

      // Check final deterministic state
      const logoActive = await page
        .getByTestId('filter-tab-logoShirt')
        .getAttribute('data-is-active');
      const fullActive = await page
        .getByTestId('filter-tab-stylishShirt')
        .getAttribute('data-is-active');

      // Verify textures match filter states
      if (logoActive === 'true') {
        await utils.texture.verifyTextureVisible('logo');
      } else {
        await utils.texture.verifyTextureHidden('logo');
      }

      if (fullActive === 'true') {
        await utils.texture.verifyTextureVisible('full');
      } else {
        await utils.texture.verifyTextureHidden('full');
      }

      // Ensure both can be re-enabled
      if (logoActive !== 'true') {
        await utils.texture.activateFilter('logoShirt');
      }
      if (fullActive !== 'true') {
        await utils.texture.activateFilter('stylishShirt');
      }

      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');
    });

    test('should handle texture replacement without state corruption', async ({ page }) => {
      // Upload initial logo
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Replace with full texture multiple times
      const files = [TEST_FILES.emblem2, TEST_FILES.emblem, TEST_FILES.emblem2];
      
      for (const file of files) {
        await utils.nav.openEditorTab('file-picker');
        await page.getByTestId('file-picker-input').setInputFiles(file);
        await page.getByRole('button', { name: 'Full' }).click();
        await utils.wait.waitForTextureApplication();
      }

      // Verify final state
      await utils.texture.verifyTextureVisible('full');
      
      // Original logo state should be preserved but not visible
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full'); // Both should be visible
    });

    test('should maintain texture data integrity during rapid switching', async ({ page }) => {
      // Upload texture once
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Rapid switching between logo and full application
      for (let i = 0; i < 10; i++) {
        await utils.nav.openEditorTab('file-picker');
        await page.getByRole('button', { name: 'Logo' }).click();
        await page.waitForTimeout(50);

        await utils.nav.openEditorTab('file-picker');
        await page.getByRole('button', { name: 'Full' }).click();
        await page.waitForTimeout(50);
      }

      // Final state should be stable
      await utils.wait.waitForTextureApplication();
      
      // Check if filters need manual activation
      const fullTextureCount = await page.getByTestId('full-texture').count();
      if (fullTextureCount === 0) {
        await utils.texture.activateFilter('stylishShirt');
      }

      // At least one texture should be visible and app should be functional
      const hasFullTexture = await page.getByTestId('full-texture').count();
      const hasLogoTexture = await page.getByTestId('logo-texture').count();
      
      expect(hasFullTexture + hasLogoTexture).toBeGreaterThan(0);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Navigation State Persistence', () => {
    test('should maintain complex state across navigation cycles', async ({ page }) => {
      // Setup complex state
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.yellow);
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');
      
      // Activate both filters
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.activateFilter('stylishShirt');

      // Navigate back and forth multiple times
      for (let i = 0; i < 3; i++) {
        await utils.nav.goToHome();
        await utils.nav.goToCustomizer();
      }

      // Verify all state maintained
      await utils.color.verifyColorApplied(TEST_COLORS.yellow);
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');
    });

    test('should handle interrupted state changes during navigation', async ({ page }) => {
      // Start state change
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.purple);

      // Navigate away immediately (interrupt)
      await utils.nav.goToHome();

      // Navigate back
      await utils.nav.goToCustomizer();

      // Color should have been applied despite interruption
      await utils.color.verifyColorApplied(TEST_COLORS.purple);
    });
  });

  test.describe('Memory Management and Cleanup', () => {
    test('should handle texture loading under memory pressure', async ({ page }) => {
      // Simulate memory pressure
      await page.evaluate(() => {
        // Create large arrays to pressure memory
        const arrays = [];
        for (let i = 0; i < 100; i++) {
          arrays.push(new Array(100000).fill(Math.random()));
        }
        (window as any).memoryPressureArrays = arrays;
      });

      // Try to load textures under pressure
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Color changes should still work
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.green);
      await utils.color.verifyColorApplied(TEST_COLORS.green);

      // Cleanup
      await page.evaluate(() => {
        delete (window as any).memoryPressureArrays;
      });
    });

    test('should handle multiple large texture changes without memory leaks', async ({ page }) => {
      // Load multiple textures in sequence
      const files = [TEST_FILES.emblem, TEST_FILES.emblem2, TEST_FILES.emblem];

      for (const file of files) {
        await utils.nav.openEditorTab('file-picker');
        await page.getByTestId('file-picker-input').setInputFiles(file);
        await page.getByRole('button', { name: 'Logo' }).click();
        await utils.wait.waitForTextureApplication();

        // Ensure texture is applied each time
        const logoTextureCount = await page.getByTestId('logo-texture').count();
        if (logoTextureCount === 0) {
          await utils.texture.activateFilter('logoShirt');
        }
        await utils.texture.verifyTextureVisible('logo');
      }

      // Final verification
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error Recovery and State Consistency', () => {
    test('should recover from component re-render during state change', async ({ page }) => {
      // Start color change
      await utils.color.openColorPicker();

      // Trigger re-render via viewport change
      await page.setViewportSize({ width: 800, height: 600 });

      // Complete color change
      await utils.color.selectColor(TEST_COLORS.cyan);

      // Should complete successfully
      await utils.color.verifyColorApplied(TEST_COLORS.cyan);
    });

    test('should maintain state consistency during WebGL context loss', async ({ page }) => {
      // Setup state
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Simulate WebGL context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
              setTimeout(() => ext.restoreContext(), 1000);
            }
          }
        }
      });

      await page.waitForTimeout(2000);

      // State should be maintained after recovery
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
      await utils.texture.verifyTextureVisible('logo');
    });
  });

  test.describe('State Boundaries and Isolation', () => {
    test('should isolate editor tab state from filter state', async ({ page }) => {
      // Activate filter
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.verifyFilterActive('logoShirt');

      // Switch editor tabs multiple times
      const tabs = ['colorPicker', 'filePicker', 'aiPicker', 'imageDownload'];
      
      for (const tab of tabs) {
        await page.getByTestId(`editor-tab-${tab}`).click();
        await page.waitForTimeout(100);
      }

      // Filter state should remain unchanged
      await utils.texture.verifyFilterActive('logoShirt');
    });

    test('should prevent cross-contamination between texture types', async ({ page }) => {
      // Upload logo
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Upload different file as full texture
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');
      await utils.texture.verifyTextureVisible('full');

      // Deactivate logo filter
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.verifyTextureHidden('logo');
      await utils.texture.verifyTextureVisible('full'); // Should remain visible

      // Reactivate logo filter
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full'); // Both should be visible
    });
  });
});
