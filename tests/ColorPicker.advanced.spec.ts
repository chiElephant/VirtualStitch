import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
let context: BrowserContext;
let page: Page;

test.describe('Color Picker Advanced Interactions', () => {
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

  test('should update the shirt color when using the hue slider', async () => {
    const initialColor = await page
      .getByTestId('go-back-button')
      .evaluate(
        (el: HTMLElement) => window.getComputedStyle(el).backgroundColor
      );

    await page.locator('.hue-horizontal').click({ position: { x: 20, y: 5 } });

    await expect
      .poll(
        async () =>
          await page
            .getByTestId('go-back-button')
            .evaluate(
              (el: HTMLElement) => window.getComputedStyle(el).backgroundColor
            ),
        { timeout: 500 }
      )
      .not.toBe(initialColor);
  });

  test('should preserve selected color after closing and reopening the color picker tab', async () => {
    await page.getByTitle('#2CCCE4'.toUpperCase()).click();
    await page.getByRole('img', { name: 'aiPicker' }).click();
    await page.getByRole('img', { name: 'colorPicker' }).click();
    await expect(page.getByTestId('#2ccce4')).toHaveCount(1, { timeout: 500 });
  });

  test.afterAll(async () => {
    await context.close();
  });
});
