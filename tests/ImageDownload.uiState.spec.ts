// File: ImageDownload.uiState.spec.ts
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
  test.describe('UI State', () => {
    test('should reset filename input after successful download', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'reset-test' });
      const filenameInput = page.getByLabel(/filename/i);
      const download = await triggerAndWaitForDownload(page, 'Download Logo');
      expect(download).toBeTruthy();
      await expect(filenameInput).toHaveValue('');
    });

    test('should disable both buttons after filename reset following download', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'disable-test' });
      const download = await triggerAndWaitForDownload(page, 'Download Logo');
      expect(download).toBeTruthy();
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', { name: 'Download Shirt' });
      await expect(logoButton).toBeDisabled();
      await expect(shirtButton).toBeDisabled();
    });

    test('should not trigger any download if the button is disabled (no-op test)', async ({
      page,
    }) => {
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      let downloadTriggered = false;

      page.on('download', () => {
        downloadTriggered = true;
      });

      // Attempt to click disabled button
      await expect(logoButton).toBeDisabled();
      await logoButton.click({ force: true });

      // Assert no download happened
      expect(downloadTriggered).toBe(false);
    });

    test('should trim whitespace from the filename before triggering download', async ({
      page,
    }) => {
      await uploadAndSetup(page, {
        filter: 'Logo',
        filename: '   trimmed-name   ',
      });
      const download = await triggerAndWaitForDownload(page, 'Download Logo');
      const suggestedFilename = download.suggestedFilename();
      expect(suggestedFilename.startsWith('trimmed-name')).toBeTruthy();
    });
  });
});
