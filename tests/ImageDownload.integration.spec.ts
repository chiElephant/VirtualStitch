// File: ImageDownload.integration.spec.ts
import { test, expect, type Page, type Download } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /customize/i }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
});

// Helper for uploading, applying filter, and filling filename
async function uploadAndSetup(
  page: Page,
  options: { filter: string; filename: string }
) {
  const { filter, filename } = options;
  await page.getByRole('img', { name: 'filePicker' }).click();
  await page.getByText('Upload File').click();
  await page
    .getByTestId('file-picker-input')
    .setInputFiles('tests/fixtures/emblem.png');
  await page.getByRole('button', { name: filter }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
  await page.getByLabel(/filename/i).fill(filename);
}

// Helper for triggering a download and waiting for it
async function triggerAndWaitForDownload(
  page: Page,
  buttonName: string
): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: buttonName }).click(),
  ]);
  return download;
}

test.describe('ImageDownload Component', () => {
  test.describe('Integration', () => {
    test('should call handleImageDownload with correct arguments when the download logo button is clicked', async ({
      page,
    }) => {
      await uploadAndSetup(page, {
        filter: 'Logo',
        filename: 'logo-func-test',
      });
      const download = await triggerAndWaitForDownload(page, 'Download Logo');
      expect(download).toBeTruthy();
      const filename = download.suggestedFilename();
      expect(filename.startsWith('logo-func-test')).toBeTruthy();
    });

    test('should call handleImageDownload with correct arguments when the download shirt button is clicked', async ({
      page,
    }) => {
      await uploadAndSetup(page, {
        filter: 'Logo',
        filename: 'shirt-func-test',
      });
      const download = await triggerAndWaitForDownload(page, 'Download Shirt');
      expect(download).toBeTruthy();
      const filename = download.suggestedFilename();
      expect(filename.startsWith('shirt-func-test')).toBeTruthy();
    });

    test('should call handleImageDownload with correct arguments when the download pattern button is clicked', async ({
      page,
    }) => {
      await uploadAndSetup(page, {
        filter: 'Full',
        filename: 'pattern-func-test',
      });
      const download = await triggerAndWaitForDownload(
        page,
        'Download Pattern'
      );
      expect(download).toBeTruthy();
      const filename = download.suggestedFilename();
      expect(filename.startsWith('pattern-func-test')).toBeTruthy();
    });
  });
});
