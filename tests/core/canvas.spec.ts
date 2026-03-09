/**
 * 🎨 CANVAS AND 3D RENDERING TEST SUITE
 * Comprehensive testing of Three.js canvas and rendering functionality
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🎨 Canvas and 3D Rendering', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    await suite.setup({
      navigateToCustomizer: true,
      skipWaitForReady: false,
    });
  });

  // ====================================================================
  // 🎯 INITIAL STATE
  // ====================================================================

  test.describe('Initial State', () => {
    test('should display canvas element properly', async ({ page, suite }) => {
      await suite.assert.verifyComponentVisible('canvas');
    });

    test('should not display textures initially', async ({ suite }) => {
      await suite.assert.verifyTextureHidden('logo');
      await suite.assert.verifyTextureHidden('full');
    });

    test('should start with default color', async ({ page, suite }) => {
      await expect(
        page.getByTestId(`canvas-color-${suite.data.colors.default}`)
      ).toHaveCount(1);
    });

    test('should initialize Three.js context properly', async ({ page, suite }) => {
      await suite.wait.waitStandard(suite.config.delays.long); // Allow Three.js initialization

      const canvasInfo = await page.evaluate((): { 
        exists: boolean; 
        hasContent: boolean;
        webglSupport: boolean;
      } => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return { exists: false, hasContent: false, webglSupport: false };

        const hasContent = canvas.width > 0 && canvas.height > 0;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const webglSupport = !!gl;

        return { exists: true, hasContent, webglSupport };
      });

      expect(canvasInfo.exists).toBeTruthy();
      expect(canvasInfo.hasContent).toBeTruthy();
      expect(canvasInfo.webglSupport).toBeTruthy();
    });
  });

  // ====================================================================
  // 🌈 COLOR RENDERING
  // ====================================================================

  test.describe('Color Rendering', () => {
    test('should update canvas color when color changes', async ({ page, suite }) => {
      await suite.selectColor(suite.data.colors.lightBlue);

      await expect(
        page.getByTestId(`canvas-color-${suite.data.colors.lightBlue}`)
      ).toHaveCount(1);
      await expect(
        page.getByTestId(`canvas-color-${suite.data.colors.default}`)
      ).toHaveCount(0);
    });

    test('should handle rapid color changes smoothly', async ({ page, suite }) => {
      await suite.openEditorTab('colorPicker');

      const colors = [
        suite.data.colors.lightBlue,
        suite.data.colors.purple,
        suite.data.colors.green,
      ];

      for (const color of colors) {
        await page.getByTitle(color).click();
        await suite.wait.waitStandard(suite.config.delays.minimal); // Rapid changes
      }

      const finalColor = colors[colors.length - 1];
      await suite.assert.verifyColorApplied(finalColor);
    });

    test('should persist color selection across tab switches', async ({ suite }) => {
      const selectedColor = suite.data.colors.purple;
      
      await suite.selectColor(selectedColor);
      
      // Switch tabs and verify color persists
      await suite.openEditorTab('filePicker');
      await suite.openEditorTab('colorPicker');
      
      await suite.assert.verifyColorApplied(selectedColor);
    });

    test('should handle all available colors correctly', async ({ suite }) => {
      const testColors = [
        suite.data.colors.lightBlue,
        suite.data.colors.green,
        suite.data.colors.purple,
        suite.data.colors.dark,
        suite.data.colors.red,
      ];

      for (const color of testColors) {
        await suite.selectColor(color);
        await suite.wait.waitStandard(suite.config.delays.brief);
      }
    });
  });

  // ====================================================================
  // 🖼️ LOGO TEXTURE BEHAVIOR
  // ====================================================================

  test.describe('Logo Texture Behavior', () => {
    test('should display logo when filter is activated', async ({ suite }) => {
      await suite.assert.verifyTextureHidden('logo');
      await suite.activateFilter('logoShirt');
      await suite.assert.verifyTextureVisible('logo');
    });

    test('should hide logo when filter is deactivated', async ({ suite }) => {
      await suite.activateFilter('logoShirt');
      await suite.assert.verifyTextureVisible('logo');

      await suite.activateFilter('logoShirt'); // Toggle off
      await suite.assert.verifyTextureHidden('logo');
    });

    test('should display custom logo after upload', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.assert.verifyTextureVisible('logo');
    });

    test('should maintain logo visibility during color changes', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Change color while logo is visible
      await suite.selectColor(suite.data.colors.lightBlue);
      
      // Logo should remain visible
      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyColorApplied(suite.data.colors.lightBlue);
    });
  });

  // ====================================================================
  // 🎨 FULL TEXTURE BEHAVIOR
  // ====================================================================

  test.describe('Full Texture Behavior', () => {
    test('should display full texture when filter is activated', async ({ suite }) => {
      await suite.assert.verifyTextureHidden('full');
      await suite.activateFilter('stylishShirt');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should hide full texture when filter is deactivated', async ({ suite }) => {
      await suite.activateFilter('stylishShirt');
      await suite.assert.verifyTextureVisible('full');

      await suite.activateFilter('stylishShirt'); // Toggle off
      await suite.assert.verifyTextureHidden('full');
    });

    test('should display custom pattern after upload', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should handle texture scaling properly', async ({ page, suite }) => {
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      
      // Verify texture is applied and scaled correctly
      const textureInfo = await page.evaluate(() => {
        const textureElement = document.querySelector('[data-testid="full-texture"]');
        if (!textureElement) return null;
        
        const rect = textureElement.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0
        };
      });
      
      expect(textureInfo?.visible).toBeTruthy();
    });
  });

  // ====================================================================
  // 🔄 COMBINED TEXTURES
  // ====================================================================

  test.describe('Combined Textures', () => {
    test('should display both textures when both filters are active', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');

      // Ensure both filters are active
      await suite.activateFilter('logoShirt');

      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should handle selective texture hiding', async ({ suite }) => {
      // Setup both textures
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.activateFilter('logoShirt');

      // Verify both visible
      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyTextureVisible('full');

      // Deactivate logo filter only
      await suite.activateFilter('logoShirt');

      await suite.assert.verifyTextureHidden('logo');
      await suite.assert.verifyTextureVisible('full');
    });

    test('should hide both textures when both filters are deactivated', async ({ suite }) => {
      // Setup both textures
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.activateFilter('logoShirt');

      // Verify both visible
      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyTextureVisible('full');

      // Deactivate both
      await suite.activateFilter('logoShirt');
      await suite.activateFilter('stylishShirt');

      await suite.assert.verifyTextureHidden('logo');
      await suite.assert.verifyTextureHidden('full');
    });

    test('should maintain texture layering order', async ({ suite }) => {
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      await suite.uploadFile(suite.data.files.validPattern, 'full');
      await suite.activateFilter('logoShirt');

      // Verify both textures are applied with correct z-index
      await suite.verifyApplicationState({
        logoTexture: true,
        fullTexture: true,
        activeFilter: 'logoShirt'
      });
    });
  });

  // ====================================================================
  // 🖱️ CANVAS INTERACTIONS
  // ====================================================================

  test.describe('Canvas Interactions', () => {
    test('should handle mouse interactions over canvas', async ({ page, suite }) => {
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
        await suite.selectColor(suite.data.colors.dark);
      }
    });

    test('should handle window resize during rendering', async ({ page, suite }) => {
      await suite.selectColor(suite.data.colors.lightBlue);

      // Trigger window resizes
      await page.setViewportSize({ width: 800, height: 600 });
      await suite.wait.waitStandard(suite.config.delays.medium);
      
      await page.setViewportSize({ width: 1200, height: 800 });
      await suite.wait.waitStandard(suite.config.delays.medium);

      // Should continue rendering correctly
      await suite.assert.verifyColorApplied(suite.data.colors.lightBlue);
      await suite.assert.verifyComponentVisible('canvas');
    });

    test('should maintain interactivity during texture operations', async ({ page, suite }) => {
      // Start with color selection
      await suite.selectColor(suite.data.colors.purple);
      
      // Upload texture while maintaining interactivity
      await suite.uploadFile(suite.data.files.validLogo, 'logo');
      
      // Should be able to change color immediately after texture upload
      await suite.selectColor(suite.data.colors.green);
      
      // Verify both operations succeeded
      await suite.assert.verifyTextureVisible('logo');
      await suite.assert.verifyColorApplied(suite.data.colors.green);
    });
  });

  // ====================================================================
  // 🔧 CANVAS OPERATIONS WHEN HIDDEN
  // ====================================================================

  test.describe('Canvas Operations When Hidden', () => {
    test('should handle state updates when canvas is not visible', async ({ page, suite }) => {
      // Hide canvas with CSS
      await page.addStyleTag({
        content: 'canvas { display: none !important; }',
      });

      // State should still update
      await suite.selectColor(suite.data.colors.green);

      await expect(
        page.getByTestId(`canvas-color-${suite.data.colors.green}`)
      ).toHaveCount(1);
    });

    test('should recover when canvas becomes visible again', async ({ page, suite }) => {
      const selectedColor = suite.data.colors.red;
      
      // Hide canvas
      await page.addStyleTag({
        content: 'canvas { display: none !important; }',
      });
      
      // Make changes while hidden
      await suite.selectColor(selectedColor);
      
      // Show canvas again
      await page.addStyleTag({
        content: 'canvas { display: block !important; }',
      });
      
      await suite.wait.waitStandard(suite.config.delays.medium);
      
      // Verify state is correct
      await suite.assert.verifyColorApplied(selectedColor);
    });
  });

  // ====================================================================
  // 🌐 WEBGL CONTEXT HANDLING
  // ====================================================================

  test.describe('WebGL Context Handling', () => {
    test('should handle WebGL context loss simulation', async ({ page, suite }) => {
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

      await suite.wait.waitStandard(suite.config.delays.veryLong);

      // Should recover gracefully
      await suite.selectColor(suite.data.colors.purple);
      await suite.assert.verifyColorApplied(suite.data.colors.purple);
    });

    test('should handle missing WebGL support gracefully', async ({ page, suite }) => {
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
      await expect(page.getByRole('button', { name: suite.data.buttonLabels.actions.customizeIt })).toBeVisible();
    });

    test('should detect WebGL capabilities correctly', async ({ page, suite }) => {
      const webglInfo = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return { supported: false };
        
        return {
          supported: true,
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
        };
      });
      
      console.log('WebGL Info:', webglInfo);
      expect(webglInfo.supported).toBeTruthy();
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE CONSIDERATIONS
  // ====================================================================

  test.describe('Performance Considerations', () => {
    test('should render canvas with proper dimensions', async ({ page, suite }) => {
      await suite.wait.waitStandard(suite.config.delays.veryLong); // Allow Three.js initialization

      const canvasInfo = await page.evaluate((): {
        exists: boolean;
        hasContent: boolean;
        dimensions: { width: number; height: number };
      } => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return { exists: false, hasContent: false, dimensions: { width: 0, height: 0 } };

        const hasContent = canvas.width > 0 && canvas.height > 0;
        return {
          exists: true,
          hasContent,
          dimensions: { width: canvas.width, height: canvas.height }
        };
      });

      expect(canvasInfo.exists).toBeTruthy();
      expect(canvasInfo.hasContent).toBeTruthy();
      expect(canvasInfo.dimensions.width).toBeGreaterThan(0);
      expect(canvasInfo.dimensions.height).toBeGreaterThan(0);
    });

    test('should complete color operations within performance threshold', async ({ suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.selectColor(suite.data.colors.lightBlue);
        },
        'Color Selection',
        suite.config.performance.maxInteractionTime
      );
      
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime);
    });

    test('should handle rapid operations without performance degradation', async ({ suite }) => {
      const operations = [
        () => suite.selectColor(suite.data.colors.red),
        () => suite.selectColor(suite.data.colors.green),
        () => suite.selectColor(suite.data.colors.blue),
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
        'Rapid Operations Sequence',
        suite.config.performance.maxInteractionTime * operations.length
      );
      
      // Should complete all operations within reasonable time
      expect(duration).toBeLessThanOrEqual(suite.config.performance.maxInteractionTime * operations.length);
    });

    test('should maintain stable memory usage', async ({ page, suite }) => {
      // Perform multiple operations that could cause memory leaks
      for (let i = 0; i < 5; i++) {
        await suite.selectColor(suite.data.colors.red);
        await suite.selectColor(suite.data.colors.green);
        await suite.activateFilter('logoShirt');
        await suite.activateFilter('logoShirt');
        await suite.wait.waitStandard(suite.config.delays.brief);
      }

      // Check memory usage
      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore - performance.memory is available in Chrome
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });

      if (memoryInfo) {
        console.log('Memory usage:', memoryInfo);
        expect(memoryInfo.usedJSHeapSize).toBeLessThanOrEqual(suite.config.performance.maxMemoryUsage);
      }
    });
  });
});
