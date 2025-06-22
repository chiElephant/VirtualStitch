/**
 * Centralized Test Configuration
 * All timeouts, thresholds, and test settings in one place
 */

export const TestConfig = {
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    veryLong: 30000,
    animation: 1500,
    textureApplication: 500,
    apiResponse: 120000, // 2 minutes for AI generation
  },
  
  retries: {
    stable: 0,
    flaky: 2,
    network: 3,
  },
  
  delays: {
    brief: 100,
    short: 300,
    medium: 500,
    long: 1000,
    veryLong: 2000,
  },
  
  performance: {
    maxLoadTime: 5000,
    maxInteractionTime: 5000,
    maxTextureOperation: 8000,
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
    maxLCP: 4000,
    maxCLS: 0.25,
    maxFCP: 2000,
  },
  
  selectors: {
    editorTabs: {
      container: '[data-testid="editor-tabs-container"]',
      colorPicker: '[data-testid="editor-tab-colorPicker"]',
      filePicker: '[data-testid="editor-tab-filePicker"]',
      aiPicker: '[data-testid="editor-tab-aiPicker"]',
      imageDownload: '[data-testid="editor-tab-imageDownload"]',
    },
    filterTabs: {
      container: '[data-testid="filter-tabs-container"]',
      logoShirt: '[data-testid="filter-tab-logoShirt"]',
      stylishShirt: '[data-testid="filter-tab-stylishShirt"]',
    },
    components: {
      colorPicker: '[data-testid="color-picker"]',
      filePicker: '[data-testid="file-picker"]',
      aiPicker: '[data-testid="ai-picker"]',
      imageDownload: '[data-testid="image-download"]',
      canvas: 'canvas',
    },
    textures: {
      logo: '[data-testid="logo-texture"]',
      full: '[data-testid="full-texture"]',
    },
    inputs: {
      filePickerInput: '[data-testid="file-picker-input"]',
      aiPromptInput: '[data-testid="ai-prompt-input"]',
      filenameInput: 'input[placeholder="e.g., my-shirt"]',
    },
  },
} as const;

export type EditorTabName = 'colorPicker' | 'filePicker' | 'aiPicker' | 'imageDownload';
export type FilterTabName = 'logoShirt' | 'stylishShirt';
export type TextureType = 'logo' | 'full';
export type DownloadType = 'shirt' | 'logo' | 'pattern';
