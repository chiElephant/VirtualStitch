import { Page, expect } from '@playwright/test';

// Valid 1x1 transparent PNG in base64 format for testing
export const VALID_TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Test file paths
export const TEST_FILES = {
  emblem: './fixtures/emblem.png',
  emblem2: './fixtures/emblem2.png',
  invalidFile: './fixtures/sample.txt',
} as const;

// Common colors used in tests
export const TEST_COLORS = {
  defaultGreen: '#007938',
  lightBlue: '#2CCCE4',
  green: '#80C670',
  purple: '#726DE8',
  dark: '#353934',
  red: '#FF6B6B',
  yellow: '#EFBD4E',
  cyan: '#C9FFE5',
  lightGray: '#CCCCCC',
} as const;

/**
 * Navigation helpers
 */
export class NavigationHelpers {
  constructor(private page: Page) {}

  async goToCustomizer() {
    await this.page.goto('/');
    await this.page.getByRole('button', { name: 'Customize It' }).click();
    await this.page.waitForSelector('[data-testid="editor-tabs-container"]', {
      state: 'visible',
    });
  }

  async goToHome() {
    await this.page.getByRole('button', { name: 'Go Back' }).click();
    await expect(
      this.page.getByRole('heading', { name: "LET'S DO IT." })
    ).toBeVisible();
  }

  async openEditorTab(tabName: string) {
    await this.page.getByTestId(`editor-tab-${tabName}`).click();
    await expect(this.page.getByTestId(tabName)).toBeVisible();
  }

  async toggleFilterTab(tabName: string) {
    return this.page.getByTestId(`filter-tab-${tabName}`).click();
  }
}

/**
 * Color picker helpers
 */
export class ColorHelpers {
  constructor(private page: Page) {}

  async selectColor(color: string) {
    await this.page.getByTitle(color).click();
  }

  async verifyColorApplied(color: string) {
    await expect(this.page.getByTestId(`canvas-color-${color}`)).toHaveCount(1);
    await expect(this.page.getByTestId(`button-color-${color}`)).toHaveCount(1);
  }

  async openColorPicker() {
    await this.page.getByTestId('editor-tab-colorPicker').click();
    await expect(this.page.getByTestId('color-picker')).toBeVisible();
  }
}

/**
 * File upload helpers
 */
export class FileHelpers {
  constructor(private page: Page) {}

  async uploadFile(filePath: string, applyAs: 'logo' | 'full' = 'logo') {
    await this.page.getByTestId('editor-tab-filePicker').click();
    await this.page.waitForSelector('[data-testid="file-picker-input"]', {
      state: 'visible',
    });
    
    await this.page.getByTestId('file-picker-input').setInputFiles(filePath);
    await this.page
      .getByRole('button', { name: applyAs === 'logo' ? 'Logo' : 'Full' })
      .click();

    // Wait for application
    await this.page.waitForTimeout(500);
    
    // Ensure the appropriate filter is activated
    const filterTab = applyAs === 'logo' ? 'logoShirt' : 'stylishShirt';
    const textureTestId = applyAs === 'logo' ? 'logo-texture' : 'full-texture';
    
    const textureCount = await this.page.getByTestId(textureTestId).count();
    if (textureCount === 0) {
      await this.page.getByTestId(`filter-tab-${filterTab}`).click();
      await this.page.waitForTimeout(300);
    }
  }

  async verifyTextureApplied(type: 'logo' | 'full') {
    const textureTestId = type === 'logo' ? 'logo-texture' : 'full-texture';
    await expect(this.page.getByTestId(textureTestId)).toHaveCount(1);
  }

  async uploadWithBuffer(filename: string, mimeType: string, buffer: Buffer, applyAs: 'logo' | 'full' = 'logo') {
    await this.page.getByTestId('editor-tab-filePicker').click();
    await this.page.waitForSelector('[data-testid="file-picker-input"]', {
      state: 'visible',
    });

    await this.page.getByTestId('file-picker-input').setInputFiles({
      name: filename,
      mimeType,
      buffer,
    });

    await this.page
      .getByRole('button', { name: applyAs === 'logo' ? 'Logo' : 'Full' })
      .click();
  }
}

/**
 * AI picker helpers
 */
export class AIHelpers {
  constructor(private page: Page) {}

