import { test, expect } from '@playwright/test';
import {
  TestUtils,
  TEST_FILES,
  TEST_COLORS,
  VALID_TEST_IMAGE_BASE64,
} from '../utils/test-helpers';

test.describe('Complete User Workflows @e2e', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Logo Customization Workflow', () => {
    test('should complete full logo customization and download', async ({
      page,
    }) => {
      await page.goto('/');

      // Step 1: Navigate to customizer
      await utils.nav.goToCustomizer();

      // Step 2: Change color
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.green);
      await utils.color.verifyColorApplied(TEST_COLORS.green);

      // Step 3: Upload logo
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Step 4: Download both canvas and logo
      const canvasDownload = await utils.download.downloadImage(
        'my-custom-shirt',
        'Download Shirt'
      );
      expect(canvasDownload.suggestedFilename()).toContain('my-custom-shirt');

      const logoDownload = await utils.download.downloadImage(
        'my-logo',
        'Download Logo'
      );
      expect(logoDownload.suggestedFilename()).toContain('my-logo');

      // Step 5: Verify state persistence
      await utils.color.openColorPicker();
      await utils.color.verifyColorApplied(TEST_COLORS.green);
      await utils.texture.verifyTextureVisible('logo');
    });
  });

  test.describe('Pattern Customization Workflow', () => {
    test('should complete full pattern customization and download', async ({
      page,
    }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Customize with pattern
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.purple);
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');

      // Verify changes applied
      await utils.color.verifyColorApplied(TEST_COLORS.purple);
      await utils.texture.verifyTextureVisible('full');

      // Download both items
      const canvasDownload = await utils.download.downloadImage(
        'pattern-shirt',
        'Download Shirt'
      );
      expect(canvasDownload.suggestedFilename()).toContain('pattern-shirt');

      const patternDownload = await utils.download.downloadImage(
        'my-pattern',
        'Download Pattern'
      );
      expect(patternDownload.suggestedFilename()).toContain('my-pattern');
    });
  });

  test.describe('AI-Powered Workflow', () => {
    test('should complete AI generation to download workflow', async ({
      page,
    }) => {
      await utils.ai.mockSuccessfulResponse();

      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Generate AI logo
      await utils.ai.generateImage('Modern tech company logo', 'logo');
      await utils.ai.verifySuccessToast();
      await utils.texture.verifyTextureVisible('logo');

      // Customize color
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.dark);
      await utils.color.verifyColorApplied(TEST_COLORS.dark);

      // Download final result
      const download = await utils.download.downloadImage(
        'ai-logo-shirt',
        'Download Shirt'
      );
      expect(download.suggestedFilename()).toContain('ai-logo-shirt');
    });

    test('should handle AI generation failure and recovery', async ({
      page,
    }) => {
      // Mock failure then success
      let callCount = 0;
      await page.route('/api/custom-logo', (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({ status: 500 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        }
      });

      await page.goto('/');
      await utils.nav.goToCustomizer();

      // First attempt fails
      await utils.ai.generateImage('Test prompt');
      await utils.ai.verifyErrorToast('server');

      // Retry succeeds
      await utils.nav.openEditorTab('aiPicker');
      await utils.ai.generateImage('Test prompt');
      await utils.ai.verifySuccessToast();
      await utils.texture.verifyTextureVisible('logo');
    });
  });

  test.describe('Multi-Layer Customization', () => {
    test('should apply and manage both logo and pattern simultaneously', async ({
      page,
    }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Upload and apply logo
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Upload and apply pattern
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');
      await utils.texture.verifyTextureVisible('full');

      // Re-activate logo filter if needed
      const logoFilterActive = await page
        .getByTestId('filter-tab-logoShirt')
        .getAttribute('data-is-active');

      if (logoFilterActive !== 'true') {
        await utils.texture.activateFilter('logoShirt');
      }

      // Verify both textures visible
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');

      // Test filter combinations
      await utils.texture.activateFilter('logoShirt'); // Disable logo
      await utils.texture.verifyTextureHidden('logo');
      await utils.texture.verifyTextureVisible('full');

      await utils.texture.activateFilter('logoShirt'); // Re-enable logo
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain customizations when navigating back and forth', async () => {
      // Make customizations
      await utils.nav.goToCustomizer();
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Navigate away and back
      await utils.nav.goToHome();
      await utils.nav.openCustomizer();

      // Verify persistence
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should handle complex state persistence across navigation', async ({
      page,
    }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Complex state setup
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.red);
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');

      // Activate both filters
      await utils.texture.activateFilter('logoShirt');

      // Multiple navigation cycles
      for (let i = 0; i < 3; i++) {
        await utils.nav.goToHome();
        await utils.nav.openCustomizer();
      }

      // Verify complex state maintained
      await utils.color.verifyColorApplied(TEST_COLORS.red);
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');
    });
  });

  test.describe('Mobile Workflow Simulation', () => {
    test('should complete workflow on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Complete mobile workflow
      await utils.nav.goToCustomizer();
      await utils.wait.waitForAnimations(); // Mobile may need extra time

      // Test mobile interactions
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);

      // File upload on mobile
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Download on mobile
      const download = await utils.download.downloadImage(
        'mobile-shirt',
        'Download Shirt'
      );
      expect(download.suggestedFilename()).toContain('mobile-shirt');
    });

    test('should handle orientation changes during workflow', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Start customization in portrait
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.green);

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(1000);

      // Continue customization in landscape
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');

      // Verify color persisted through orientation change
      await utils.color.verifyColorApplied(TEST_COLORS.green);
    });
  });

  test.describe('Edge Case Workflows', () => {
    test('should handle rapid sequential operations', async ({ page }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Rapid color changes
      await utils.color.openColorPicker();
      const colors = [
        TEST_COLORS.lightBlue,
        TEST_COLORS.purple,
        TEST_COLORS.green,
        TEST_COLORS.dark,
      ];

      for (const color of colors) {
        await utils.color.selectColor(color);
        await page.waitForTimeout(100); // Rapid but not instant
      }

      // Upload file during color changes
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Rapid filter toggling
      for (let i = 0; i < 4; i++) {
        await utils.texture.activateFilter('logoShirt');
        await page.waitForTimeout(50);
      }

      // Verify final state is stable
      await expect(page.locator('body')).toBeVisible();
      await utils.texture.verifyTextureVisible('logo');
      await utils.color.verifyColorApplied(colors[colors.length - 1]);
    });

    test('should handle workflow interruption and resumption', async ({
      page,
    }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Start workflow
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.yellow);
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Simulate interruption (page reload)
      await page.reload();
      await utils.nav.goToCustomizer();

      // Resume workflow - state should be reset to defaults
      await expect(
        page.getByTestId(`canvas-color-${TEST_COLORS.defaultGreen}`)
      ).toHaveCount(1);
      await utils.texture.verifyTextureHidden('logo');

      // Complete new workflow
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.cyan);
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');
      await utils.texture.verifyTextureVisible('full');
    });
  });

  test.describe('Performance Under Load', () => {
    test('should maintain performance with multiple texture switches', async ({
      page,
    }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Upload initial texture
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');

      // Multiple rapid texture applications
      const files = [TEST_FILES.emblem, TEST_FILES.emblem2, TEST_FILES.emblem];

      for (const file of files) {
        await utils.nav.openEditorTab('filePicker');
        await utils.file.uploadFile(file, 'logo');
        await utils.wait.waitForTextureApplication();
      }

      // Verify final state and performance
      await utils.texture.verifyTextureVisible('logo');
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle concurrent operations gracefully', async ({ page }) => {
      await page.goto('/');
      await utils.nav.goToCustomizer();

      // Setup initial state
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.color.openColorPicker();

      // Trigger concurrent operations
      const operations = [
        utils.color.selectColor(TEST_COLORS.green),
        utils.color.selectColor(TEST_COLORS.lightBlue),
        page.getByTestId('filter-tab-logoShirt').click(),
      ];

      await Promise.allSettled(operations);

      // App should remain stable
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
    });
  });
});
