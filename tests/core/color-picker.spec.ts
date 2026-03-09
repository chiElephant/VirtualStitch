/**
 * 🎨 COLOR PICKER TEST SUITE
 * Comprehensive testing of color selection and application functionality
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🎨 Color Picker', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: true,
      openEditorTab: 'colorPicker',
    });
  });

  // ====================================================================
  // 🎯 INITIAL STATE
  // ====================================================================

  test.describe('Initial State', () => {
    test('should initialize with default color', async ({ suite }) => {
      await suite.assert.verifyColorApplied(suite.data.colors.default);
    });

    test('should display color picker interface correctly', async ({ suite }) => {
      await suite.assert.verifyPickerOpen('colorPicker');
      await suite.assert.verifyComponentVisible('colorPicker');
    });

    test('should show all essential UI elements', async ({ page }) => {
      await expect(page.getByTestId('color-picker')).toBeVisible();
      await expect(page.locator('.hue-horizontal')).toBeVisible();
      
      // Verify preset color buttons are present
      const colorButtons = page.locator('[title]').filter({ hasText: '#' });
      const buttonCount = await colorButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should have accessible color picker controls', async ({ page, suite }) => {
      // Verify hue slider is focusable
      await suite.assert.verifyElementAccessible('.hue-horizontal');
    });
  });

  // ====================================================================
  // 🌈 COLOR SELECTION
  // ====================================================================

  test.describe('Color Selection', () => {
    test('should update shirt and button colors when selecting presets', async ({ suite }) => {
      await suite.selectColor(suite.data.colors.lightBlue);
      await suite.assert.verifyColorApplied(suite.data.colors.lightBlue);
    });

    // Test all available preset colors
    Object.entries(suite.data.colors).forEach(([colorName, colorValue]) => {
      if (colorName !== 'default') { // Skip default as it's tested separately
        test(`should apply ${colorName} color (${colorValue}) correctly`, async ({ suite }) => {
          await suite.selectColor(colorValue);
          await suite.assert.verifyColorApplied(colorValue);
        });
      }
    });

    test('should handle rapid color changes smoothly', async ({ page, suite }) => {
      const rapidColors = [
        suite.data.colors.lightBlue,
        suite.data.colors.purple,
        suite.data.colors.green,
        suite.data.colors.red,
        suite.data.colors.yellow
      ];
      
      for (const color of rapidColors) {
        await page.getByTitle(color).click();
        await suite.wait.waitStandard(suite.config.delays.minimal); // Rapid succession
      }
      
      const finalColor = rapidColors[rapidColors.length - 1];
      await suite.assert.verifyColorApplied(finalColor);
    });

    test('should maintain color selection during other operations', async ({ suite }) => {
      const selectedColor = suite.data.colors.purple;
      
      await suite.selectColor(selectedColor);
      
      // Perform other operations
      await suite.openEditorTab('filePicker');
      await suite.openEditorTab('aiPicker');
      await suite.openEditorTab('colorPicker');
      
      // Color should persist
      await suite.assert.verifyColorApplied(selectedColor);
    });

    test('should apply colors to all relevant UI elements', async ({ page, suite }) => {
      const testColor = suite.data.colors.cyan;
      
      await suite.selectColor(testColor);
      
      // Verify color application across multiple elements
      await expect(page.getByTestId(`canvas-color-${testColor}`)).toHaveCount(1);
      await expect(page.getByTestId(`button-color-${testColor}`)).toHaveCount(1);
    });

    test('should provide visual feedback for selected color', async ({ page, suite }) => {
      const selectedColor = suite.data.colors.lightGray;
      
      await suite.selectColor(selectedColor);
      
      // Check that the selected color button has appropriate visual state
      const colorButton = page.getByTitle(selectedColor);
      const buttonStyles = await colorButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          border: styles.border,
          outline: styles.outline,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have some visual indication of selection
      const hasVisualFeedback = 
        buttonStyles.border !== 'none' || 
        buttonStyles.outline !== 'none' || 
        buttonStyles.boxShadow !== 'none';
        
      expect(hasVisualFeedback).toBeTruthy();
    });
  });

  // ====================================================================
  // 🎛️ CUSTOM COLOR INPUT
  // ====================================================================

  test.describe('Custom Color Input', () => {
    test('should update color when using hue slider', async ({ page, suite }) => {
      const backButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack });
      const initialTestId = await backButton.getAttribute('data-testid');

      // Interact with hue slider
      await page.locator('.hue-horizontal').click({ position: { x: 20, y: 5 } });
      await suite.wait.waitStandard(suite.config.delays.brief);

      // Verify color changed
      const newTestId = await backButton.getAttribute('data-testid');
      expect(newTestId).not.toBe(initialTestId);
    });

    test('should update color when using saturation/lightness picker', async ({ page, suite }) => {
      const saturationPicker = page.locator('.saturation-white');
      
      if (await saturationPicker.isVisible()) {
        const initialColor = await page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack }).getAttribute('data-testid');
        
        await saturationPicker.click({ position: { x: 50, y: 50 } });
        await suite.wait.waitStandard(suite.config.delays.brief);
        
        const newColor = await page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack }).getAttribute('data-testid');
        expect(newColor).not.toBe(initialColor);
      }
    });

    test('should handle custom color input edge cases', async ({ page, suite }) => {
      // Test extreme hue values
      const hueSlider = page.locator('.hue-horizontal');
      
      // Click at far left (hue 0)
      await hueSlider.click({ position: { x: 0, y: 5 } });
      await suite.wait.waitStandard(suite.config.delays.brief);
      await suite.assert.verifyApplicationStable();
      
      // Click at far right (hue 360)
      await hueSlider.click({ position: { x: -1, y: 5 } }); // -1 for far right
      await suite.wait.waitStandard(suite.config.delays.brief);
      await suite.assert.verifyApplicationStable();
    });

    test('should provide smooth color transitions during slider interaction', async ({ page, suite }) => {
      const hueSlider = page.locator('.hue-horizontal');
      const positions = [10, 30, 50, 70, 90];
      
      for (const x of positions) {
        await hueSlider.click({ position: { x, y: 5 } });
        await suite.wait.waitStandard(suite.config.delays.minimal);
        
        // Verify app remains stable during rapid changes
        await suite.assert.verifyApplicationStable();
      }
    });
  });

  // ====================================================================
  // 💾 STATE PERSISTENCE
  // ====================================================================

  test.describe('State Persistence', () => {
    test('should preserve selected color when switching tabs', async ({ suite }) => {
      const testColor = suite.data.colors.lightBlue;
      
      await suite.selectColor(testColor);
      
      // Switch to different tab and back
      await suite.openEditorTab('aiPicker');
      await suite.openEditorTab('colorPicker');
      
      await suite.assert.verifyColorApplied(testColor);
    });

    test('should maintain color state after texture operations', async ({ suite }) => {
      const selectedColor = suite.data.colors.purple;
      
      await suite.selectColor(selectedColor);
      
      // Upload a texture
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Color should persist
      await suite.assert.verifyColorApplied(selectedColor);
      await suite.assert.verifyTextureVisible('logo');
    });

    test('should preserve custom colors from slider interactions', async ({ page, suite }) => {
      // Set a custom color using slider
      await page.locator('.hue-horizontal').click({ position: { x: 75, y: 5 } });
      await suite.wait.waitStandard(suite.config.delays.brief);
      
      const customColorTestId = await page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack }).getAttribute('data-testid');
      
      // Switch tabs
      await suite.openEditorTab('filePicker');
      await suite.openEditorTab('colorPicker');
      
      // Custom color should persist
      const persistedColorTestId = await page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack }).getAttribute('data-testid');
      expect(persistedColorTestId).toBe(customColorTestId);
    });

    test('should remember last selected preset color', async ({ suite }) => {
      const colors = [suite.data.colors.red, suite.data.colors.green, suite.data.colors.blue];
      
      for (const color of colors) {
        await suite.selectColor(color);
        
        // Navigate away and back
        await suite.navigateToHome();
        await suite.navigateToCustomizer();
        await suite.openEditorTab('colorPicker');
        
        // Last color should persist
        await suite.assert.verifyColorApplied(color);
      }
    });
  });

  // ====================================================================
  // 🔄 INTERACTION WITH OTHER FEATURES
  // ====================================================================

  test.describe('Integration with Other Features', () => {
    test('should maintain color when textures are applied', async ({ suite }) => {
      const baseColor = suite.data.colors.dark;
      
      await suite.selectColor(baseColor);
      
      // Apply logo texture
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Base color should still be applied to non-textured areas
      await suite.assert.verifyColorApplied(baseColor);
      await suite.assert.verifyTextureVisible('logo');
    });

    test('should work correctly with filter toggles', async ({ suite }) => {
      await suite.selectColor(suite.data.colors.yellow);
      
      // Toggle filters while maintaining color
      await suite.activateFilter('logoShirt');
      await suite.activateFilter('stylishShirt');
      
      await suite.assert.verifyColorApplied(suite.data.colors.yellow);
    });

    test('should handle color changes during AI generation', async ({ suite }) => {
      await suite.setup({ mockRoutes: true, mockScenario: 'success' });
      
      // Start with one color
      await suite.selectColor(suite.data.colors.green);
      
      // Generate AI image
      await suite.generateAndVerifyAIImage('Test prompt', 'logo');
      
      // Change color after AI generation
      await suite.selectColor(suite.data.colors.red);
      
      // Both color and texture should be applied
      await suite.assert.verifyColorApplied(suite.data.colors.red);
      await suite.assert.verifyTextureVisible('logo');
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE AND USABILITY
  // ====================================================================

  test.describe('Performance and Usability', () => {
    test('should complete color selection within performance threshold', async ({ suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.selectColor(suite.data.colors.purple);
        },
        'Color Selection',
        suite.config.performance.maxInteractionTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
    });

    test('should handle rapid color changes without performance degradation', async ({ page, suite }) => {
      const colors = Object.values(suite.data.colors).slice(0, 8); // Test with 8 colors
      
      const { duration } = await suite.measureOperation(
        async () => {
          for (const color of colors) {
            await page.getByTitle(color).click();
            await suite.wait.waitStandard(suite.config.delays.minimal);
          }
        },
        'Rapid Color Changes',
        suite.config.performance.maxInteractionTime * 2
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime * 2);
    });

    test('should provide immediate visual feedback', async ({ page, suite }) => {
      const testColor = suite.data.colors.cyan;
      
      const startTime = Date.now();
      await page.getByTitle(testColor).click();
      
      // Check how quickly the color appears on canvas
      await expect(page.getByTestId(`canvas-color-${testColor}`)).toBeVisible({ timeout: 1000 });
      const feedbackTime = Date.now() - startTime;
      
      // Visual feedback should be near-instant (under 500ms)
      expect(feedbackTime).toBeLessThan(500);
    });

    test('should be responsive on different viewport sizes', async ({ page, suite }) => {
      const viewports = [
        suite.data.viewport.mobile,
        suite.data.viewport.tablet,
        suite.data.viewport.desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await suite.wait.waitStandard(suite.config.delays.brief);
        
        // Color picker should remain functional
        await suite.assert.verifyComponentVisible('colorPicker');
        
        // Should be able to select colors
        await suite.selectColor(suite.data.colors.lightBlue);
        await suite.assert.verifyColorApplied(suite.data.colors.lightBlue);
      }
    });

    test('should handle touch interactions on mobile viewports', async ({ page, suite }) => {
      await page.setViewportSize(suite.data.viewport.mobile);
      
      // Simulate touch interaction
      const colorButton = page.getByTitle(suite.data.colors.red);
      await colorButton.tap();
      
      await suite.assert.verifyColorApplied(suite.data.colors.red);
    });
  });

  // ====================================================================
  // 🎯 ACCESSIBILITY
  // ====================================================================

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page, suite }) => {
      // Test tab navigation through color buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to select color with Enter/Space
      await page.keyboard.press('Enter');
      await suite.wait.waitStandard(suite.config.delays.brief);
      
      // Should have changed from default color
      const buttonColor = await page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack }).getAttribute('data-testid');
      expect(buttonColor).not.toContain(suite.data.colors.default);
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for proper accessibility attributes
      const colorPicker = page.getByTestId('color-picker');
      await expect(colorPicker).toBeVisible();
      
      // Color buttons should have accessible names
      const colorButtons = page.locator('[title^="#"]');
      const firstButton = colorButtons.first();
      
      const title = await firstButton.getAttribute('title');
      expect(title).toBeTruthy();
      expect(title).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test('should support screen reader announcements', async ({ page, suite }) => {
      // This would typically require axe-core or similar tools
      // For now, verify basic accessibility structure
      
      await suite.selectColor(suite.data.colors.purple);
      
      // Verify the color change is reflected in accessible attributes
      const backButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack });
      const dataTestId = await backButton.getAttribute('data-testid');
      
      expect(dataTestId).toContain('purple');
    });

    test('should maintain focus management', async ({ page, suite }) => {
      const colorButton = page.getByTitle(suite.data.colors.green);
      
      // Focus and activate
      await colorButton.focus();
      await expect(colorButton).toBeFocused();
      
      await colorButton.click();
      
      // Focus should remain manageable
      await suite.assert.verifyApplicationStable();
    });
  });
});
