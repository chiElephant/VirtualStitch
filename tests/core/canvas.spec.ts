import { test, expect } from '@playwright/test';
import { TestUtils, TEST_FILES, TEST_COLORS } from '../utils/test-helpers';

test.describe('Canvas and 3D Rendering', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
  });

  test.describe('Initial State', () => {
    test('should display canvas element', async ({ page }) => {
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should not display textures initially', async ({ page }) => {
      await utils.texture.verifyTextureHidden('logo');
      await utils.texture.verifyTextureHidden('full');
    });

    test('should start with default color', async ({ page }) => {
      await expect(page.getByTestId(`canvas-color-${TEST_COLORS.defaultGreen}`)).toHaveCount(1);
    });
  });

  test.describe('Color Rendering', () => {
    test('should update canvas color when color changes', async ({ page }) => {
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      
      await expect(page.getByTestId(`canvas-color-${TEST_COLORS.lightBlue}`)).toHaveCount(1);
      await expect(page.getByTestId(`canvas-color-${TEST_COLORS.defaultGreen}`)).toHaveCount(0);
    });

    test('should handle rapid color changes smoothly', async ({ page }) => {
      await utils.color.openColorPicker();
      
      const colors = [TEST_COLORS.lightBlue, TEST_COLORS.purple, TEST_COLORS.green];
      for (const color of colors) {
        await utils.color.selectColor(color);
        await page.waitForTimeout(50); // Rapid changes
      }
      
      const finalColor = colors[colors.length - 1];
      await expect(page.getByTestId(`canvas-color-${finalColor}`)).toHaveCount(1);
    });
  });

  test.describe('Logo Texture Behavior', () => {
    test('should display logo when filter is activated', async ({ page }) => {
      await utils.texture.verifyTextureHidden('logo');
      
      await utils.texture.activateFilter('logoShirt');
      
      await utils.texture.verifyTextureVisible('logo');
    });

    test('should hide logo when filter is deactivated', async ({ page }) => {
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.verifyTextureVisible('logo');
      
      await utils.texture.activateFilter('logoShirt'); // Toggle off
      
      await utils.texture.verifyTextureHidden('logo');
    });

    test('should display custom logo after upload', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.texture.verifyTextureVisible('logo');
    });
  });

  test.describe('Full Texture Behavior', () => {
    test('should display full texture when filter is activated', async ({ page }) => {
      await utils.texture.verifyTextureHidden('full');
      
      await utils.texture.activateFilter('stylishShirt');
      
      await utils.texture.verifyTextureVisible('full');
    });

    test('should hide full texture when filter is deactivated', async ({ page }) => {
      await utils.texture.activateFilter('stylishShirt');
      await utils.texture.verifyTextureVisible('full');
      
      await utils.texture.activateFilter('stylishShirt'); // Toggle off
      
      await utils.texture.verifyTextureHidden('full');
    });

    test('should display custom pattern after upload', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'full');
      await utils.texture.verifyTextureVisible('full');
    });
  });

  test.describe('Combined Textures', () => {
    test('should display both textures when both filters are active', async ({ page }) => {
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');
      
      // Ensure both filters are active
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.activateFilter('stylishShirt');
      
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');
    });

    test('should hide both textures when both filters are deactivated', async ({ page }) => {
      // Setup both textures
      await utils.file.uploadFile(TEST_FILES.emblem, 'logo');
      await utils.file.uploadFile(TEST_FILES.emblem2, 'full');
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.activateFilter('stylishShirt');
      
      // Verify both visible
      await utils.texture.verifyTextureVisible('logo');
      await utils.texture.verifyTextureVisible('full');
      
      // Deactivate both
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.activateFilter('stylishShirt');
      
      await utils.texture.verifyTextureHidden('logo');
      await utils.texture.verifyTextureHidden('full');
    });
  });

  test.describe('Canvas Interactions', () => {
    test('should handle mouse interactions over canvas', async ({ page }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).toBeTruthy();

      if (boundingBox) {
        // Simulate camera rig mouse movements
        await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
        await page.mouse.move(boundingBox.x + 200, boundingBox.y + 150);
        
        // Canvas should remain functional
        await expect(canvas).toBeVisible();
        
        // Color changes should still work during interaction
        await utils.color.openColorPicker();
        await utils.color.selectColor(TEST_COLORS.dark);
        await utils.color.verifyColorApplied(TEST_COLORS.dark);
      }
    });

    test('should handle window resize during rendering', async ({ page }) => {
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      
      // Trigger window resizes
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(500);
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      
      // Should continue rendering correctly
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
      await expect(page.locator('canvas')).toBeVisible();
    });
  });

  test.describe('Canvas Operations When Hidden', () => {
    test('should handle state updates when canvas is not visible', async ({ page }) => {
      // Hide canvas with CSS
      await page.addStyleTag({
        content: 'canvas { display: none !important; }',
      });

      // State should still update
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.green);
      
      await expect(page.getByTestId(`canvas-color-${TEST_COLORS.green}`)).toHaveCount(1);
    });
  });

  test.describe('WebGL Context Handling', () => {
    test('should handle WebGL context loss simulation', async ({ page }) => {
      // Simulate WebGL context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
              // Restore after delay
              setTimeout(() => ext.restoreContext(), 1000);
            }
          }
        }
      });

      await page.waitForTimeout(2000);
      
      // Should recover gracefully
      await utils.color.openColorPicker();
      await utils.color.selectColor(TEST_COLORS.purple);
      await utils.color.verifyColorApplied(TEST_COLORS.purple);
    });

    test('should handle missing WebGL support', async ({ page }) => {
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

      await page.goto('/');
      
      // App should still load (might show fallback)
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Customize It' })).toBeVisible();
    });
  });

  test.describe('Performance Considerations', () => {
    test('should render canvas with proper dimensions', async ({ page }) => {
      await page.waitForTimeout(2000); // Allow Three.js initialization
      
      const canvasInfo = await page.evaluate((): { exists: boolean; hasContent: boolean } => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return { exists: false, hasContent: false };
        
        const hasContent = canvas.width > 0 && canvas.height > 0;
        return { exists: true, hasContent };
      });

      expect(canvasInfo.exists).toBeTruthy();
      expect(canvasInfo.hasContent).toBeTruthy();
    });
  });
});
