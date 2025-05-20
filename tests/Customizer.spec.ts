import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function toggleEditorTab(page: Page, tabName: string) {
  await page.getByTestId(`editor-tab-${tabName}`).click();
}
async function toggleFilterTab(page: Page, tabTestId: string) {
  await page.getByTestId(tabTestId).click();
}

const tabsAndTestIds = [
  { tab: 'colorPicker', testId: 'color-picker' },
  { tab: 'filePicker', testId: 'file-picker' },
  { tab: 'aiPicker', testId: 'ai-picker' },
  { tab: 'imageDownload', testId: 'image-download' },
];

test.describe('Customizer', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL}`);
    await page.getByRole('button', { name: 'Customize It' }).click();
  });

  test.describe('Filter tabs', () => {
    test('should display the filter tabs container and tabs', async ({
      page,
    }) => {
      await test.step('Check filter tabs container is visible', async () => {
        await expect(page.getByTestId('filter-tabs-container')).toBeVisible();
      });
      await test.step('Check logo filter tab is visible', async () => {
        await expect(page.getByTestId('filter-tab-logoShirt')).toBeVisible();
      });
      await test.step('Check stylish filter tab is visible', async () => {
        await expect(page.getByTestId('filter-tab-stylishShirt')).toBeVisible();
      });
    });
  });

  test.describe('Editor tabs', () => {
    test('should display the editor tabs container and all tabs', async ({
      page,
    }) => {
      await test.step('Check editor tabs container is visible', async () => {
        await expect(page.getByTestId('editor-tabs-container')).toBeVisible();
      });
      await test.step('Check color picker tab is visible', async () => {
        await expect(
          page.getByRole('img', { name: 'colorPicker' })
        ).toBeVisible();
      });
      await test.step('Check file picker tab is visible', async () => {
        await expect(
          page.getByRole('img', { name: 'filePicker' })
        ).toBeVisible();
      });
      await test.step('Check ai picker tab is visible', async () => {
        await expect(page.getByRole('img', { name: 'aiPicker' })).toBeVisible();
      });
      await test.step('Check image download tab is visible', async () => {
        await expect(
          page.getByRole('img', { name: 'imageDownload' })
        ).toBeVisible();
      });
    });
  });

  test.describe('Back button', () => {
    test('should display a back button and navigate home when clicked', async ({
      page,
    }) => {
      await test.step('Back button is visible', async () => {
        await expect(
          page.getByRole('button', { name: 'Go Back' })
        ).toBeVisible();
      });
      await test.step('Clicking back navigates to home', async () => {
        await page.getByRole('button', { name: 'Go Back' }).click();
        await expect(
          page.getByRole('heading', { name: "LET'S DO IT." })
        ).toBeVisible();
      });
    });
  });

  test.describe('Editor Tab Toggle Behavior', () => {
    test('should toggle editor tabs open and close on click', async ({
      page,
    }) => {
      await toggleEditorTab(page, 'colorPicker');
      await expect(page.getByTestId('color-picker')).toBeVisible();

      await toggleEditorTab(page, 'colorPicker');
      await expect(page.getByTestId('color-picker')).toHaveCount(0);
    });

    tabsAndTestIds.forEach(({ tab, testId }) => {
      test(`should display the ${tab} editor tab`, async ({ page }) => {
        await toggleEditorTab(page, tab);
        await expect(page.getByTestId(testId)).toBeVisible();
      });
    });
  });

  test.describe('Filter and Editor Tab Interaction', () => {
    test('should not change filter tab state when toggling editor tabs', async ({
      page,
    }) => {
      await page.getByTestId('filter-tab-logoShirt').click();

      const isActiveTab = await page
        .getByTestId('filter-tab-logoShirt')
        .getAttribute('data-is-active');

      expect(isActiveTab).toBeTruthy();

      // Toggle editor tab
      await page.getByTestId('editor-tab-colorPicker').click();

      const newActiveTab = await page
        .getByTestId('filter-tab-logoShirt')
        .getAttribute('data-is-active');

      expect(newActiveTab).toBeTruthy();
    });
  });

  test.describe('Back Button Reset Behavior', () => {
    test('should reset to home and hide tabs when back button is clicked after interactions', async ({
      page,
    }) => {
      await toggleFilterTab(page, 'filter-tab-logoShirt');
      await toggleEditorTab(page, 'colorPicker');

      await page.getByRole('button', { name: 'Go Back' }).click();

      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();
      await expect(page.getByTestId('filter-tabs-container')).toHaveCount(0);
      await expect(page.getByTestId('editor-tabs-container')).toHaveCount(0);
    });
  });
});
