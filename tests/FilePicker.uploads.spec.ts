import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const uploads: [string, string][] = [
  ['./tests/fixtures/emblem.png', 'emblem.png'],
  ['./tests/fixtures/emblem2.png', 'emblem2.png'],
];

async function uploadFile(page: Page, filePath: string) {
  await page.getByText('Upload File').click();
  await page.getByTestId('file-picker-input').setInputFiles(filePath);
}

test.describe('File Picker - Uploads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const customizeBtn = page.getByRole('button', { name: /customize/i });
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();

    const filePickerTab = page.getByRole('img', { name: 'filePicker' });
    await expect(filePickerTab).toBeVisible();
    await filePickerTab.click();
  });

  uploads.forEach(([filePath, label]: [string, string]) => {
    test(`uploading ${label} displays ${label}`, async ({ page }) => {
      await uploadFile(page, filePath);
      await expect(page.getByText(label)).toBeVisible();
    });
  });
});
