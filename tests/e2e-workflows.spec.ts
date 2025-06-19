// tests/e2e-workflows.spec.ts
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Valid 1x1 transparent PNG in base64 format for testing
const VALID_TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Helper functions for common workflows
async function completeCustomization(
  page: Page,
  type: 'logo' | 'full' = 'logo'
) {
  // Navigate to customizer
  await page.getByRole('button', { name: 'Customize It' }).click();
  await page.waitForTimeout(1500); // Wait for animations

  // Change color
  await page.getByTestId('editor-tab-colorPicker').click();
  await page.getByTitle('#80C670').click(); // Green color

  // Upload image
  await page.getByTestId('editor-tab-filePicker').click();
  await page
    .getByTestId('file-picker-input')
    .setInputFiles('tests/fixtures/emblem.png');
  await page
    .getByRole('button', { name: type === 'logo' ? 'Logo' : 'Full' })
    .click();

  // Wait for the file to be applied and filter activated
  await page.waitForTimeout(500);

  // Verify the appropriate filter is active
  const filterTab =
    type === 'logo' ? 'filter-tab-logoShirt' : 'filter-tab-stylishShirt';
  const textureTestId = type === 'logo' ? 'logo-texture' : 'full-texture';

  // Check if filter needs to be manually activated (in case auto-activation didn't work)
  const textureCount = await page.getByTestId(textureTestId).count();
  if (textureCount === 0) {
    await page.getByTestId(filterTab).click();
    await page.waitForTimeout(300);
  }

  return type === 'logo' ? 'logoShirt' : 'stylishShirt';
}

async function downloadImage(
  page: Page,
  filename: string,
  downloadType: string
) {
  // Check if the imageDownload tab is already open
  const imageDownloadTab = page.getByTestId('image-download');
  const isTabAlreadyOpen = await imageDownloadTab.isVisible();

  // Only click the tab if it's not already open
  if (!isTabAlreadyOpen) {
    await page.getByTestId('editor-tab-imageDownload').click();
    await page.waitForTimeout(500); // Wait for tab to open
  }

  // Ensure we have an active filter before trying to download
  const logoFilter = page.getByTestId('filter-tab-logoShirt');
  const logoFilterActive = await logoFilter.getAttribute('data-is-active');

  const stylishFilter = page.getByTestId('filter-tab-stylishShirt');
  const stylishFilterActive =
    await stylishFilter.getAttribute('data-is-active');

  // If no filters are active, activate one
  if (logoFilterActive !== 'true' && stylishFilterActive !== 'true') {
    await logoFilter.click();
    await page.waitForTimeout(300);
  }

  // Now the tab should be open, find the input field
  const placeholderInput = page.getByPlaceholder('e.g., my-shirt');
  const placeholderCount = await placeholderInput.count();

  if (placeholderCount > 0) {
    await placeholderInput.fill(filename);
  } else {
    // Fallback to ID selector
    const idInput = page.locator('#image-download');
    const idCount = await idInput.count();

    if (idCount > 0) {
      await idInput.fill(filename);
    } else {
      throw new Error('Could not find filename input field');
    }
  }

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: downloadType }).click(),
  ]);

  // Optional: Close the tab after successful download to reset state
  // Check if tab is still open and close it
  const isStillOpen = await imageDownloadTab.isVisible();
  if (isStillOpen) {
    await page.getByTestId('editor-tab-imageDownload').click();
    await page.waitForTimeout(200);
  }

  return download;
}

