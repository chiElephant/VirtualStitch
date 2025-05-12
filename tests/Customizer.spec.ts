import { test, expect, type Page, type BrowserContext } from '@playwright/test';

async function toggleEditorTab(page: Page, tabName: string) {
  await page.getByRole('img', { name: tabName }).click();
}
async function toggleFilterTab(page: Page, tabTestId: string) {
  await page.getByTestId(tabTestId).click();
}

test.describe('Customizer', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // If back button is visible, click it to reset to home
    if (await page.getByTestId('go-back-button').isVisible()) {
      await page.getByTestId('go-back-button').click();
    }
    // Reopen the customizer
    await page.getByRole('button', { name: /customize/i }).click();
  });

  test.describe('Filter tabs', () => {
    test('should display all filter tabs', async () => {
      const ids = [
        'filter-tabs-container',
        'filter-tab-logoShirt',
        'filter-tab-stylishShirt',
      ];
      for (const id of ids) {
        await expect(page.getByTestId(id)).toBeVisible();
      }
    });
  });

  test.describe('Editor tabs', () => {
    test('should display all editor tabs', async () => {
      const checks: {
        locator: (
          page: Page
        ) => ReturnType<Page['getByTestId']> | ReturnType<Page['getByRole']>;
        name: string;
      }[] = [
        {
          locator: (p) => p.getByTestId('editor-tabs-container'),
          name: 'editor-tabs-container',
        },
        {
          locator: (p) => p.getByRole('img', { name: 'colorPicker' }),
          name: 'colorPicker',
        },
        {
          locator: (p) => p.getByRole('img', { name: 'filePicker' }),
          name: 'filePicker',
        },
        {
          locator: (p) => p.getByRole('img', { name: 'aiPicker' }),
          name: 'aiPicker',
        },
        {
          locator: (p) => p.getByRole('img', { name: 'imageDownload' }),
          name: 'imageDownload',
        },
      ];
      for (const { locator } of checks) {
        await expect(locator(page)).toBeVisible();
      }
    });
  });

  test.describe('Back button', () => {
    test('should display a back button and navigate home when clicked', async () => {
      await test.step('Back button is visible', async () => {
        await expect(page.getByTestId('go-back-button')).toBeVisible();
      });
      await test.step('Clicking back navigates to home', async () => {
        await page.getByTestId('go-back-button').click();
        await expect(
          page.getByRole('heading', { name: "LET'S DO IT." })
        ).toBeVisible();
      });
    });
  });

  test.describe('Editor Tab Toggle Behavior', () => {
    test('should toggle editor tabs open and close on click', async () => {
      await toggleEditorTab(page, 'colorPicker');
      await expect(page.getByTestId('color-picker')).toBeVisible();

      await toggleEditorTab(page, 'colorPicker');
      await expect(page.getByTestId('color-picker')).toHaveCount(0);
    });

    test('should display correct content when each editor tab is clicked', async () => {
      const tabsAndTestIds = [
        { tab: 'colorPicker', testId: 'color-picker' },
        { tab: 'filePicker', testId: 'file-picker' },
        { tab: 'aiPicker', testId: 'ai-picker' },
        { tab: 'imageDownload', testId: 'image-download' },
      ];

      for (const { tab, testId } of tabsAndTestIds) {
        await toggleEditorTab(page, tab);
        await expect(page.getByTestId(testId)).toBeVisible();
        // Close after checking
        await toggleEditorTab(page, tab);
      }
    });
  });

  test.describe('Filter and Editor Tab Interaction', () => {
    test('should not change filter tab state when toggling editor tabs', async () => {
      await toggleFilterTab(page, 'filter-tab-logoShirt');

      // Check background color and opacity before toggling editor tab
      const stylesBefore = await page
        .getByTestId('filter-tab-logoShirt')
        .evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            bgColor: computed.backgroundColor,
            opacity: computed.opacity,
          };
        });

      expect(stylesBefore.bgColor).not.toBe('transparent');
      expect(stylesBefore.opacity).toBe('0.5');

      // Toggle editor tab
      await toggleEditorTab(page, 'colorPicker');

      // Check background color and opacity after toggling editor tab
      const stylesAfter = await page
        .getByTestId('filter-tab-logoShirt')
        .evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            bgColor: computed.backgroundColor,
            opacity: computed.opacity,
          };
        });

      expect(stylesAfter.bgColor).toBe(stylesBefore.bgColor);
      expect(stylesAfter.opacity).toBe(stylesBefore.opacity);
    });
  });

  test.describe('Back Button Reset Behavior', () => {
    test('should reset to home and hide tabs when back button is clicked after interactions', async () => {
      await toggleFilterTab(page, 'filter-tab-logoShirt');
      await toggleEditorTab(page, 'colorPicker');

      await page.getByTestId('go-back-button').click();

      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(page.getByTestId('filter-tabs-container')).toHaveCount(0);
      await expect(page.getByTestId('editor-tabs-container')).toHaveCount(0);
    });
  });
});
