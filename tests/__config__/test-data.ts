/**
 * Centralized Test Data
 * All test constants, mock data, and fixtures in one place
 */

// Valid 1x1 transparent PNG in base64 format for testing
export const VALID_TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * Test file paths and fixtures
 */
export const TestData = {
  files: {
    validLogo: './tests/fixtures/emblem.png',
    validPattern: './tests/fixtures/emblem2.png',
    invalidFile: './tests/fixtures/sample.txt',
  },
  
  // Add testFiles alias for backward compatibility
  testFiles: {
    emblem: './tests/fixtures/emblem.png',
    emblem2: './tests/fixtures/emblem2.png',
    invalidFile: './tests/fixtures/sample.txt',
    validImageBase64: VALID_TEST_IMAGE_BASE64,
  },
  
  colors: {
    default: '#007938',
    lightBlue: '#2CCCE4',
    green: '#80C670',
    purple: '#726DE8',
    dark: '#353934',
    red: '#FF6B6B',
    yellow: '#EFBD4E',
    cyan: '#C9FFE5',
    lightGray: '#CCCCCC',
    vibrantGreen: '#00FF00',
    defaultGreen: '#007938',
  },
  
  prompts: {
    valid: [
      'Modern tech logo',
      'Abstract pattern design',
      'Geometric shapes',
      'Simple blue star design',
      'Create a beautiful sunset',
    ],
    invalid: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '"><img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '${alert("xss")}',
      '{{alert("xss")}}',
    ],
    edgeCases: [
      { name: 'Empty prompt', value: '', expectsValidation: true },
      { name: 'Whitespace only', value: '   \n\t   ', expectsValidation: true },
      { name: 'Single character', value: 'a', expectsValidation: false },
      { name: 'Very long prompt', value: 'A'.repeat(10000), expectsValidation: true },
      { name: 'Unicode characters', value: 'Create красивый sunset with 美しい colors', expectsValidation: false },
    ],
  },
  
  filenames: {
    valid: [
      'my-shirt',
      'custom-design',
      'test-download',
      'logo-design',
      'pattern-style',
    ],
    invalid: [
      '<script>alert("xss")</script>',
      'file"name.png',
      "file'name.png",
      'file<n>.png',
      '../../../etc/passwd',
      'con.png',
      'aux.png',
    ],
    edgeCases: [
      '   trimmed-name  ',
      'very-long-filename-that-exceeds-normal-length-limits-for-testing-purposes',
      '123456789',
      'unicode-文件名',
    ],
  },
  
  mockResponses: {
    aiSuccess: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ photo: VALID_TEST_IMAGE_BASE64 }),
    },
    aiRateLimit: {
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Too many requests. Please try again later.' }),
    },
    aiServerError: {
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Server error while generating the image ⚠️.' }),
    },
    aiValidationError: {
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Malicious content detected. Please use a safe description.' }),
    },
  },
  
  buttonLabels: {
    editor: {
      colorPicker: 'colorPicker editor tab',
      filePicker: 'filePicker editor tab',
      aiPicker: 'aiPicker editor tab',
      imageDownload: 'imageDownload editor tab',
    },
    filter: {
      logoShirt: 'Small texture filter tab',
      stylishShirt: 'Full texture filter tab',
    },
    actions: {
      customizeIt: 'Customize It',
      goBack: 'Go Back',
      uploadFile: 'Upload File',
      logoButton: 'Logo',
      fullPatternButton: 'Full Pattern',
      aiLogoButton: 'AI Logo',
      aiFullButton: 'AI Full',
      downloadShirt: 'Download Shirt',
      downloadLogo: 'Download Logo',
      downloadPattern: 'Download Pattern',
    },
  },
  
  errorMessages: {
    validation: /please enter a prompt|prompt cannot be empty/i,
    rateLimit: /making requests too quickly|too many requests/i,
    serverError: /server error while generating|something went wrong/i,
    networkError: /failed to fetch|network error/i,
    fileSize: /too large|size|maximum.*exceeded/i,
    fileFormat: /valid image|format|supported formats/i,
    fileCorrupted: /corrupted|failed to process|invalid file/i,
  },
  
  viewport: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    smallDesktop: { width: 1024, height: 768 },
    largeMobile: { width: 414, height: 896 },
    ultraWide: { width: 2560, height: 1440 },
    tiny: { width: 320, height: 568 },
  },
  
  // Add viewports alias for backward compatibility
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    smallDesktop: { width: 1024, height: 768 },
    largeMobile: { width: 414, height: 896 },
    ultraWide: { width: 2560, height: 1440 },
    tiny: { width: 320, height: 568 },
  },

  performance: {
    maxLoadTime: 5000,
    maxInteractionTime: 3000,
    maxTextureOperation: 8000,
    maxFileOperation: 6000,
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
    maxLCP: 4000,
    maxCLS: 0.25,
    maxFCP: 2000,
    apiResponseThreshold: 2000,
    stateUpdateThreshold: 5000,
    highFrequencyThreshold: 10000,
    workflowCompletionThreshold: 15000,
    premiumWorkflowThreshold: 20000,
    pageLoadThreshold: 5000,
    interactionThreshold: 3000,
    textureOperationThreshold: 8000,
    memoryUsageLimit: 150 * 1024 * 1024,
    concurrentOperationThreshold: 5000,
    loadSimulationThreshold: 10000,
    lcp: 4000,
    cls: 0.25,
    fcp: 2000,
    fid: 100,
  },

  delays: {
    minimal: 50,
    brief: 100,
    short: 300,
    medium: 500,
    long: 1000,
    veryLong: 2000,
  },

  // Add security test data
  security: {
    xssPayloads: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '"><img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '${alert("xss")}',
      '{{alert("xss")}}',
    ],
    maliciousFilenames: [
      '<script>alert("xss")</script>',
      'file"name.png',
      "file'name.png",
      'file<n>.png',
      '../../../etc/passwd',
      'con.png',
      'aux.png',
    ],
    longInput: 'A'.repeat(10000),
  },
  
  // Add URLs for security testing
  urls: {
    base: 'http://localhost:3000',
  },

  // Add VALID_TEST_IMAGE_BASE64 to TestData for easier access
  VALID_TEST_IMAGE_BASE64,
} as const;

// Legacy exports for backward compatibility
export const TEST_FILES = TestData.files;
export const TEST_COLORS = TestData.colors;
export const MALICIOUS_INPUTS = {
  xss: TestData.prompts.invalid,
  filenames: TestData.filenames.invalid,
  longInput: TestData.prompts.edgeCases.find(p => p.name === 'Very long prompt')?.value || 'A'.repeat(10000),
};
export const VIEWPORTS = TestData.viewport;
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 5000,
  interaction: 5000,
  textureOperation: 8000,
  apiResponse: 5000,
  lcp: 4000,
  cls: 0.25,
  fcp: 2000,
  memoryUsage: 150 * 1024 * 1024,
};
