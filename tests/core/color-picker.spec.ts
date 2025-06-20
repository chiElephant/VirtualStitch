import { test, expect } from '@playwright/test';
import { TestUtils, TEST_COLORS } from '../utils/test-helpers';
import { presetColors } from '../../config/presetColors';

test.describe('Color Picker', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
    await utils.nav.goToCustomizer();
    await utils.color.openColorPicker();
  });

  test.describe('Initial State', () => {
    test('should initialize with default green color', async ({ page }) => {
      await utils.color.verifyColorApplied(TEST_COLORS.defaultGreen);
    });

    test('should display color picker interface', async ({ page }) => {
      await expect(page.getByTestId('color-picker')).toBeVisible();
    });
  });

  test.describe('Color Selection', () => {
    test('should update shirt and button colors when selecting preset colors', async ({ page }) => {
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
    });

    // Test all preset colors
    presetColors.forEach((color) => {
      test(`should apply color ${color} correctly`, async ({ page }) => {
        await utils.color.selectColor(color);
        await utils.color.verifyColorApplied(color);
      });
    });

    test('should handle rapid color changes smoothly', async ({ page }) => {
      const colors = [TEST_COLORS.lightBlue, TEST_COLORS.purple, TEST_COLORS.green];
      
      for (const color of colors) {
        await utils.color.selectColor(color);
      }
      
      const finalColor = colors[colors.length - 1];
      await utils.color.verifyColorApplied(finalColor);
    });
  });

  test.describe('Custom Color Input', () => {
    test('should update color when using hue slider', async ({ page }) => {
      const button = page.getByRole('button', { name: 'Go Back' });
      const currentTestId = await button.getAttribute('data-testid');

      await page
        .locator('.hue-horizontal')
        .click({ position: { x: 20, y: 5 } });

      // Verify color changed
      const newTestId = await button.getAttribute('data-testid');
      expect(newTestId).not.toBe(currentTestId);
    });
  });

  test.describe('State Persistence', () => {
    test('should preserve selected color when closing and reopening picker', async ({ page }) => {
      await utils.color.selectColor(TEST_COLORS.lightBlue);
      
      // Close and reopen color picker
      await page.getByTestId('editor-tab-aiPicker').click();
      await utils.color.openColorPicker();
      
      await utils.color.verifyColorApplied(TEST_COLORS.lightBlue);
    });
  });
});
