import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const sampleImagePath1 = './tests/fixtures/emblem.png';

async function uploadFile(page: Page, filePath: string) {
  await page.getByText('Upload File').click();
  await page.getByTestId('file-picker-input').setInputFiles(filePath);
}

test.describe('File Picker - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'filePicker' }).click();
  });

  test('should display the file picker when file picker tab is clicked', async ({
    page,
  }) => {
    await expect(page.getByTestId('file-picker')).toBeVisible();
  });

  test('should upload a file and display its name', async ({ page }) => {
    await uploadFile(page, sampleImagePath1);
    await expect(page.getByText('emblem.png')).toBeVisible();
  });

  test('should display uploaded image as logo when logo button is clicked', async ({
    page,
  }) => {
    await expect(page.getByTestId('logo-texture')).toHaveCount(0);

    await uploadFile(page, sampleImagePath1);
    await expect(page.getByText('emblem.png')).toBeVisible();

    await page.getByRole('button', { name: 'Logo' }).click();
    await expect(page.getByTestId('logo-texture')).toHaveCount(1);
  });

  test('should display uploaded image as fullLogo when full button is clicked', async ({
    page,
  }) => {
    await expect(page.getByTestId('full-texture')).toHaveCount(0);

    await uploadFile(page, sampleImagePath1);
    await expect(page.getByText('emblem.png')).toBeVisible();

    await page.getByRole('button', { name: 'Full' }).click();
    await expect(page.getByTestId('full-texture')).toHaveCount(1);
  });
});
