// File: ImageDownload.download.spec.ts
import { test, expect, type Page, type Download } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Customize")');
  // Open the download tab
  await page.click('img[alt="imageDownload"]');
  // Wait for a representative download button to ensure the tab is ready
  await expect(
    page.getByRole('button', { name: 'Download Logo' })
  ).toBeVisible();
});

// Helper for uploading, applying filter, and filling filename
async function uploadAndSetup(
  page: Page,
  options: { filter: string; filename: string }
) {
  await page.waitForSelector('img[alt="filePicker"]', { state: 'visible' });
  const { filter, filename } = options;
  await page.getByRole('img', { name: 'filePicker' }).click();
  await page.getByText('Upload File').click();
  await page
    .getByTestId('file-picker-input')
    .setInputFiles('tests/fixtures/emblem.png');
  // Wait for the uploaded file name to appear in the picker UI
  await expect(page.getByText('emblem.png')).toBeVisible();
  await page.getByRole('button', { name: filter }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
  await page.getByLabel(/filename/i).fill(filename);
}

// Helper for triggering a download and waiting for it
async function triggerAndWaitForDownload(
  page: Page,
  buttonName: string
): Promise<Download> {
  const btn = page.getByRole('button', { name: buttonName });
  // Ensure the download button is visible and enabled
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    btn.click(),
  ]);
  return download;
}

test.describe('ImageDownload Component', () => {
  test.describe('Download Behavior', () => {
    test('Download Logo is clicked with logo filter active, filename filled, and logo uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'logo-image' });
      const download = await triggerAndWaitForDownload(page, 'Download Logo');
      expect(download).toBeTruthy();
    });

    test('Download Pattern is clicked with stylish filter active, filename filled, and fullLogo uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Full', filename: 'logo-image' });
      const download = await triggerAndWaitForDownload(
        page,
        'Download Pattern'
      );
      expect(download).toBeTruthy();
    });

    test('Download Shirt is clicked with logo filter active, filename filled, and logo uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'logo-image' });
      const download = await triggerAndWaitForDownload(page, 'Download Shirt');
      expect(download).toBeTruthy();
    });

    test('Download Shirt is clicked with stylish filter active, filename filled, and fullLogo uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Full', filename: 'logo-image' });
      const download = await triggerAndWaitForDownload(page, 'Download Shirt');
      expect(download).toBeTruthy();
    });

    test('should download the image with the correct file name', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'final-name' });
      const download = await triggerAndWaitForDownload(page, 'Download Logo');
      const suggestedFilename = download.suggestedFilename();
      expect(suggestedFilename.startsWith('final-name')).toBeTruthy();
    });
  });
});
