/**
 * 🎯 ENHANCED CENTRALIZED TEST CONFIGURATION
 * All timeouts, thresholds, and test settings optimized for reliability and speed
 */

export const TestConfig = {
  timeouts: {
    instant: 500,
    short: 2000,
    medium: 5000,
    long: 10000,
    veryLong: 30000,
    animation: 1000,          // Reduced from 1500 for faster tests
    textureApplication: 800,   // Increased from 500 for stability
    apiResponse: 120000,       // 2 minutes for AI generation
    fileValidation: 3000,      // Specific timeout for file validation
    routeMockRegistration: 100, // Brief wait for route mock setup
  },
  
  retries: {
    stable: 0,
    flaky: 2,
    network: 3,
    fileOperations: 1,  // File operations may need retry
    aiOperations: 1,    // AI operations may need retry
  },
  
  delays: {
    minimal: 50,
    brief: 100,
    short: 300,
    medium: 500,
    long: 1000,
    veryLong: 2000,
  },
  
  performance: {
    maxLoadTime: 5000,
    maxInteractionTime: 3000,     // Reduced for better feedback
    maxTextureOperation: 8000,
    maxFileOperation: 6000,       // Specific threshold for file ops
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
