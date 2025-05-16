import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
// Helper for uploading, applying filter, and filling filename
async function uploadAndSetup(
  page: Page,
  { filter, filename }: { filter: 'Logo' | 'Full'; filename: string }
) {
  await page.getByRole('img', { name: 'filePicker' }).click();
  // await page.getByText('Upload File').click();
  await page
    .getByTestId('file-picker-input')
    .setInputFiles('tests/fixtures/emblem.png');
  await page.getByRole('button', { name: filter }).click();
  await page.getByRole('img', { name: 'imageDownload' }).click();
  await page.getByLabel(/filename/i).fill(filename);
}

// Helper for triggering a download and waiting for it
async function triggerAndWaitForDownload(page: Page, buttonName: string) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: buttonName }).click(),
  ]);
  return download;
}

test.describe('ImageDownload Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'imageDownload' }).click();
  });

  test.describe('Rendering', () => {
    test('should display the image download container', async ({ page }) => {
      await expect(page.getByTestId('image-download')).toBeVisible();
    });
  });

  test.describe('Disabled State', () => {
    [
      { label: 'No Filename', input: '' },
      { label: 'Filled Filename', input: 'my-image' },
      { label: 'Whitespace Filename', input: '   ' },
    ].forEach(({ label, input }) => {
      test(`No Active Filter, ${label}`, async ({ page }) => {
        if (input !== '') {
          await page.getByLabel(/filename/i).fill(input);
        }
        const logoButton = page.getByRole('button', { name: 'Download Logo' });
        const shirtButton = page.getByRole('button', {
          name: 'Download Shirt',
        });
        await expect(logoButton).toBeDisabled();
        await expect(shirtButton).toBeDisabled();
      });
    });

    [
      { label: 'No Filename', input: '' },
      { label: 'Whitespace Filename', input: '   ' },
    ].forEach(({ label, input }) => {
      test(`Logo Filter, ${label}`, async ({ page }) => {
        await page.getByTestId('filter-tab-logoShirt').click();
        if (input !== '') {
          await page.getByLabel(/filename/i).fill(input);
        }
        const logoButton = page.getByRole('button', { name: 'Download Logo' });
        const shirtButton = page.getByRole('button', {
          name: 'Download Shirt',
        });
        await expect(logoButton).toBeDisabled();
        await expect(shirtButton).toBeDisabled();
      });
    });

    [
      { label: 'No Filename', input: '' },
      { label: 'Whitespace Filename', input: '   ' },
    ].forEach(({ label, input }) => {
      test(`Full Filter, ${label}`, async ({ page }) => {
        await page.getByTestId('filter-tab-stylishShirt').click();
        if (input !== '') {
          await page.getByLabel(/filename/i).fill(input);
        }
        const patternButton = page.getByRole('button', {
          name: 'Download Pattern',
        });
        const shirtButton = page.getByRole('button', {
          name: 'Download Shirt',
        });
        await expect(patternButton).toBeDisabled();
        await expect(shirtButton).toBeDisabled();
      });
    });
  });

  test.describe('Enabled State', () => {
    test('Logo filter is active, filename is filled, and logo is uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Logo', filename: 'logo-image' });
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', { name: 'Download Shirt' });
      await expect(logoButton).toBeEnabled();
      await expect(shirtButton).toBeEnabled();
    });

    test('Stylish filter is active, filename is filled, and fullLogo is uploaded', async ({
      page,
    }) => {
      await uploadAndSetup(page, { filter: 'Full', filename: 'logo-image' });
      const patternButton = page.getByRole('button', {
        name: 'Download Pattern',
      });
      const shirtButton = page.getByRole('button', { name: 'Download Shirt' });
      await expect(patternButton).toBeEnabled();
      await expect(shirtButton).toBeEnabled();
    });
  });

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

  test.describe('Label & Button Text', () => {
    test('should display "Download Logo" when the logo filter is active', async ({
      page,
    }) => {
      await page.getByTestId('filter-tab-logoShirt').click();
      const button = page.getByRole('button', { name: 'Download Logo' });
      await expect(button).toBeVisible();
    });

    test('should display "Download Pattern" when the stylish filter is active', async ({
      page,
    }) => {
      await page.getByTestId('filter-tab-stylishShirt').click();
      const button = page.getByRole('button', { name: 'Download Pattern' });
      await expect(button).toBeVisible();
    });

    test('should keep the download button text unchanged when no filter is active', async ({
      page,
    }) => {
      const logoButton = page.getByRole('button', { name: 'Download Logo' });
      const shirtButton = page.getByRole('button', {
        name: 'Download Shirt',
      });
      await expect(logoButton).toBeVisible();
      await expect(shirtButton).toBeVisible();
    });
  });

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
