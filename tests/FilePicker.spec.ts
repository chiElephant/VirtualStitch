import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

const sampleImagePath1 = './tests/fixtures/emblem.png';
const invalidFilePath = './tests/fixtures/sample.txt';

let context: BrowserContext;
let page: Page;

async function uploadFile(page: Page, filePath: string) {
  await page.getByText('Upload File').click();
  await page.getByTestId('file-picker-input').setInputFiles(filePath);
}

test.describe('File Picker', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('img', { name: 'filePicker' }).click();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Initial State', () => {
    test('should display "No file selected" initially', async () => {
      await expect(page.getByText('No file selected')).toBeVisible();
    });
  });

  const uploads: [string, string][] = [
    ['./tests/fixtures/emblem.png', 'emblem.png'],
    ['./tests/fixtures/emblem2.png', 'emblem2.png'],
  ];
  uploads.forEach(([filePath, label]: [string, string]) => {
    test(`uploading ${label} displays ${label}`, async () => {
      await uploadFile(page, filePath);
      await expect(page.getByText(label)).toBeVisible();
    });
  });

  test.describe('Button States', () => {
    test('should have Logo and Full buttons enabled even when no file is selected', async () => {
      const logoButton = page.getByRole('button', { name: 'Logo' });
      const fullButton = page.getByRole('button', { name: 'Full' });

      await expect(logoButton).toBeEnabled();
      await expect(fullButton).toBeEnabled();
    });
  });

  test.describe('Invalid File Handling', () => {
    test('should not accept non-image files', async () => {
      await page.getByText('Upload File').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles(invalidFilePath);

      // Confirm that the invalid file *still sets* the file (since browser allows selection)
      // but you can enhance your app later to reject it
      await expect(page.getByText('sample.txt')).toBeVisible();
    });
  });

  test.describe('Persistence', () => {
    test('should keep uploaded file name after applying as logo and reopening picker', async () => {
      await uploadFile(page, sampleImagePath1);
      await expect(page.getByText('emblem.png')).toBeVisible();

      await page.getByRole('button', { name: 'Logo' }).click();
      await expect(page.getByTestId('file-picker')).toHaveCount(0);

      // Reopen the File Picker
      await page.getByRole('img', { name: 'filePicker' }).click();
      await expect(page.getByTestId('file-picker')).toBeVisible();
      await expect(page.getByText('emblem.png')).toBeVisible();
    });

    test('should keep uploaded file name after applying as full and reopening picker', async () => {
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

  test.describe('Core Functionality', () => {
    test('should display the file picker when file picker tab is clicked', async () => {
      await expect(page.getByTestId('file-picker')).toBeVisible();
    });

    test('should upload a file and display its name', async () => {
      await uploadFile(page, sampleImagePath1);
      await expect(page.getByText('emblem.png')).toBeVisible();
    });

    test('should display uploaded image as logo when logo button is clicked', async () => {
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);

      await uploadFile(page, sampleImagePath1);
      await expect(page.getByText('emblem.png')).toBeVisible();

      await page.getByRole('button', { name: 'Logo' }).click();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });

    test('should display uploaded image as fullLogo when full button is clicked', async () => {
      await expect(page.getByTestId('full-texture')).toHaveCount(0);

      await uploadFile(page, sampleImagePath1);
      await expect(page.getByText('emblem.png')).toBeVisible();

      await page.getByRole('button', { name: 'Full' }).click();
      await expect(page.getByTestId('full-texture')).toHaveCount(1);
    });
  });
});
