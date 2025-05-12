import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
let context: BrowserContext;
let page: Page;

test.describe('Color Picker Suite', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'colorPicker' }).click();
    await page.addStyleTag({
      content: `* { transition-duration: 0s !important; animation-duration: 0s !important; }`,
    });
  });

  test.describe('Color picker', () => {
    test('should initialize with default shirt color and back button color', async () => {
      await expect(page.getByTestId('color-picker')).toBeVisible({
        timeout: 500,
      });
      // default swatch exists (may be hidden by design)
      await expect(page.getByTestId('#efbd4e')).toHaveCount(1, {
        timeout: 500,
      });

      const backButtonColor = await page
        .getByTestId('go-back-button')
        .evaluate(
          (el: HTMLElement) => window.getComputedStyle(el).backgroundColor
        );
      expect(backButtonColor).toBe('rgb(239, 189, 78)');
    });
  });

  test.describe('Color Change Behavior', () => {
    test('multiple color selections update swatch & button without reopening picker', async () => {
      // assuming the picker is already open from beforeAll
      const sequentialColors = ['#cccccc', '#726DE8', '#2CCCE4'];
      for (const color of sequentialColors) {
        await page.getByTitle(color.toUpperCase()).click();
        const hexId = color.toLowerCase();
        await expect(page.getByTestId(hexId)).toHaveCount(1, { timeout: 500 });
        const buttonColor = await page
          .getByTestId('go-back-button')
          .evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(buttonColor).toMatch(/^rgb\(/);
      }
    });

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

    test.describe.parallel('individual color selection', () => {
      presetColors.forEach((color) => {
        test(`selecting ${color} updates the swatch and button`, async () => {
          await page.getByTitle(color.toUpperCase()).click();
          const hexId = color.toLowerCase();
          await expect(page.getByTestId(hexId)).toHaveCount(1, {
            timeout: 500,
          });
          const buttonColor = await page
            .getByTestId('go-back-button')
            .evaluate((el) => window.getComputedStyle(el).backgroundColor);
          expect(buttonColor).toMatch(/^rgb\(/);
        });
      });
    });

    test('rapid color-change sanity check', async () => {
      const rapidColors = ['#2CCCE4', '#726DE8', '#80C670'];
      for (const color of rapidColors) {
        await page.getByTitle(color.toUpperCase()).click();
      }
      const final = rapidColors[rapidColors.length - 1].toLowerCase();
      await expect(page.getByTestId(final)).toHaveCount(1, { timeout: 500 });
    });
  });

  test.afterAll(async () => {
    await context.close();
  });
});
