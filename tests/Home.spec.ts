import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Go to the starting url before each test.
    await page.goto('/');
  });

  test.describe.parallel('Static Content', () => {
    const staticItems = [
      {
        name: 'heading',
        locator: (page: Page) =>
          page.getByRole('heading', { name: /LET'S DO IT\./ }),
      },
      {
        name: 'logo',
        locator: (page: Page) => page.getByRole('img', { name: 'logo' }),
      },
      {
        name: 'paragraph',
        locator: (page: Page) =>
          page.getByText(
            'Create your unique and exclusive shirt with our 3D customization tool. Unleash your Imagination and define your style.',
            { exact: false }
          ),
      },
      {
        name: 'canvas',
        locator: (page: Page) => page.locator('canvas'),
      },
      {
        name: 'navigation button',
        locator: (page: Page) =>
          page.getByRole('button', { name: 'Customize It' }),
      },
    ];
    for (const { name, locator } of staticItems) {
      test(`should display the ${name}`, async ({ page }: { page: Page }) => {
        await expect(locator(page)).toBeVisible();
      });
    }
  });

  test.describe('Interactions', () => {
    test('should display Customizer when navigation button is clicked', async ({
      page,
    }: {
      page: Page;
    }) => {
      await expect(page.getByTestId('customizer-main')).toHaveCount(0);

      await page.getByRole('button', { name: 'Customize It' }).click();

      await expect(page.getByTestId('customizer-main')).toHaveCount(1);
    });
  });
});
