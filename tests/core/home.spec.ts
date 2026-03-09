/**
 * 🏠 HOME PAGE TEST SUITE
 * Testing the main landing page functionality and navigation
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🏠 Home Page', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: false, // Start on home page
    });
    await suite.page.goto('/');
  });

  // ====================================================================
  // 📄 STATIC CONTENT
  // ====================================================================

  test.describe('Static Content', () => {
    test('should display all essential elements', async ({ page, suite }) => {
      // Verify main heading
      await expect(
        page.getByRole('heading', { name: /LET'S DO IT\./ })
      ).toBeVisible();
      
      // Verify logo
      await expect(page.getByRole('img', { name: 'logo' })).toBeVisible();
      
      // Verify marketing copy
      await expect(
        page.getByText(/Create your unique and exclusive shirt/i)
      ).toBeVisible();
      
      // Verify 3D canvas is present
      await suite.assert.verifyComponentVisible('canvas');
      
      // Verify primary CTA button
      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt })
      ).toBeVisible();
    });

    test('should have properly structured page layout', async ({ page }) => {
      // Verify semantic structure
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Verify navigation elements if present
      const nav = page.locator('nav');
      const navCount = await nav.count();
      if (navCount > 0) {
        await expect(nav.first()).toBeVisible();
      }
    });

    test('should display canvas with initial 3D scene', async ({ page, suite }) => {
      // Wait for Three.js initialization
      await suite.wait.waitStandard(suite.config.delays.veryLong);

      const canvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return { exists: false, rendered: false };

        return {
          exists: true,
          rendered: canvas.width > 0 && canvas.height > 0,
          dimensions: { width: canvas.width, height: canvas.height }
        };
      });

      expect(canvasInfo.exists).toBeTruthy();
      expect(canvasInfo.rendered).toBeTruthy();
    });

    test('should have accessible content structure', async ({ page, suite }) => {
      // Verify heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Verify CTA button is accessible
      await suite.assert.verifyElementAccessible(`[role="button"][name="${suite.data.buttonLabels.actions.customizeIt}"]`);
    });

    test('should show appropriate metadata', async ({ page }) => {
      // Check for basic page metadata
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  // ====================================================================
  // 🧭 NAVIGATION
  // ====================================================================

  test.describe('Navigation', () => {
    test('should navigate to customizer when button is clicked', async ({ page, suite }) => {
      // Verify we start on home page
      await suite.assert.verifyOnHomePage();
      await expect(page.getByTestId('customizer-main')).toHaveCount(0);

      // Click customize button
      await page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt }).click();
      
      // Wait for navigation
      await suite.wait.waitForCustomizerReady();

      // Verify we're now in customizer
      await suite.assert.verifyOnCustomizerPage();
    });

    test('should maintain canvas state during navigation', async ({ page, suite }) => {
      // Get initial canvas state
      const initialCanvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        return canvas ? { width: canvas.width, height: canvas.height } : null;
      });

      // Navigate to customizer
      await suite.navigateToCustomizer();

      // Canvas should still be present and functional
      await suite.assert.verifyComponentVisible('canvas');
      
      const customizerCanvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        return canvas ? { width: canvas.width, height: canvas.height } : null;
      });

      expect(customizerCanvasInfo).toBeTruthy();
    });

    test('should handle rapid navigation clicks gracefully', async ({ page, suite }) => {
      // Rapid clicks should not break navigation
      const customizeButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt });
      
      await customizeButton.click();
      await customizeButton.click(); // Second click should be handled gracefully
      
      await suite.wait.waitStandard(suite.config.delays.long);
      await suite.assert.verifyOnCustomizerPage();
    });

    test('should support keyboard navigation', async ({ page, suite }) => {
      // Tab to the customize button
      await page.keyboard.press('Tab');
      
      // Find the customize button and verify it can be focused
      const customizeButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt });
      await customizeButton.focus();
      await expect(customizeButton).toBeFocused();
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await suite.wait.waitForCustomizerReady();
      await suite.assert.verifyOnCustomizerPage();
    });

    test('should handle back navigation correctly', async ({ page, suite }) => {
      // Navigate to customizer
      await suite.navigateToCustomizer();
      await suite.assert.verifyOnCustomizerPage();
      
      // Navigate back to home
      await suite.navigateToHome();
      await suite.assert.verifyOnHomePage();
    });
  });

  // ====================================================================
  // 🎨 VISUAL AND INTERACTIVE ELEMENTS
  // ====================================================================

  test.describe('Visual and Interactive Elements', () => {
    test('should render 3D shirt preview correctly', async ({ page, suite }) => {
      await suite.wait.waitStandard(suite.config.delays.veryLong); // Allow full rendering
      
      // Verify canvas has content
      const has3DContent = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return false;
        
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      });
      
      expect(has3DContent).toBeTruthy();
    });

    test('should handle mouse interactions over preview', async ({ page, suite }) => {
      await suite.assert.verifyComponentVisible('canvas');
      
      const canvas = page.locator('canvas');
      const boundingBox = await canvas.boundingBox();
      
      if (boundingBox) {
        // Simulate mouse movement over canvas
        await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
        await page.mouse.move(boundingBox.x + 200, boundingBox.y + 150);
        
        // Canvas should remain stable
        await suite.assert.verifyComponentVisible('canvas');
      }
    });

    test('should display proper loading states', async ({ page, suite }) => {
      // Check if there are any loading indicators initially
      const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
      const loadingCount = await loadingElements.count();
      
      if (loadingCount > 0) {
        // Wait for loading to complete
        await suite.wait.waitStandard(suite.config.delays.veryLong);
        
        // Loading should be gone
        await expect(loadingElements.first()).not.toBeVisible();
      }
    });
  });

  // ====================================================================
  // 📱 RESPONSIVE DESIGN
  // ====================================================================

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page, suite }) => {
      await page.setViewportSize(suite.data.viewport.mobile);
      await suite.wait.waitStandard(suite.config.delays.brief);
      
      // Essential elements should still be visible
      await suite.assert.verifyOnHomePage();
      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt })
      ).toBeVisible();
      
      // Canvas should adapt
      await suite.assert.verifyComponentVisible('canvas');
    });

    test('should adapt to tablet viewport', async ({ page, suite }) => {
      await page.setViewportSize(suite.data.viewport.tablet);
      await suite.wait.waitStandard(suite.config.delays.brief);
      
      await suite.assert.verifyOnHomePage();
      await suite.assert.verifyComponentVisible('canvas');
    });

    test('should handle very small viewports gracefully', async ({ page, suite }) => {
      await page.setViewportSize(suite.data.viewport.tiny);
      await suite.wait.waitStandard(suite.config.delays.brief);
      
      // Core functionality should remain accessible
      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt })
      ).toBeVisible();
      
      // Should not have horizontal scroll unless intentional
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      // Allow some tolerance for intentional horizontal layouts
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should support touch interactions on mobile', async ({ page, suite }) => {
      await page.setViewportSize(suite.data.viewport.mobile);
      
      const customizeButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt });
      await customizeButton.tap();
      
      await suite.wait.waitForCustomizerReady();
      await suite.assert.verifyOnCustomizerPage();
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE
  // ====================================================================

  test.describe('Performance', () => {
    test('should load within performance threshold', async ({ page, suite }) => {
      const startTime = Date.now();
      
      // Reload page to measure load time
      await page.reload();
      await suite.wait.waitForElement('[role="button"]');
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Home page loaded in ${loadTime}ms`);
      
      expect(loadTime).toBeLessThanOrEqual(suite.config.performance.maxLoadTime);
    });

    test('should complete navigation within performance threshold', async ({ suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.navigateToCustomizer();
        },
        'Home to Customizer Navigation',
        suite.config.performance.maxInteractionTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
    });

    test('should maintain stable memory usage', async ({ page, suite }) => {
      // Perform multiple navigation cycles
      for (let i = 0; i < 3; i++) {
        await suite.navigateToCustomizer();
        await suite.navigateToHome();
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
        console.log('Memory usage after navigation cycles:', memoryInfo);
        expect(memoryInfo.usedJSHeapSize).toBeLessThanOrEqual(suite.config.performance.maxMemoryUsage);
      }
    });
  });

  // ====================================================================
  // 🎯 ACCESSIBILITY
  // ====================================================================

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have at least one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have proper focus management', async ({ page, suite }) => {
      // Should be able to tab through interactive elements
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT'].some(tag => tag === focusedElement)).toBeTruthy();
    });

    test('should have descriptive button text', async ({ page, suite }) => {
      const customizeButton = page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt });
      
      const buttonText = await customizeButton.textContent();
      expect(buttonText).toBeTruthy();
      expect(buttonText!.length).toBeGreaterThan(2); // Should be descriptive
    });

    test('should provide alternative text for images', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        
        // Should have either alt text or aria-label
        expect(alt || ariaLabel).toBeTruthy();
      }
    });
  });

  // ====================================================================
  // 🛡️ ERROR HANDLING
  // ====================================================================

  test.describe('Error Handling', () => {
    test('should handle canvas initialization failures gracefully', async ({ page, suite }) => {
      // Mock WebGL as unavailable
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          value: function (contextType: string) {
            if (contextType === 'webgl' || contextType === 'experimental-webgl') {
              return null;
            }
            return originalGetContext.call(this, contextType);
          },
        });
      });

      await page.reload();

      // Page should still load and be functional
      await suite.assert.verifyOnHomePage();
      await expect(
        page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt })
      ).toBeVisible();
    });

    test('should handle slow loading gracefully', async ({ page, suite }) => {
      // Simulate slow network
      await page.route('**/*', (route) => {
        setTimeout(() => route.continue(), 100);
      });

      await page.reload();
      
      // Should eventually load successfully
      await suite.assert.verifyOnHomePage();
      
      await page.unroute('**/*');
    });

    test('should maintain functionality during network issues', async ({ page, suite }) => {
      // Page should work even if some resources fail to load
      await page.route('**/favicon.ico', route => route.abort());
      
      await page.reload();
      
      // Core functionality should remain
      await suite.assert.verifyOnHomePage();
      await suite.navigateToCustomizer();
      await suite.assert.verifyOnCustomizerPage();
    });
  });
});
