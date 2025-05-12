import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const sampleImagePath1 = './tests/fixtures/emblem.png';

async function uploadFile(page: Page, filePath: string) {
  await page.getByText('Upload File').click();
  await page.getByTestId('file-picker-input').setInputFiles(filePath);
}

test.describe('File Picker - Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'filePicker' }).click();
  });

  test('should keep uploaded file name after applying as logo and reopening picker', async ({
    page,
  }) => {
    await uploadFile(page, sampleImagePath1);
    await expect(page.getByText('emblem.png')).toBeVisible();

    await page.getByRole('button', { name: 'Logo' }).click();
    await expect(page.getByTestId('file-picker')).toHaveCount(0);

    // Reopen the File Picker
    await page.getByRole('img', { name: 'filePicker' }).click();
    await expect(page.getByTestId('file-picker')).toBeVisible();
    await expect(page.getByText('emblem.png')).toBeVisible();
  });

  test('should keep uploaded file name after applying as full and reopening picker', async ({
    page,
  }) => {
    await uploadFile(page, sampleImagePath1);
    await expect(page.getByText('emblem.png')).toBeVisible();

    await page.getByRole('button', { name: 'Full' }).click();
    await expect(page.getByTestId('file-picker')).toHaveCount(0);

    // Reopen the File Picker
    await page.getByRole('img', { name: 'filePicker' }).click();
    await expect(page.getByTestId('file-picker')).toBeVisible();
    await expect(page.getByText('emblem.png')).toBeVisible();
  });
});
