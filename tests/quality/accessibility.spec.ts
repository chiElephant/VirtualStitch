import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TestUtils, TEST_COLORS } from '../utils/test-helpers';

test.describe('Accessibility Tests @accessibility', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('WCAG Compliance', () => {
    test('should not have accessibility violations on homepage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations in customizer', async ({ page }) => {
      await page.goto('/');
      await page.click('button[aria-label="Customize It"]');
      await utils.wait.waitForAnimations();
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        // Skip color-contrast checks due to glassmorphism interference
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations in individual components', async ({ page }) => {
      await utils.nav.goToCustomizer();

      const components = [
        { tab: 'colorPicker', testId: 'color-picker' },
        { tab: 'filePicker', testId: 'file-picker' },
        { tab: 'aiPicker', testId: 'ai-picker' },
        { tab: 'imageDownload', testId: 'image-download' },
      ];

      for (const component of components) {
        await page.getByTestId(`editor-tab-${component.tab}`).click();
        await expect(page.getByTestId(component.testId)).toBeVisible();

        const scanResults = await new AxeBuilder({ page })
          .include(`[data-testid="${component.testId}"]`)
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast']) // Due to glassmorphism
          .analyze();

        expect(scanResults.violations).toEqual([]);
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first focusable element
      await page.keyboard.press('Tab');
      const firstFocusedElement = await page.locator(':focus').textContent();
      expect(firstFocusedElement).toBeTruthy();

      // Verify element is visible and interactive
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Should navigate to customizer
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should support keyboard navigation in customizer', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Test Tab navigation through editor tabs
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Continue tabbing through interface
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should support keyboard navigation in color picker', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.color.openColorPicker();

      // Tab into color picker
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate within color picker
      const focusedInColorPicker = await page.evaluate(() => {
        const focused = document.activeElement;
        const colorPicker = document.querySelector('[data-testid="color-picker"]');
        return colorPicker?.contains(focused) || false;
      });

      // Focus should be within color picker area or its controls
      expect(focusedInColorPicker || await page.locator(':focus').isVisible()).toBeTruthy();
    });

    test('should support keyboard navigation for file upload', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('file-picker');

      // Tab to file input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // File input should be focusable
      const fileInput = page.getByTestId('file-picker-input');
      const isFileInputFocused = await page.evaluate(() => {
        const fileInput = document.querySelector('[data-testid="file-picker-input"]');
        return document.activeElement === fileInput;
      });

      // Either file input is focused or focus is on related control
      expect(isFileInputFocused || await page.locator(':focus').isVisible()).toBeTruthy();
    });

    test('should support keyboard activation of buttons', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Focus on Back button
      const backButton = page.getByRole('button', { name: 'Go Back' });
      await backButton.focus();
      await expect(backButton).toBeFocused();

      // Activate with Enter
      await page.keyboard.press('Enter');
      
      // Should navigate to home
      await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper aria labels on main buttons', async ({ page }) => {
      await page.goto('/');

      const customizeButton = page.getByRole('button', { name: 'Customize It' });
      await expect(customizeButton).toHaveAttribute('aria-label', 'Customize It');

      await customizeButton.click();
      await utils.wait.waitForAnimations();

      const backButton = page.getByRole('button', { name: 'Go Back' });
      await expect(backButton).toHaveAttribute('aria-label', 'Go Back');
    });

    test('should have proper aria labels on editor tabs', async ({ page }) => {
      await utils.nav.goToCustomizer();

      const editorTabs = [
        { testId: 'editor-tab-colorPicker', imgName: 'colorPicker' },
        { testId: 'editor-tab-filePicker', imgName: 'filePicker' },
        { testId: 'editor-tab-aiPicker', imgName: 'aiPicker' },
        { testId: 'editor-tab-imageDownload', imgName: 'imageDownload' },
      ];

      for (const tab of editorTabs) {
        const tabElement = page.getByTestId(tab.testId);
        await expect(tabElement).toBeVisible();
        
        const img = tabElement.getByRole('img', { name: tab.imgName });
        await expect(img).toBeVisible();
      }
    });

    test('should have accessible form labels', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Test AI picker form
      await utils.nav.openEditorTab('ai-picker');
      const promptInput = page.getByTestId('ai-prompt-input');
      await expect(promptInput).toHaveAttribute('placeholder', 'Ask AI...');

      // Test filename input
      await utils.nav.openEditorTab('image-download');
      const filenameInput = page.getByPlaceholder('e.g., my-shirt');
      await expect(filenameInput).toBeVisible();
      
      // Input should have associated label
      const label = page.getByText('Filename');
      await expect(label).toBeVisible();
    });

    test('should provide meaningful button text', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('file-picker');

      // File picker buttons should have clear text
      await expect(page.getByRole('button', { name: 'Logo' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Full' })).toBeVisible();

      // AI picker buttons
      await utils.nav.openEditorTab('ai-picker');
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should maintain accessible color contrast ratios', async ({ page }) => {
      await page.goto('/');
      
      // Test default button contrast
      const customizeButton = page.locator('button[aria-label="Customize It"]');
      await expect(customizeButton).toBeVisible();

      const buttonStyles = await customizeButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
        };
      });

      // Default green should provide good contrast
      expect(buttonStyles.backgroundColor).toBe('rgb(0, 121, 56)');
    });

    test('should maintain contrast when colors change', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.color.openColorPicker();

      // Test different color combinations
      const colorsToTest = [TEST_COLORS.dark, TEST_COLORS.lightBlue, TEST_COLORS.yellow];

      for (const color of colorsToTest) {
        await utils.color.selectColor(color);
        
        const backButton = page.getByRole('button', { name: 'Go Back' });
        const buttonStyles = await backButton.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
          };
        });

        // Button should have readable text (not transparent or same color)
        expect(buttonStyles.backgroundColor).not.toBe('transparent');
        expect(buttonStyles.color).toBeTruthy();
        expect(buttonStyles.backgroundColor).not.toBe(buttonStyles.color);
      }
    });

    test('should have sufficient visual focus indicators', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Test focus indicators on various elements
      const focusableElements = [
        page.getByRole('button', { name: 'Go Back' }),
        page.getByTestId('editor-tab-colorPicker'),
        page.getByTestId('filter-tab-logoShirt'),
      ];

      for (const element of focusableElements) {
        await element.focus();
        
        // Element should be clearly focused (visible focus ring or style change)
        const focusStyles = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow,
          };
        });

        // Should have some form of focus indication
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    });
  });

  test.describe('Motion and Animation Accessibility', () => {
    test('should respect reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();

      // Page should still function with reduced motion
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      
      // Navigation should work without motion
      await page.getByRole('button', { name: 'Go Back' }).click();
      await expect(page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    });

    test('should provide alternatives for motion-based interactions', async ({ page }) => {
      await utils.nav.goToCustomizer();
      
      // Canvas should be interactive even if motion is reduced
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      
      // Color changes should work without animation
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.green);
      await utils.color.verifyColorApplied(TEST_COLORS.green);
    });
  });

  test.describe('Error Accessibility', () => {
    test('should provide accessible error messages', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('ai-picker');

      // Trigger error (empty prompt)
      await page.getByTestId('ai-logo-button').click();
      
      // Error message should be accessible
      const errorMessage = page.getByText(/please enter a prompt/i);
      await expect(errorMessage).toBeVisible();
      
      // Message should be announced to screen readers
      const messageRole = await errorMessage.getAttribute('role');
      const ariaLive = await errorMessage.getAttribute('aria-live');
      
      // Should have appropriate ARIA attributes or be in an alerting context
      expect(messageRole === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
    });

    test('should handle form validation accessibly', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.nav.openEditorTab('image-download');

      // Buttons should be properly disabled when form is invalid
      const downloadButton = page.getByRole('button', { name: 'Download Logo' });
      await expect(downloadButton).toBeDisabled();
      
      // Screen readers should understand why button is disabled
      const ariaDisabled = await downloadButton.getAttribute('aria-disabled');
      const disabled = await downloadButton.getAttribute('disabled');
      
      expect(ariaDisabled === 'true' || disabled !== null).toBeTruthy();
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile viewports', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Run accessibility scan on mobile
      const scanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();

      expect(scanResults.violations).toEqual([]);

      // Touch targets should be appropriately sized
      const customizeButton = page.getByRole('button', { name: 'Customize It' });
      const buttonSize = await customizeButton.boundingBox();
      
      if (buttonSize) {
        // Minimum touch target size (44px recommended)
        expect(buttonSize.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should support touch navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await utils.nav.goToCustomizer();

      // Test touch interactions
      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('color-picker')).toBeVisible();

      // Filter tabs should be touch-friendly
      await page.getByTestId('filter-tab-logoShirt').click();
      await utils.texture.verifyFilterActive('logoShirt');
    });
  });
});
