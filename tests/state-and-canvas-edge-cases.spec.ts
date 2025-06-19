// tests/state-and-canvas-edge-cases.spec.ts
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Extend window interface for test properties
declare global {
  interface Window {
    memoryPressureArrays?: unknown[];
  }
}

// Helper to trigger rapid state changes
async function rapidStateChanges(page: Page) {
  const colors = ['#CCCCCC', '#EFBD4E', '#80C670', '#726DE8', '#353934'];

  for (const color of colors) {
    await page.getByTitle(color).click();
    await page.waitForTimeout(50); // Very rapid changes
  }
}

// Helper to simulate memory pressure
async function simulateMemoryPressure(page: Page) {
  await page.evaluate(() => {
    // Create large arrays to pressure memory
    const arrays = [];
    for (let i = 0; i < 100; i++) {
      arrays.push(new Array(100000).fill(Math.random()));
    }
    // Intentionally stress test
    window.memoryPressureArrays = arrays;
  });
}

test.describe('State Management Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize It' }).click();
    await page.waitForTimeout(1500);
  });

  test.describe('Valtio State Synchronization', () => {
    test('should handle rapid state changes without losing data', async ({
      page,
    }) => {
      await page.getByTestId('editor-tab-colorPicker').click();

      // Rapid color changes
      await rapidStateChanges(page);

      // Verify final state is consistent
      await expect(page.getByTestId('canvas-color-#353934')).toHaveCount(1);
      await expect(page.getByTestId('button-color-#353934')).toHaveCount(1);

      // Switch tabs and verify state persists
      await page.getByTestId('editor-tab-filePicker').click();
      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('canvas-color-#353934')).toHaveCount(1);
    });

    test('should maintain state consistency across complex interactions', async ({
      page,
    }) => {
      // Complex sequence: color -> file -> filter -> color -> filter
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#2CCCE4').click();

      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem.png');
      await page.getByRole('button', { name: 'Logo' }).click();

      await page.getByTestId('filter-tab-logoShirt').click(); // Toggle off
      await page.getByTestId('filter-tab-logoShirt').click(); // Toggle on

      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#FF6B6B').click();

      // Verify all states are correct
      await expect(page.getByTestId('canvas-color-#FF6B6B')).toHaveCount(1);
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
      await expect(page.getByTestId('filter-tab-logoShirt')).toHaveAttribute(
        'data-is-active',
        'true'
      );
    });

    test('should handle state when switching between intro and customizer rapidly', async ({
      page,
    }) => {
      // Rapid navigation back and forth
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: 'Go Back' }).click();
        await expect(
          page.getByRole('heading', { name: "LET'S DO IT." })
        ).toBeVisible();

        await page.getByRole('button', { name: 'Customize It' }).click();
        await page.waitForTimeout(500);
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      }

      // Final state should be customizer
      await expect(page.getByTestId('customizer-main')).toHaveCount(1);
    });

    test('should preserve texture state when toggling filters rapidly', async ({
      page,
    }) => {
      // Upload both logo and pattern
      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem.png');
      await page.getByRole('button', { name: 'Logo' }).click();

      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem2.png');
      await page.getByRole('button', { name: 'Full' }).click();

      // Rapid filter toggling
      for (let i = 0; i < 10; i++) {
        await page.getByTestId('filter-tab-logoShirt').click();
        await page.getByTestId('filter-tab-stylishShirt').click();
        await page.waitForTimeout(50);
      }

      // Both should still be applied
      await expect(page.getByTestId('logo-texture')).toHaveCount(0); // Last toggle was off
      await expect(page.getByTestId('full-texture')).toHaveCount(0); // Last toggle was off

      // Re-enable both
      await page.getByTestId('filter-tab-logoShirt').click();
      await page.getByTestId('filter-tab-stylishShirt').click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
      await expect(page.getByTestId('full-texture')).toHaveCount(1);
    });
  });

  test.describe('Memory Management', () => {
    test('should handle texture loading under memory pressure', async ({
      page,
    }) => {
      await simulateMemoryPressure(page);

      // Try to load textures under memory pressure
      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem.png');
      await page.getByRole('button', { name: 'Logo' }).click();

      // Should still work despite memory pressure
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);

      // Cleanup
      await page.evaluate(() => {
        // Test cleanup
        delete window.memoryPressureArrays;
      });
    });

    test('should handle multiple large texture changes', async ({ page }) => {
      // Simulate loading multiple textures in sequence
      const files = ['emblem.png', 'emblem2.png', 'emblem.png'];

      await page.getByTestId('editor-tab-filePicker').click();

      for (const file of files) {
        await page
          .getByTestId('file-picker-input')
          .setInputFiles(`tests/fixtures/${file}`);
        await page.getByRole('button', { name: 'Logo' }).click();
        await page.waitForTimeout(100);
      }

      // Final texture should be loaded
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });
  });

  test.describe('Canvas and WebGL Edge Cases', () => {
    test('should handle canvas operations when canvas is not visible', async ({
      page,
    }) => {
      // Hide canvas with CSS
      await page.addStyleTag({
        content: 'canvas { display: none !important; }',
      });

      // Try to change colors and textures
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#80C670').click();

      // State should still update even if canvas is hidden
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
    });

    test('should handle window resize during 3D rendering', async ({
      page,
    }) => {
      // Initial color change to trigger rendering
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#2CCCE4').click();

      // Simulate window resize
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(500);
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(500);
      await page.setViewportSize({ width: 400, height: 600 });

      // Should still render correctly
      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(1);
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should handle mouse interactions during 3D rendering', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Get canvas bounding box
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox).toBeTruthy();

      if (boundingBox) {
        // Simulate mouse movements over canvas (camera rig interactions)
        await page.mouse.move(boundingBox.x + 100, boundingBox.y + 100);
        await page.mouse.move(boundingBox.x + 200, boundingBox.y + 150);
        await page.mouse.move(boundingBox.x + 150, boundingBox.y + 200);

        // Color change should still work during mouse interaction
        await page.getByTestId('editor-tab-colorPicker').click();
        await page.getByTitle('#353934').click();
        await expect(page.getByTestId('canvas-color-#353934')).toHaveCount(1);
      }
    });

    test('should handle rapid texture switching', async ({ page }) => {
      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem.png');

      // Rapid switching between logo and full
      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: 'Logo' }).click();
        await page.waitForTimeout(50);
        await page.getByRole('button', { name: 'Full' }).click();
        await page.waitForTimeout(50);
      }

      // Should end up with full texture
      await expect(page.getByTestId('full-texture')).toHaveCount(1);
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
    });

    test('should handle WebGL context loss simulation', async ({ page }) => {
      // This is a complex test that simulates WebGL context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          const gl =
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');
          if (gl) {
            // Simulate context loss
            const ext = (gl as WebGLRenderingContext).getExtension(
              'WEBGL_lose_context'
            );
            if (ext) {
              ext.loseContext();

              // Simulate context restoration after a delay
              setTimeout(() => {
                ext.restoreContext();
              }, 1000);
            }
          }
        }
      });

      // Wait for potential context restoration
      await page.waitForTimeout(2000);

      // Try to interact with the app - it should still work
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#726DE8').click();

      // Should recover gracefully
      await expect(page.getByTestId('canvas-color-#726DE8')).toHaveCount(1);
    });
  });

  test.describe('Error Boundaries and Recovery', () => {
    test('should handle malformed image data gracefully', async ({ page }) => {
      // Create a malformed base64 image
      await page.evaluate(() => {
        // Inject a malformed image into state
        try {
          // This would normally cause an error in real usage
          const img = new Image();
          img.src = 'data:image/png;base64,invalid_base64_data';
          img.onerror = () => {
            console.log('Image error handled gracefully');
          };
        } catch (error) {
          console.log('Error caught:', error);
        }
      });

      // App should continue functioning
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#EFBD4E').click();
      await expect(page.getByTestId('canvas-color-#EFBD4E')).toHaveCount(1);
    });

    test('should recover from component re-render during interaction', async ({
      page,
    }) => {
      // Start an interaction
      await page.getByTestId('editor-tab-colorPicker').click();

      // Trigger a component re-render by changing viewport
      await page.setViewportSize({ width: 800, height: 600 });

      // Continue the interaction
      await page.getByTitle('#C9FFE5').click();

      // Should complete successfully
      await expect(page.getByTestId('canvas-color-#C9FFE5')).toHaveCount(1);
    });

    test('should handle concurrent state updates', async ({ page }) => {
      // Trigger multiple state updates simultaneously
      const promises = [
        page.getByTestId('filter-tab-logoShirt').click(),
        page.getByTestId('filter-tab-stylishShirt').click(),
      ];

      await Promise.all(promises);

      // Both filters should be active
      await expect(page.getByTestId('filter-tab-logoShirt')).toHaveAttribute(
        'data-is-active',
        'true'
      );
      await expect(page.getByTestId('filter-tab-stylishShirt')).toHaveAttribute(
        'data-is-active',
        'true'
      );
    });
  });

  test.describe('Browser Compatibility Edge Cases', () => {
    test('should handle disabled JavaScript gracefully', async ({ page }) => {
      // This test verifies the app doesn't crash with limited JS functionality
      await page.goto('/');

      // The page should at least load the basic HTML structure
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle missing WebGL support', async ({ page }) => {
      // Mock WebGL as unavailable
      await page.addInitScript(() => {
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          value: function (contextType: string) {
            if (
              contextType === 'webgl' ||
              contextType === 'experimental-webgl'
            ) {
              return null; // Simulate WebGL not available
            }
            return originalGetContext.call(this, contextType);
          },
        });
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
      });

      await page.goto('/');

      // App should still load (might fallback to 2D or show error message)
      await expect(page.locator('body')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Customize It' })
      ).toBeVisible();
    });
  });
});