  async mockSuccessfulResponse() {
    await this.page.route('/api/custom-logo', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
      });
    });
  }

  async mockErrorResponse(status: number) {
    await this.page.route('/api/custom-logo', (route) => {
      route.fulfill({ status });
    });
  }

  async generateImage(prompt: string, type: 'logo' | 'full' = 'logo') {
    await this.page.getByTestId('editor-tab-aiPicker').click();
    await this.page.getByTestId('ai-prompt-input').fill(prompt);
    
    const buttonName = type === 'logo' ? 'ai-logo-button' : 'ai-full-button';
    await this.page.getByTestId(buttonName).click();
  }

  async verifySuccessToast() {
    await expect(
      this.page.getByText(/image applied successfully/i)
    ).toBeVisible();
  }

  async verifyErrorToast(errorType: 'rate-limit' | 'server' | 'unexpected') {
    const errorMessages = {
      'rate-limit': /making requests too quickly/i,
      'server': /server error while generating/i,
      'unexpected': /unexpected error occurred/i,
    };
    
    await expect(this.page.getByText(errorMessages[errorType])).toBeVisible();
  }
}

/**
 * Download helpers
 */
export class DownloadHelpers {
  constructor(private page: Page) {}

  async downloadImage(filename: string, downloadType: string) {
    // Open download tab if not already open
    const imageDownloadTab = this.page.getByTestId('image-download');
    const isTabOpen = await imageDownloadTab.isVisible();
    
    if (!isTabOpen) {
      await this.page.getByTestId('editor-tab-imageDownload').click();
      await this.page.waitForTimeout(500);
    }

    // Fill filename
    const placeholderInput = this.page.getByPlaceholder('e.g., my-shirt');
    const placeholderCount = await placeholderInput.count();

    if (placeholderCount > 0) {
      await placeholderInput.fill(filename);
    } else {
      await this.page.locator('#image-download').fill(filename);
    }

    // Trigger download
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: downloadType }).click(),
    ]);

    return download;
  }

  async verifyDownloadEnabled(buttonName: string) {
    await expect(this.page.getByRole('button', { name: buttonName })).toBeEnabled();
  }

  async verifyDownloadDisabled(buttonName: string) {
    await expect(this.page.getByRole('button', { name: buttonName })).toBeDisabled();
  }
}

/**
 * Texture and filter helpers
 */
export class TextureHelpers {
  constructor(private page: Page) {}

  async activateFilter(filterType: 'logoShirt' | 'stylishShirt') {
    await this.page.getByTestId(`filter-tab-${filterType}`).click();
  }

  async verifyFilterActive(filterType: 'logoShirt' | 'stylishShirt') {
    await expect(this.page.getByTestId(`filter-tab-${filterType}`)).toHaveAttribute(
      'data-is-active',
      'true'
    );
  }

  async verifyTextureVisible(textureType: 'logo' | 'full') {
    const testId = textureType === 'logo' ? 'logo-texture' : 'full-texture';
    await expect(this.page.getByTestId(testId)).toHaveCount(1);
  }

  async verifyTextureHidden(textureType: 'logo' | 'full') {
    const testId = textureType === 'logo' ? 'logo-texture' : 'full-texture';
    await expect(this.page.getByTestId(testId)).toHaveCount(0);
  }
}

/**
 * Wait utilities
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  async waitForAnimations() {
    await this.page.waitForTimeout(1500);
  }

  async waitForTextureApplication() {
    await this.page.waitForTimeout(500);
  }

  async waitForToastToDisappear(toastText: string | RegExp) {
    await expect(this.page.getByText(toastText)).not.toBeVisible({ 
      timeout: 10000 
    });
  }
}

/**
 * Combined test utilities class
 */
export class TestUtils {
  public nav: NavigationHelpers;
  public color: ColorHelpers;
  public file: FileHelpers;
  public ai: AIHelpers;
  public download: DownloadHelpers;
  public texture: TextureHelpers;
  public wait: WaitHelpers;

  constructor(page: Page) {
    this.nav = new NavigationHelpers(page);
    this.color = new ColorHelpers(page);
    this.file = new FileHelpers(page);
    this.ai = new AIHelpers(page);
    this.download = new DownloadHelpers(page);
    this.texture = new TextureHelpers(page);
    this.wait = new WaitHelpers(page);
  }
}

/**
 * Viewport configurations for responsive testing
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  smallDesktop: { width: 1024, height: 768 },
  largeMobile: { width: 414, height: 896 },
  ultraWide: { width: 2560, height: 1440 },
  tiny: { width: 320, height: 568 },
} as const;

/**
 * Common test data for malicious inputs
 */
export const MALICIOUS_INPUTS = {
  xss: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '"><img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
    '${alert("xss")}',
    '{{alert("xss")}}',
  ],
  filenames: [
    '<script>alert("xss")</script>',
    'file"name.png',
    "file'name.png",
    'file<name>.png',
    '../../../etc/passwd',
    'con.png',
    'aux.png',
  ],
  longInput: 'A'.repeat(10000),
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 5000,
  interaction: 5000,
  apiResponse: 5000,
  lcp: 4000,
  cls: 0.25,
  fcp: 2000,
  memoryUsage: 150 * 1024 * 1024, // 150MB for 3D apps
} as const;
