import { test, expect, type Page } from '@playwright/test';
import { presetColors as colorMap } from '@/config/presetColors';

async function clickColor(page: Page, color: string) {
  await page.getByTitle(color).click();
}

test.describe('Color picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize It' }).click();
    await page.getByTestId('editor-tab-colorPicker').click();
  });

  test.describe('Initial State', () => {
    test('should display the color picker when color picker tab is clicked', async ({
      page,
    }) => {
      await expect(page.getByTestId('color-picker')).toBeVisible();
    });

    test('should initialize with default shirt color and back button color', async ({
      page,
    }) => {
      await expect(page.getByTestId('canvas-color-#00C851')).toHaveCount(1);
      await expect(page.getByTestId('button-color-#00C851')).toHaveCount(1);
    });
  });

  test.describe('Color Change Behavior', () => {
    test('should change the shirt color', async ({ page }) => {
      await expect(page.getByTestId('canvas-color-#00C851')).toHaveCount(1);
      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(0);

      await clickColor(page, '#2CCCE4');

      await expect(page.getByTestId('canvas-color-#00C851')).toHaveCount(0);
      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(1);
    });

    test('should change the background color of the Back button', async ({
      page,
    }) => {
      await expect(page.getByTestId('button-color-#00C851')).toHaveCount(1);
      await clickColor(page, '#2CCCE4');
      await expect(page.getByTestId('button-color-#2CCCE4')).toHaveCount(1);
    });

    colorMap.forEach((color) => {
      test(`should update the shirt and back button color for ${color}`, async ({
        page,
      }) => {
        await clickColor(page, color);
        await expect(page.getByTestId(`canvas-color-${color}`)).toHaveCount(1);
        await expect(page.getByTestId(`button-color-${color}`)).toHaveCount(1);
      });
    });

    test('should handle rapid color changes smoothly', async ({ page }) => {
      const colorsToTest = ['#2CCCE4', '#726DE8', '#80C670'];
      for (const color of colorsToTest) {
        await clickColor(page, color);
      }
      const finalColor = colorsToTest[colorsToTest.length - 1].toUpperCase();
      await expect(page.getByTestId(`canvas-color-${finalColor}`)).toHaveCount(
        1
      );
    });
  });

  test.describe('Custom Color Input', () => {
    test('should update the shirt color when using the hue slider', async ({
      page,
    }) => {
      const button = await page.getByRole('button', { name: 'Go Back' });
      const currentTestId = await button.getAttribute('data-testid');

      await page
        .locator('.hue-horizontal')
        .click({ position: { x: 20, y: 5 } });

      // Wait and verify that the color has changed
      const newTestId = await button.getAttribute('data-testid');
      expect(newTestId).not.toBe(currentTestId);
    });
  });

  test.describe('Tab Persistence', () => {
    test('should preserve selected color after closing and reopening the color picker tab', async ({
      page,
    }) => {
      await clickColor(page, '#2CCCE4');
      await page.getByTestId('editor-tab-aiPicker').click(); // switch tab
      await page.getByTestId('editor-tab-colorPicker').click(); // switch back
      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(1);
    });
  });
});