test.describe('End-to-End User Workflows', () => {
  test.describe('Complete Logo Customization Workflow', () => {
    test('user can complete full logo customization and download', async ({
      page,
    }) => {
      await page.goto('/');

      // Step 1: Complete customization
      await completeCustomization(page, 'logo');

      // Step 2: Verify changes applied
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);

      // Step 3: Download both canvas and logo
      const canvasDownload = await downloadImage(
        page,
        'my-custom-shirt',
        'Download Shirt'
      );
      expect(canvasDownload.suggestedFilename()).toContain('my-custom-shirt');

      const logoDownload = await downloadImage(
        page,
        'my-logo',
        'Download Logo'
      );
      expect(logoDownload.suggestedFilename()).toContain('my-logo');

      // Step 4: Verify state persistence
      await page.getByTestId('editor-tab-colorPicker').click();
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
    });
  });

  test.describe('Complete Pattern Customization Workflow', () => {
    test('user can complete full pattern customization and download', async ({
      page,
    }) => {
      await page.goto('/');

      // Step 1: Complete customization
      await completeCustomization(page, 'full');

      // Step 2: Verify changes applied
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
      await expect(page.getByTestId('full-texture')).toHaveCount(1);

      // Step 3: Download both canvas and pattern
      const canvasDownload = await downloadImage(
        page,
        'pattern-shirt',
        'Download Shirt'
      );
      expect(canvasDownload.suggestedFilename()).toContain('pattern-shirt');

      const patternDownload = await downloadImage(
        page,
        'my-pattern',
        'Download Pattern'
      );
      expect(patternDownload.suggestedFilename()).toContain('my-pattern');
    });
  });

  test.describe('AI-Powered Workflow', () => {
    test('user can generate AI logo and complete workflow', async ({
      page,
    }) => {
      // Mock successful AI response
      await page.route('/api/custom-logo', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
        });
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // Step 1: Generate AI logo
      await page.getByTestId('editor-tab-aiPicker').click();
      await page
        .getByTestId('ai-prompt-input')
        .fill('Modern tech company logo');
      await page.getByTestId('ai-logo-button').click();

      // Step 2: Verify AI logo applied
      await expect(page.getByText(/image applied successfully/i)).toBeVisible();
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);

      // Step 3: Customize color
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#353934').click(); // Dark color

      // Step 4: Download
      const download = await downloadImage(
        page,
        'ai-logo-shirt',
        'Download Shirt'
      );
      expect(download.suggestedFilename()).toContain('ai-logo-shirt');
    });
  });

  test.describe('Multi-Layer Customization', () => {
    test('user can apply both logo and pattern simultaneously', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // Step 1: Upload and apply logo
      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem.png');
      await page.getByRole('button', { name: 'Logo' }).click();

      // Wait and ensure logo filter is activated
      await page.waitForTimeout(500);
      const logoTextureCount = await page.getByTestId('logo-texture').count();
      if (logoTextureCount === 0) {
        await page.getByTestId('filter-tab-logoShirt').click();
        await page.waitForTimeout(300);
      }

      // Verify logo is applied
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);

      // Step 2: Upload and apply pattern (different file)
      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem2.png');
      await page.getByRole('button', { name: 'Full' }).click();

      // Wait and ensure pattern filter is activated
      await page.waitForTimeout(500);
      const fullTextureCount = await page.getByTestId('full-texture').count();
      if (fullTextureCount === 0) {
        await page.getByTestId('filter-tab-stylishShirt').click();
        await page.waitForTimeout(300);
      }

      // IMPORTANT: Re-activate the logo filter since applying "Full" may have deactivated it
      // Check if logo filter is still active, if not, reactivate it
      const logoFilter = page.getByTestId('filter-tab-logoShirt');
      const logoFilterActive = await logoFilter.getAttribute('data-is-active');

      if (logoFilterActive !== 'true') {
        await logoFilter.click();
        await page.waitForTimeout(300);
      }

      // Step 3: Verify both applied
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
      await expect(page.getByTestId('full-texture')).toHaveCount(1);

      // Step 4: Toggle filters to test combinations
      await page.getByTestId('filter-tab-logoShirt').click(); // Disable logo
      await expect(page.getByTestId('logo-texture')).toHaveCount(0);
      await expect(page.getByTestId('full-texture')).toHaveCount(1);

      await page.getByTestId('filter-tab-logoShirt').click(); // Re-enable logo
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
      await expect(page.getByTestId('full-texture')).toHaveCount(1);
    });
  });

  test.describe('Session Persistence', () => {
    test('customizations persist when navigating back and forth', async ({
      page,
    }) => {
      await page.goto('/');

      // Step 1: Make customizations
      await completeCustomization(page, 'logo');

      // Step 2: Go back to home
      await page.getByRole('button', { name: 'Go Back' }).click();
      await expect(
        page.getByRole('heading', { name: "LET'S DO IT." })
      ).toBeVisible();

      // Step 3: Return to customizer
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // Step 4: Verify customizations still applied
      await expect(page.getByTestId('canvas-color-#80C670')).toHaveCount(1);
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });
  });

  test.describe('Error Recovery Workflows', () => {
    test('user can recover from AI generation failure', async ({ page }) => {
      // Mock failed AI response, then successful one
      let callCount = 0;
      await page.route('/api/custom-logo', (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({ status: 500 });
        } else {
          // Use valid base64 image data for successful response
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
          });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(1500);

      // Step 1: First attempt fails
      await page.getByTestId('editor-tab-aiPicker').click();
      await page.getByTestId('ai-prompt-input').fill('Test prompt');
      await page.getByTestId('ai-logo-button').click();
      await expect(page.getByText(/server error/i)).toBeVisible();

      // Step 2: Retry succeeds
      await page.getByTestId('editor-tab-aiPicker').click();
      await page.getByTestId('ai-logo-button').click();
      await expect(page.getByText(/image applied successfully/i)).toBeVisible();

      // Wait and ensure logo filter is activated
      await page.waitForTimeout(500);
      const logoTextureCount = await page.getByTestId('logo-texture').count();
      if (logoTextureCount === 0) {
        await page.getByTestId('filter-tab-logoShirt').click();
        await page.waitForTimeout(300);
      }
      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });
  });

  test.describe('Mobile Workflow Simulation', () => {
    test('complete workflow works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Complete basic workflow on mobile
      await page.getByRole('button', { name: 'Customize It' }).click();
      await page.waitForTimeout(2000); // Mobile animations might be slower

      // Test mobile interactions (use click instead of tap for broader compatibility)
      await page.getByTestId('editor-tab-colorPicker').click();
      await page.getByTitle('#2CCCE4').click();

      await expect(page.getByTestId('canvas-color-#2CCCE4')).toHaveCount(1);

      // Test file upload on mobile
      await page.getByTestId('editor-tab-filePicker').click();
      await page
        .getByTestId('file-picker-input')
        .setInputFiles('tests/fixtures/emblem.png');
      await page.getByRole('button', { name: 'Logo' }).click();

      // Ensure logo filter is activated
      await page.waitForTimeout(500);
      const logoTextureCount = await page.getByTestId('logo-texture').count();
      if (logoTextureCount === 0) {
        await page.getByTestId('filter-tab-logoShirt').click();
        await page.waitForTimeout(300);
      }

      await expect(page.getByTestId('logo-texture')).toHaveCount(1);
    });
  });
});
