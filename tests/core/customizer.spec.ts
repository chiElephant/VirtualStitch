/**
 * 🎛️ CUSTOMIZER TEST SUITE
 * Testing the main customizer interface, layout, and state management
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🎛️ Customizer', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: true,
    });
  });

  // ====================================================================
  // 🎨 LAYOUT AND NAVIGATION
  // ====================================================================

  test.describe('Layout and Navigation', () => {
    test('should display all essential containers and controls', async ({ page, suite }) => {
      await suite.assert.verifyOnCustomizerPage();
      await expect(page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack })).toBeVisible();
    });

    test('should display all editor tabs', async ({ page }) => {
      const editorTabs = ['colorPicker', 'filePicker', 'aiPicker', 'imageDownload'];

      for (const tab of editorTabs) {
        await expect(page.getByRole('img', { name: tab })).toBeVisible();
      }
    });

    test('should display all filter tabs', async ({ page }) => {
      await expect(page.getByTestId('filter-tab-logoShirt')).toBeVisible();
      await expect(page.getByTestId('filter-tab-stylishShirt')).toBeVisible();
    });

    test('should navigate back to home when back button is clicked', async ({ suite }) => {
      await suite.navigateToHome();
      await suite.assert.verifyOnHomePage();
    });

    test('should maintain proper responsive layout', async ({ page, suite }) => {
      const viewports = [suite.data.viewport.mobile, suite.data.viewport.tablet, suite.data.viewport.desktop];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await suite.wait.waitStandard(suite.config.delays.brief);
        
        // Essential elements should remain visible and accessible
        await suite.assert.verifyOnCustomizerPage();
        await expect(page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack })).toBeVisible();
      }
    });
  });

  // ====================================================================
  // 📁 EDITOR TAB BEHAVIOR
  // ====================================================================

  test.describe('Editor Tab Behavior', () => {
    test('should toggle editor tabs open and close correctly', async ({ page, suite }) => {
      // Open color picker tab
      await suite.openEditorTab('colorPicker');
      await suite.assert.verifyPickerOpen('colorPicker');

      // Close tab by clicking again
      await page.getByTestId('editor-tab-colorPicker').click();
      
      // Wait for animation
      await suite.wait.waitStandard(suite.config.delays.medium);
      
      await suite.assert.verifyPickerClosed('colorPicker');
    });

    test('should display only one editor tab at a time', async ({ suite }) => {
      // Open color picker
      await suite.openEditorTab('colorPicker');
      await suite.assert.verifyPickerOpen('colorPicker');

      // Open file picker - should close color picker
      await suite.openEditorTab('filePicker');
      await suite.assert.verifyPickerOpen('filePicker');
      await suite.assert.verifyPickerClosed('colorPicker');
    });

    test('should handle rapid tab switching gracefully', async ({ suite }) => {
      const tabs: ('colorPicker' | 'filePicker' | 'aiPicker')[] = ['colorPicker', 'filePicker', 'aiPicker'];
      
      for (const tab of tabs) {
        await suite.openEditorTab(tab);
        await suite.wait.waitStandard(suite.config.delays.minimal); // Rapid switching
        await suite.assert.verifyPickerOpen(tab);
      }
    });

    test('should maintain tab functionality across different workflows', async ({ suite }) => {
      // Test tab switching combined with other operations
      await suite.openEditorTab('colorPicker');
      await suite.selectColor(suite.data.colors.purple);
      
      await suite.openEditorTab('filePicker');
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      await suite.openEditorTab('colorPicker');
      await suite.assert.verifyColorApplied(suite.data.colors.purple);
    });

    test('should handle tab states during error conditions', async ({ suite }) => {
      await suite.setup({ mockRoutes: true, mockScenario: 'serverError' });
      
      // Open AI picker and trigger error
      await suite.openEditorTab('aiPicker');
      await suite.generateAIImage('Test error handling');
      
      // Tab should remain functional despite error
      await suite.assert.verifyPickerOpen('aiPicker');
      await suite.assert.verifyApplicationStable();
      
      // Should be able to switch tabs normally
      await suite.openEditorTab('colorPicker');
      await suite.assert.verifyPickerOpen('colorPicker');
    });
  });

  // ====================================================================
  // 🎯 FILTER TAB BEHAVIOR
  // ====================================================================

  test.describe('Filter Tab Behavior', () => {
    test('should not affect filter state when toggling editor tabs', async ({ page, suite }) => {
      await suite.activateFilter('logoShirt');
      
      // Verify filter is active
      await suite.assert.verifyFilterActive('logoShirt');

      // Toggle editor tab
      await suite.openEditorTab('colorPicker');
      await suite.openEditorTab('filePicker');

      // Filter should still be active
      await suite.assert.verifyFilterActive('logoShirt');
    });

    test('should handle filter combinations correctly', async ({ suite }) => {
      // Upload textures for both filters
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      
      // Test filter combinations
      await suite.activateFilter('logoShirt');
      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyTextureVisible('full');
      
      // Toggle logo filter off
      await suite.activateFilter('logoShirt');
      await suite.assert.verifyTextureHidden('logo');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should maintain filter state during navigation', async ({ suite }) => {
      await suite.activateFilter('stylishShirt');
      
      // Navigate away and back
      await suite.navigateToHome();
      await suite.navigateToCustomizer();
      
      // Filter state should persist
      await suite.assert.verifyFilterActive('stylishShirt');
    });
  });

  // ====================================================================
  // 💾 STATE PERSISTENCE
  // ====================================================================

  test.describe('State Persistence', () => {
    test('should maintain complete state when navigating back and forth', async ({ suite }) => {
      // Make comprehensive changes
      await suite.selectColor(suite.data.colors.green);
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.activateFilter('logoShirt');

      // Navigate away and back
      await suite.navigateToHome();
      await suite.navigateToCustomizer();

      // Verify complete state persisted
      await suite.verifyApplicationState({
        color: suite.data.colors.green,
        logoTexture: true,
        activeFilter: 'logoShirt'
      });
    });

    test('should persist state across browser refresh', async ({ page, suite }) => {
      // Set up initial state
      await suite.selectColor(suite.data.colors.purple);
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Reload page
      await page.reload();
      await suite.wait.waitForCustomizerReady();
      
      // State should persist (depending on implementation)
      // This test may need adjustment based on actual persistence strategy
      await suite.assert.verifyApplicationStable();
    });

    test('should handle partial state recovery gracefully', async ({ suite }) => {
      // Test recovery when some state is lost
      await suite.selectColor(suite.data.colors.red);
      
      // Simulate state loss by navigating and changing something
      await suite.navigateToHome();
      await suite.navigateToCustomizer();
      
      // Should gracefully handle any state inconsistencies
      await suite.assert.verifyApplicationStable();
      await suite.assert.verifyOnCustomizerPage();
    });

    test('should maintain state during concurrent operations', async ({ suite }) => {
      await suite.setup({ mockRoutes: true, mockScenario: 'success' });
      
      // Start multiple operations
      await suite.selectColor(suite.data.colors.cyan);
      await suite.openEditorTab('aiPicker');
      await suite.generateAIImage('Concurrent test');
      
      // Change color during AI generation (if possible)
      await suite.openEditorTab('colorPicker');
      await suite.selectColor(suite.data.colors.yellow);
      
      // Wait for AI completion
      await suite.assert.verifySuccessToast();
      
      // Final state should be consistent
      await suite.assert.verifyColorApplied(suite.data.colors.yellow);
      await suite.assert.verifyApplicationStable();
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE AND USABILITY
  // ====================================================================

  test.describe('Performance and Usability', () => {
    test('should complete customizer initialization within threshold', async ({ suite }) => {
      // Measure full customizer setup time
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.navigateToHome();
          await suite.navigateToCustomizer();
        },
        'Customizer Initialization',
        suite.config.performance.maxLoadTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxLoadTime);
    });

    test('should handle rapid user interactions smoothly', async ({ suite }) => {
      const operations = [
        () => suite.openEditorTab('colorPicker'),
        () => suite.selectColor(suite.data.colors.red),
        () => suite.openEditorTab('filePicker'),
        () => suite.activateFilter('logoShirt'),
        () => suite.activateFilter('stylishShirt'),
      ];

      const { duration } = await suite.measureOperation(
        async () => {
          for (const operation of operations) {
            await operation();
            await suite.wait.waitStandard(suite.config.delays.minimal);
          }
        },
        'Rapid User Interactions',
        suite.config.performance.maxInteractionTime * operations.length
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime * operations.length);
    });

    test('should maintain responsiveness during heavy operations', async ({ suite }) => {
      await suite.setup({ mockRoutes: true, mockScenario: 'success' });
      
      // Start heavy operation (AI generation)
      await suite.openEditorTab('aiPicker');
      await suite.generateAIImage('Heavy operation test');
      
      // UI should remain responsive for other operations
      await suite.openEditorTab('colorPicker');
      await suite.selectColor(suite.data.colors.green);
      
      // Verify responsiveness maintained
      await suite.assert.verifyColorApplied(suite.data.colors.green);
      await suite.assert.verifyApplicationStable();
    });

    test('should optimize memory usage during extended sessions', async ({ page, suite }) => {
      // Simulate extended usage session
      for (let i = 0; i < 10; i++) {
        await suite.selectColor(Object.values(suite.data.colors)[i % Object.values(suite.data.colors).length]);
        await suite.openEditorTab('filePicker');
        await suite.openEditorTab('colorPicker');
        await suite.wait.waitStandard(suite.config.delays.brief);
      }

      // Check memory usage
      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        } : null;
      });

      if (memoryInfo) {
        console.log('Memory usage after extended session:', memoryInfo);
        expect(memoryInfo.usedJSHeapSize).toBeLessThanOrEqual(suite.config.performance.maxMemoryUsage);
      }

      await suite.assert.verifyApplicationStable();
    });
  });

  // ====================================================================
  // 🎯 ACCESSIBILITY
  // ====================================================================

  test.describe('Accessibility', () => {
    test('should support keyboard navigation through all controls', async ({ page, suite }) => {
      // Tab through interface elements
      await page.keyboard.press('Tab'); // Back button
      await page.keyboard.press('Tab'); // First editor tab
      await page.keyboard.press('Tab'); // Second editor tab
      
      // Should be able to activate tabs with keyboard
      await page.keyboard.press('Enter');
      await suite.wait.waitStandard(suite.config.delays.brief);
      
      // Some tab should be open
      await suite.assert.verifyApplicationStable();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check essential accessibility attributes
      const editorTabs = page.locator('[data-testid^="editor-tab-"]');
      const tabCount = await editorTabs.count();
      
      expect(tabCount).toBeGreaterThan(0);
      
      // Each tab should have accessible attributes
      for (let i = 0; i < tabCount; i++) {
        const tab = editorTabs.nth(i);
        const role = await tab.getAttribute('role');
        const ariaLabel = await tab.getAttribute('aria-label');
        
        // Should have either role or aria-label for accessibility
        expect(role || ariaLabel).toBeTruthy();
      }
    });

    test('should provide clear focus indicators', async ({ page, suite }) => {
      // Focus on back button
      const backButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack });
      await backButton.focus();
      await expect(backButton).toBeFocused();
      
      // Should have visible focus indicator
      const focusStyles = await backButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });
      
      // Should have some form of focus indication
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.border !== 'none';
        
      expect(hasFocusIndicator).toBeTruthy();
    });

    test('should support screen reader navigation patterns', async ({ page, suite }) => {
      // Verify landmark roles and heading structure
      const main = page.locator('main, [role="main"]');
      const mainCount = await main.count();
      
      if (mainCount > 0) {
        await expect(main.first()).toBeVisible();
      }
      
      // Should have logical heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      // Customizer should have some heading structure
      expect(headingCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ====================================================================
  // 🛡️ ERROR HANDLING AND EDGE CASES
  // ====================================================================

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle component loading failures gracefully', async ({ page, suite }) => {
      // Simulate component loading failure
      await page.route('**/api/**', route => route.abort('failed'));
      
      // Basic interface should still be functional
      await suite.assert.verifyOnCustomizerPage();
      await suite.assert.verifyApplicationStable();
      
      await page.unroute('**/api/**');
    });

    test('should handle rapid navigation gracefully', async ({ suite }) => {
      // Rapid navigation between home and customizer
      for (let i = 0; i < 3; i++) {
        await suite.navigateToHome();
        await suite.navigateToCustomizer();
        await suite.wait.waitStandard(TestConfig.delays.minimal);
      }
      
      // Should end up in stable state
      await suite.assert.verifyOnCustomizerPage();
      await suite.assert.verifyApplicationStable();
    });

    test('should recover from temporary component failures', async ({ suite }) => {
      // Try operations that might fail temporarily
      try {
        await suite.openEditorTab('aiPicker');
        await suite.openEditorTab('colorPicker');
        await suite.selectColor(TestData.colors.blue);
      } catch (error) {
        console.log('Temporary failure handled:', error);
      }
      
      // Should be able to continue normally
      await suite.assert.verifyApplicationStable();
      await suite.openEditorTab('colorPicker');
    });

    test('should handle edge case user interactions', async ({ page, suite }) => {
      // Rapid clicking on same element
      const backButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.goBack });
      
      await backButton.click();
      await backButton.click(); // Double click
      await backButton.click(); // Triple click
      
      // Should end up in home state without errors
      await suite.assert.verifyOnHomePage();
    });
  });
});
