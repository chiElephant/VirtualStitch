/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ page: Page }>({
  page: async ({ page }, usePage) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /customize/i }).click();
    await usePage(page);
  },
});

async function toggleFilter(page: Page, testId: string) {
  await page.getByTestId(testId).click();
}

test.describe.parallel('Canvas', () => {
  test('filter toggles', async ({ page }) => {
    // initial state
    await expect(page.getByTestId('logo-texture')).toHaveCount(0);
    await expect(page.getByTestId('full-texture')).toHaveCount(0);
    await expect(page.locator('canvas')).toBeVisible();

    // toggle logo on
    await toggleFilter(page, 'filter-tab-logoShirt');
    await expect(page.getByTestId('logo-texture')).toHaveCount(1);

    // toggle full on
    await toggleFilter(page, 'filter-tab-stylishShirt');
    await expect(page.getByTestId('full-texture')).toHaveCount(1);

    // both active
    await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    await expect(page.getByTestId('full-texture')).toHaveCount(1);
  });
});
