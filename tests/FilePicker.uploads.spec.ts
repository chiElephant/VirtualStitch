import { test, expect, type Page } from '@playwright/test';
test.setTimeout(60 * 1000);

const uploads: [string, string][] = [
  ['./tests/fixtures/emblem.png', 'emblem.png'],
  ['./tests/fixtures/emblem2.png', 'emblem2.png'],
];

async function uploadFile(page: Page, filePath: string) {
  await page.getByText('Upload File').click();
  // wait for file input to be ready
  await expect(page.getByTestId('file-picker-input')).toBeVisible({
    timeout: 15000,
  });
  await page.getByTestId('file-picker-input').setInputFiles(filePath);
}

test.describe('File Picker - Uploads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Customizer
    const customizeBtn = page.getByRole('button', { name: /customize/i });
    await expect(customizeBtn).toBeVisible({ timeout: 15000 });
    await customizeBtn.click();

    // Switch to File Picker tab
    const filePickerTab = page.getByRole('img', { name: 'filePicker' });
    await expect(filePickerTab).toBeVisible({ timeout: 15000 });
    await filePickerTab.click();
  });

  uploads.forEach(([filePath, label]: [string, string]) => {
    test(`uploading ${label} displays ${label}`, async ({ page }) => {
      await uploadFile(page, filePath);
      await expect(page.getByText(label)).toBeVisible();
    });
  });
});
