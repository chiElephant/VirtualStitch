import { test, expect } from '@playwright/test';
import {
  TestUtils,
  VIEWPORTS,
  TEST_COLORS,
  TEST_FILES,
} from '../utils/test-helpers';

test.describe('Responsive Design Tests', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Device-Specific Layout Tests', () => {
    Object.entries(VIEWPORTS).forEach(([deviceName, viewport]) => {
      test.describe(`${deviceName} (${viewport.width}x${viewport.height})`, () => {
        test.beforeEach(async ({ page }) => {
          await page.setViewportSize(viewport);
        });

        test('should display essential elements correctly', async ({
          page,
        }) => {
          await page.goto('/');

          // Core elements should be visible
          await expect(
            page.getByRole('heading', { name: "LET'S DO IT." })
          ).toBeVisible();
          await expect(page.locator('canvas')).toBeVisible();
          await expect(
            page.getByRole('button', { name: 'Customize It' })
          ).toBeVisible();
        });

        test('should navigate to customizer properly', async ({ page }) => {
          await page.goto('/');
          await page.getByRole('button', { name: 'Customize It' }).click();

          // Allow extra time for mobile animations
          const waitTime = deviceName.includes('mobile') ? 2500 : 1500;
          await page.waitForTimeout(waitTime);

          await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
          await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
          await expect(
            page.getByRole('button', { name: 'Go Back' })
          ).toBeVisible();
        });

        test('should handle color picker interactions', async ({}) => {
          await utils.nav.goToCustomizer();

          await utils.color.openColorPicker();
          await utils.color.selectColor(TEST_COLORS.green);
          await utils.color.verifyColorApplied(TEST_COLORS.green);
        });

        test('should support file upload', async ({ page }) => {
          await utils.nav.goToCustomizer();

          await utils.nav.openEditorTab('filePicker');
          await page
            .getByTestId('file-picker-input')
            .setInputFiles(TEST_FILES.emblem);
          await expect(page.getByText('emblem.png')).toBeVisible();
        });
      });
    });
  });

  test.describe('Touch and Mobile Interactions', () => {
    const mobileDevices = ['mobile', 'tablet', 'largeMobile'];

    mobileDevices.forEach((deviceKey) => {
      test(`should handle touch interactions on ${deviceKey}`, async ({
        page,
      }) => {
        const viewport = VIEWPORTS[deviceKey as keyof typeof VIEWPORTS];
        await page.setViewportSize(viewport);

        await page.goto('/');
        await utils.nav.goToCustomizer();

        // Test touch-friendly interactions
        await page.getByTestId('editor-tab-colorPicker').click();
        await page.getByTitle(TEST_COLORS.lightBlue).click();
        await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);

        // Test filter tab touches
        await page.getByTestId('filter-tab-logoShirt').click();
        await utils.texture.verifyFilterActive('logoShirt');
      });
    });

    test('should have appropriate touch target sizes', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await utils.nav.goToCustomizer();

      // Check touch target sizes (minimum 44px recommended)
      const interactiveElements = [
        page.getByRole('button', { name: 'Go Back' }),
        page.getByTestId('editor-tab-colorPicker'),
        page.getByTestId('filter-tab-logoShirt'),
      ];

      for (const element of interactiveElements) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Orientation Changes', () => {
    const mobileViewports = [
      {
        name: 'iPhone',
        portrait: VIEWPORTS.mobile,
        landscape: { width: 667, height: 375 },
      },
      {
        name: 'iPad',
        portrait: VIEWPORTS.tablet,
        landscape: { width: 1024, height: 768 },
      },
    ];

    mobileViewports.forEach(({ name, portrait, landscape }) => {
      test(`should handle orientation changes on ${name}`, async ({ page }) => {
        // Start in portrait
        await page.setViewportSize(portrait);
        await page.goto('/');
        await expect(page.locator('canvas')).toBeVisible();

        // Navigate to customizer
        await utils.nav.goToCustomizer();
        await utils.color.openColorPicker();
        await utils.color.selectColor(TEST_COLORS.purple);

        // Switch to landscape
        await page.setViewportSize(landscape);
        await page.waitForTimeout(1000);

        // Verify functionality persists
        await expect(page.locator('canvas')).toBeVisible();
        await utils.color.verifyColorApplied(TEST_COLORS.purple);

        // Test continued functionality in landscape
        await utils.color.selectColor(TEST_COLORS.dark);
        await utils.color.verifyColorApplied(TEST_COLORS.dark);
      });
    });
  });

  test.describe('Viewport Edge Cases', () => {
    test('should handle extremely small viewport', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tiny);
      await page.goto('/');

      // Basic functionality should still work
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();

      await utils.nav.goToCustomizer();
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();

      // Should be able to interact despite small size
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.green);
      await utils.color.verifyColorApplied(TEST_COLORS.green);
    });

    test('should handle extremely large viewport', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.ultraWide);
      await page.goto('/');

      // Layout should scale appropriately
      await expect(page.locator('canvas')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();

      await utils.nav.goToCustomizer();
      await expect(page.getByTestId('editor-tabs-container')).toBeVisible();

      // Functionality should work at large sizes
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
    });

    test('should handle dynamic viewport changes', async ({ page }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      const viewportSequence = [
        VIEWPORTS.desktop,
        VIEWPORTS.tablet,
        VIEWPORTS.mobile,
        VIEWPORTS.ultraWide,
        VIEWPORTS.tiny,
      ];

      for (const viewport of viewportSequence) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        // Core elements should remain functional
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(page.locator('canvas')).toBeVisible();
      }

      // Test functionality after all changes
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.yellow);
      await utils.color.verifyColorApplied(TEST_COLORS.yellow);
    });
  });

  test.describe('Responsive Content Adaptation', () => {
    test('should adapt editor tabs layout on mobile', async ({ page }) => {
      // Test desktop layout
      await page.setViewportSize(VIEWPORTS.desktop);
      await utils.nav.goToCustomizer();

      const desktopTabsContainer = page.getByTestId('editor-tabs-container');
      const desktopBox = await desktopTabsContainer.boundingBox();

      // Test mobile layout
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.waitForTimeout(500);

      const mobileTabsContainer = page.getByTestId('editor-tabs-container');
      const mobileBox = await mobileTabsContainer.boundingBox();

      // Layout should adapt (different positioning/sizing)
      if (desktopBox && mobileBox) {
        const positionChanged =
          Math.abs(desktopBox.x - mobileBox.x) > 50 ||
          Math.abs(desktopBox.y - mobileBox.y) > 50;
        expect(positionChanged).toBeTruthy();
      }

      // Functionality should remain intact
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.red);
      await utils.color.verifyColorApplied(TEST_COLORS.red);
    });

    test('should adapt filter tabs on different screen sizes', async ({
      page,
    }) => {
      await utils.nav.goToCustomizer();

      // First upload some content so filter tabs can actually be activated
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await page.waitForTimeout(1000); // Allow texture to load

      const screenSizes = [
        VIEWPORTS.desktop,
        VIEWPORTS.tablet,
        VIEWPORTS.mobile,
      ];

      for (const viewport of screenSizes) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        // Filter tabs should remain accessible
        await expect(page.getByTestId('filter-tab-logoShirt')).toBeVisible();
        await expect(page.getByTestId('filter-tab-stylishShirt')).toBeVisible();

        // Should be interactive - now with content to actually filter
        await utils.texture.activateFilter('logoShirt');
        await utils.texture.verifyFilterActive('logoShirt');
      }
    });
  });

  test.describe('Responsive Text and Typography', () => {
    test('should maintain readable text across screen sizes', async ({
      page,
    }) => {
      const viewportsToTest = [
        VIEWPORTS.mobile,
        VIEWPORTS.tablet,
        VIEWPORTS.desktop,
      ];

      for (const viewport of viewportsToTest) {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Main heading should be readable
        const heading = page.getByRole('heading', { name: "LET'S DO IT." });
        await expect(heading).toBeVisible();

        const headingStyles = await heading.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            fontSize: parseFloat(styles.fontSize),
            lineHeight: styles.lineHeight,
          };
        });

        // Font size should be reasonable (at least 16px on mobile)
        const minFontSize = viewport.width <= 768 ? 16 : 14;
        expect(headingStyles.fontSize).toBeGreaterThanOrEqual(minFontSize);
      }
    });

    test('should scale button text appropriately', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/');

      const button = page.getByRole('button', { name: 'Customize It' });
      await expect(button).toBeVisible();

      const buttonStyles = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: parseFloat(styles.fontSize),
          padding: styles.padding,
        };
      });

      // Button text should be readable on mobile
      expect(buttonStyles.fontSize).toBeGreaterThanOrEqual(14);
    });
  });

  test.describe('Mobile-First Workflow Validation', () => {
    test('should complete full workflow on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.goto('/');

      // Complete mobile workflow
      await utils.nav.goToCustomizer();
      await page.waitForTimeout(2000); // Extra time for mobile

      // Color customization
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.cyan);
      await utils.color.verifyColorApplied(TEST_COLORS.cyan);

      // File upload
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Download functionality
      const download = await utils.download.downloadImage(
        'mobile-test',
        'Download Shirt'
      );
      expect(download.suggestedFilename()).toContain('mobile-test');
    });

    test('should handle mobile gestures and interactions', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await utils.nav.goToCustomizer();

      // Test various mobile interactions
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle(TEST_COLORS.green).click();

      // Test filter interactions
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByTestId('filter-tab-stylishShirt').click();

      // Test navigation
      await page.getByRole('button', { name: 'Go Back' }).click();
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain state consistency across viewport changes', async ({
      page,
    }) => {
      // Start on desktop
      await page.setViewportSize(VIEWPORTS.desktop);
      await utils.nav.goToCustomizer();

      // Make changes
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.purple);
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Switch to mobile
      await page.setViewportSize(VIEWPORTS.mobile);
      await page.waitForTimeout(1000);

      // Verify state persisted
      await utils.color.verifyColorApplied(TEST_COLORS.purple);
      await utils.texture.verifyTextureVisible('logo');

      // Switch to tablet
      await page.setViewportSize(VIEWPORTS.tablet);
      await page.waitForTimeout(1000);

      // State should still be intact
      await utils.color.verifyColorApplied(TEST_COLORS.purple);
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should provide consistent user experience across devices', async ({
      page,
    }) => {
      const devices = [
        { name: 'Mobile', viewport: VIEWPORTS.mobile },
        { name: 'Tablet', viewport: VIEWPORTS.tablet },
        { name: 'Desktop', viewport: VIEWPORTS.desktop },
      ];

      for (const device of devices) {
        await page.setViewportSize(device.viewport);
        await page.goto('/');

        // Core user journey should work consistently
        await utils.nav.goToCustomizer();

        // Essential features should be accessible
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(page.getByTestId('filter-tabs-container')).toBeVisible();

        // Basic interactions should work
        await utils.color.openColorPicker();
        await utils.color.selectColor(TEST_COLORS.lightBlue);
        await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
      }
    });
  });
});
