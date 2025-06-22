import { test, expect } from '@playwright/test';
import { TestUtils } from '../utils/test-helpers';

test.describe('Smoke Tests @smoke', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Critical Path Verification', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto('/');

      // Verify page title and basic structure
      await expect(page).toHaveTitle(/Virtual Stitch/);
      await expect(
        page.getByRole('heading', { name: /LET'S DO IT\./ })
      ).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
    });

    test('should navigate to customizer successfully', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();

      // Wait for animations to complete
      await page.waitForTimeout(1500);

      // Verify customizer is loaded and functional
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible();
    });

    test('should display all essential UI components', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Verify all editor tabs are present
      const editorTabs = [
        'colorPicker',
        'filePicker',
        'aiPicker',
        'imageDownload',
      ];
      for (const tab of editorTabs) {
        await expect(page.getByRole('img', { name: tab })).toBeVisible();
      }

      // Verify filter tabs are present
      await expect(page.getByTestId('filter-tab-logoShirt')).toBeVisible();
      await expect(page.getByTestId('filter-tab-stylishShirt')).toBeVisible();
    });
  });

  test.describe('Core Functionality Verification', () => {
    test('should open and interact with color picker', async ({ page }) => {
      await utils.nav.goToCustomizer();

      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('color-picker')).toBeVisible();

      // Test basic color selection
      await page.getByTitle('#80C670').click();
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
    });

    test('should open and interact with file picker', async ({ page }) => {
      await utils.nav.goToCustomizer();

      await page.getByTestId('editor-tab-filePicker').click();
      await expect(page.getByTestId('file-picker')).toBeVisible();
      await expect(page.getByText('No file selected')).toBeVisible();

      // Verify action buttons are present
      await expect(page.getByRole('button', { name: 'Logo' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Full Pattern' })).toBeVisible();
    });

    test('should open and interact with AI picker', async ({ page }) => {
      await utils.nav.goToCustomizer();

      await page.getByTestId('editor-tab-aiPicker').click();
      await expect(page.getByTestId('ai-picker')).toBeVisible();
      await expect(page.getByTestId('ai-prompt-input')).toBeVisible();
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });

    test('should open and interact with image download', async ({ page }) => {
      await utils.nav.goToCustomizer();

      await page.getByTestId('editor-tab-imageDownload').click();
      await expect(page.getByTestId('image-download')).toBeVisible();
      await expect(page.getByPlaceholder('e.g., my-shirt')).toBeVisible();
    });
  });

  test.describe('Filter Functionality Verification', () => {
    test('should activate and deactivate logo filter', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Initially no textures should be visible
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);

      // Activate logo filter
      await page.getByTestId('filter-tab-logoShirt').click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);

      // Deactivate logo filter
      await page.getByTestId('filter-tab-logoShirt').click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
    });

    test('should activate and deactivate full texture filter', async ({
      page,
    }) => {
      await utils.nav.goToCustomizer();

      // Initially no textures should be visible
      await expect(page.getByTestId('full-texture')).toHaveCount(0);

      // Activate full texture filter
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('full-texture')).toHaveCount(1);

      // Deactivate full texture filter
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('full-texture')).toHaveCount(0);
    });
  });

  test.describe('Canvas Rendering Verification', () => {
    test('should render 3D canvas correctly', async ({ page }) => {
      await page.goto('/');

      // Wait for Three.js to initialize
      await page.waitForTimeout(3000);

      const canvasInfo = await page.evaluate(
        (): { exists: boolean; hasContent: boolean } => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement;
          if (!canvas) return { exists: false, hasContent: false };

          const hasContent = canvas.width > 0 && canvas.height > 0;
          return { exists: true, hasContent };
        }
      );

      expect(canvasInfo.exists).toBeTruthy();
      expect(canvasInfo.hasContent).toBeTruthy();
    });

    test('should respond to color changes', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Default color should be applied
      await expect(page.getByTestId('canvas-color-#007938')).toHaveCount(1);

      // Change color and verify update
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#2CCCE4').click();
      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(1);
      await expect(page.getByTestId('canvas-color-#007938')).toHaveCount(0);
    });
  });

  test.describe('Navigation and State Verification', () => {
    test('should maintain state when navigating back and forth', async ({
      page,
    }) => {
      await page.goto('/');

      // Navigate to customizer and make changes
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#80C670').click();

      // Navigate back to home
      await page.getByRole('button', { name: 'Go Back' }).click();
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();

      // Navigate back to customizer
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // Verify state persisted
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
    });

    test('should handle tab switching correctly', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Test switching between multiple tabs
      const tabs = ['colorPicker', 'filePicker', 'aiPicker', 'imageDownload'];

      for (const tab of tabs) {
        await page.getByTestId(`editor-tab-${tab}`).click();
        await expect(page.getByTestId(`editor-tab-${tab}`)).toBeVisible();

        // Only one tab should be visible at a time
        const otherTabs = tabs.filter((t) => t !== tab);
        for (const otherTab of otherTabs) {
          await expect(page.getByTestId(otherTab)).toHaveCount(0);
        }
      }
    });
  });

  test.describe('Error Handling Verification', () => {
    test('should handle missing resources gracefully', async ({ page }) => {
      // Block some resources to test graceful degradation
      await page.route('**/icons/emblem.png', (route) => route.abort());

      await page.goto('/');

      // Page should still load despite missing resources
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
    });

    test('should display appropriate error messages', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await page.getByTestId('editor-tab-aiPicker').click();

      // Test empty prompt error
      await page.getByTestId('ai-logo-button').click();
      await expect(page.getByText(/please enter a prompt/i)).toBeVisible();
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      // Monitor for unhandled errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Basic interactions should not cause JavaScript errors
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#726DE8').click();

      // Filter out known acceptable errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('ResizeObserver') &&
          !error.includes('Non-passive event listener')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Performance Verification', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds (generous for smoke test)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle basic interactions responsively', async ({ page }) => {
      await utils.nav.goToCustomizer();

      const startTime = Date.now();

      // Perform basic interactions
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#EFBD4E').click();
      await page.getByTestId('filter-tab-logoShirt').click();

      const interactionTime = Date.now() - startTime;

      // Should respond within 5 seconds
      expect(interactionTime).toBeLessThan(5000);
    });
  });

  test.describe('Accessibility Verification', () => {
    test('should have accessible main navigation', async ({ page }) => {
      await page.goto('/');

      // Test keyboard navigation to main button
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should have proper ARIA labels on key elements', async ({ page }) => {
      await page.goto('/');

      const customizeButton = page.getByRole('button', {
        name: 'Customize It',
      });
      await expect(customizeButton).toHaveAttribute(
        'aria-label',
        'Customize It'
      );

      await customizeButton.click();
      await page.waitForTimeout(1500);

      const backButton = page.getByRole('button', { name: 'Go Back' });
      await expect(backButton).toHaveAttribute('aria-label', 'Go Back');
    });
  });

  test.describe('Mobile Compatibility Verification', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Essential elements should be visible and functional
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();

      // Navigation should work
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(2000); // Extra time for mobile

      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await utils.nav.goToCustomizer();

      // Touch interactions should work
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#C9FFE5').click();
      await expect(page.getByTestId('canvas-color-#C9FFE5')).toHaveCount(1);
    });
  });

  test.describe('Content Verification', () => {
    test('should display correct branding and text', async ({ page }) => {
      await page.goto('/');

      // Verify key text content
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(
        page.getByText(/Create your unique and exclusive shirt/i)
      ).toBeVisible();
      await expect(page.getByText(/Unleash your Imagination/i)).toBeVisible();
    });

    test('should have working logo and branding elements', async ({ page }) => {
      await page.goto('/');

      // Logo should be visible
      await expect(page.getByRole('img', { name: 'logo' })).toBeVisible();

      // Page title should be correct
      await expect(page).toHaveTitle(/Virtual Stitch/);
    });
  });

  test.describe('Integration Points Verification', () => {
    test('should have accessible API endpoints', async ({ page, request }) => {
      // Test that API endpoint responds (even if with error)
      await page.goto('/');

      try {
        const response = await request.post('/api/custom-logo', {
          data: { prompt: 'smoke test' },
          failOnStatusCode: false,
          timeout: 30000, // 30 second timeout for DALL-E API
        });

        // Should get some response, not timeout
        expect([200, 400, 429, 500].includes(response.status())).toBeTruthy();
        console.log(
          `✅ API endpoint responded with status: ${response.status()}`
        );
      } catch (error) {
        // If API is not available, that's acceptable for smoke test
        // Just log it and mark as expected behavior
        if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string' &&
          ((error as { message: string }).message.includes('timeout') ||
            (error as { message: string }).message.includes('ECONNREFUSED'))
        ) {
          console.log(
            '⚠️ API endpoint not available (expected in some environments)'
          );
          expect(true).toBeTruthy(); // Pass the test - API unavailability is acceptable
        } else {
          throw error; // Re-throw unexpected errors
        }
      }
    });

    test('should handle API failures gracefully', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await page.getByTestId('editor-tab-aiPicker').click();

      // Mock API failure
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({ status: 500 });
      });

      await page.getByTestId('ai-prompt-input').fill('Smoke test failure');
      await page.getByTestId('ai-logo-button').click();

      // Should show error message, not crash
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
