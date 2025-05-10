import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const presetColors = [
  '#cccccc',
  '#EFBD4E',
  '#80C670',
  '#726DE8',
  '#353934',
  '#2CCCE4',
  '#ff8a65',
  '#7098DA',
  '#C19277',
  '#FF96AD',
  '#512314',
  '#5F123D',
];

async function clickColor(page: Page, color: string) {
  await page.getByTitle(color.toUpperCase()).click();
}

test.describe('Color picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'colorPicker' }).click();
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
      await expect(page.getByTestId('#efbd4e')).toHaveCount(1);

      const backButtonColor = await page
        .getByTestId('go-back-button')
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(backButtonColor).toBe('rgb(239, 189, 78)');
    });
  });

  test.describe('Color Change Behavior', () => {
    test('should change the shirt color', async ({ page }) => {
      await expect(page.getByTestId('#efbd4e')).toHaveCount(1);
      await expect(page.getByTestId('#2ccce4')).toHaveCount(0);

      await clickColor(page, '#2CCCE4');

      await expect(page.getByTestId('#efbd4e')).toHaveCount(0);
      await expect(page.getByTestId('#2ccce4')).toHaveCount(1);
    });

    test('should change the background color of the Back button', async ({
      page,
    }) => {
      const originalColor = await page
        .getByTestId('go-back-button')
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);

      expect(originalColor).toBe('rgb(239, 189, 78)');

      await clickColor(page, '#2CCCE4');

      const newColor = await page
        .getByTestId('go-back-button')
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);

      expect(newColor).toBe('rgb(44, 204, 228)');
    });

    test('should update the shirt and back button color for each preset color', async ({
      page,
    }) => {
      for (const color of presetColors) {
        await clickColor(page, color);
        const lowerHex = color.toLowerCase();
        await expect(page.getByTestId(lowerHex)).toHaveCount(1);

        const backButtonColor = await page
          .getByTestId('go-back-button')
          .evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(backButtonColor).not.toBe('');
      }
    });

    test('should handle rapid color changes smoothly', async ({ page }) => {
      const colorsToTest = ['#2CCCE4', '#726DE8', '#80C670'];
      for (const color of colorsToTest) {
        await clickColor(page, color);
      }
      const finalColor = colorsToTest[colorsToTest.length - 1].toLowerCase();
      await expect(page.getByTestId(finalColor)).toHaveCount(1);
    });
  });

  test.describe('Custom Color Input', () => {
    test('should update the shirt color when using the hue slider', async ({
      page,
    }) => {
      const initialColor = await page
        .getByTestId('go-back-button')
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);

      // Interact with the hue slider to change the color
      await page
        .locator('.hue-horizontal')
        .click({ position: { x: 20, y: 5 } });

      // Wait and verify that the color has changed
      await expect
        .poll(async () => {
          return await page
            .getByTestId('go-back-button')
            .evaluate((el) => window.getComputedStyle(el).backgroundColor);
        })
        .not.toBe(initialColor);
    });
  });

  test.describe('Tab Persistence', () => {
    test('should preserve selected color after closing and reopening the color picker tab', async ({
      page,
    }) => {
      await clickColor(page, '#2CCCE4');
      await page.getByRole('img', { name: 'aiPicker' }).click(); // switch tab
      await page.getByRole('img', { name: 'colorPicker' }).click(); // switch back
      await expect(page.getByTestId('#2ccce4')).toHaveCount(1);
    });
  });
});
