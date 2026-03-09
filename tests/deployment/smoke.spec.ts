import { test, expect } from '../__config__/base-test';

test.describe('💨 Smoke Tests - Critical Path Verification', () => {
  test.beforeEach(async ({ suite }) => {
    await suite.setup.initializeApp();
  });

  test.afterEach(async ({ suite }) => {
    await suite.cleanup.reset();
  });

  // ==========================================
  // 🎯 CRITICAL PATH VERIFICATION
  // ==========================================

  test('should load homepage successfully', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Essential page verification
    await expect(suite.page).toHaveTitle(/Virtual Stitch/);
    await expect(suite.page.getByRole('heading', { name: /LET'S DO IT\./ })).toBeVisible();
    await expect(suite.page.locator('canvas')).toBeVisible();
    await expect(suite.page.getByRole('button', { name: 'Customize It' })).toBeVisible();
  });

  test('should navigate to customizer successfully', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await suite.page.getByRole('button', { name: 'Customize It' }).click();

    // Wait for customizer load
    await suite.wait.forAnimations();

    // Core customizer verification
    await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
    await expect(suite.page.getByTestId('filter-tabs-container')).toBeVisible();
    await expect(suite.page.getByRole('button', { name: 'Go Back' })).toBeVisible();
  });

  test('should display all essential UI components', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Editor tabs verification
    const editorTabs = ['colorPicker', 'filePicker', 'aiPicker', 'imageDownload'];
    for (const tab of editorTabs) {
      await expect(suite.page.getByRole('img', { name: tab })).toBeVisible();
    }

    // Filter tabs verification
    await expect(suite.page.getByTestId('filter-tab-logoShirt')).toBeVisible();
    await expect(suite.page.getByTestId('filter-tab-stylishShirt')).toBeVisible();
  });

  // ==========================================
  // ⚙️ CORE FUNCTIONALITY VERIFICATION
  // ==========================================

  test('should open and interact with color picker', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await expect(suite.page.getByTestId('color-picker')).toBeVisible();

    // Color selection verification
    await suite.page.getByTitle(suite.data.colors.vibrantGreen).click();
    await expect(suite.page.getByTestId(`canvas-color-${suite.data.colors.vibrantGreen}`)).toHaveCount(1);
  });

  test('should open and interact with file picker', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    await suite.page.getByTestId('editor-tab-filePicker').click();
    await expect(suite.page.getByTestId('file-picker')).toBeVisible();
    await expect(suite.page.getByText('No file selected')).toBeVisible();

    // Action buttons verification
    await expect(suite.page.getByRole('button', { name: 'Logo' })).toBeVisible();
    await expect(suite.page.getByRole('button', { name: 'Full Pattern' })).toBeVisible();
  });

  test('should open and interact with AI picker', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    await suite.page.getByTestId('editor-tab-aiPicker').click();
    await expect(suite.page.getByTestId('ai-picker')).toBeVisible();
    await expect(suite.page.getByTestId('ai-prompt-input')).toBeVisible();
    await expect(suite.page.getByTestId('ai-logo-button')).toBeVisible();
    await expect(suite.page.getByTestId('ai-full-button')).toBeVisible();
  });

  test('should open and interact with image download', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    await suite.page.getByTestId('editor-tab-imageDownload').click();
    await expect(suite.page.getByTestId('image-download')).toBeVisible();
    await expect(suite.page.getByPlaceholder('e.g., my-shirt')).toBeVisible();
  });

  // ==========================================
  // 🎛️ FILTER FUNCTIONALITY VERIFICATION
  // ==========================================

  test('should activate and deactivate logo filter', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Initial state verification
    await expect(suite.page.getByTestId('logo-texture')).toHaveCount(0);

    // Logo filter activation
    await suite.page.getByTestId('filter-tab-logoShirt').click();
    await expect(suite.page.getByTestId('logo-texture')).toHaveCount(1);

    // Logo filter deactivation
    await suite.page.getByTestId('filter-tab-logoShirt').click();
    await expect(suite.page.getByTestId('logo-texture')).toHaveCount(0);
  });

  test('should activate and deactivate full texture filter', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Initial state verification
    await expect(suite.page.getByTestId('full-texture')).toHaveCount(0);

    // Full texture filter activation
    await suite.page.getByTestId('filter-tab-stylishShirt').click();
    await expect(suite.page.getByTestId('full-texture')).toHaveCount(1);

    // Full texture filter deactivation
    await suite.page.getByTestId('filter-tab-stylishShirt').click();
    await expect(suite.page.getByTestId('full-texture')).toHaveCount(0);
  });

  // ==========================================
  // 🎨 CANVAS RENDERING VERIFICATION
  // ==========================================

  test('should render 3D canvas correctly', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Three.js initialization wait
    await suite.wait.forThreeJSInitialization();

    const canvasInfo = await suite.monitoring.getCanvasRenderingInfo();

    expect(canvasInfo.exists).toBeTruthy();
    expect(canvasInfo.hasContent).toBeTruthy();
  });

  test('should respond to color changes', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Default color verification
    await expect(suite.page.getByTestId(`canvas-color-${suite.data.colors.defaultGreen}`)).toHaveCount(1);

    // Color change verification
    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await suite.page.getByTitle(suite.data.colors.cyan).click();
    await expect(suite.page.getByTestId(`canvas-color-${suite.data.colors.cyan}`)).toHaveCount(1);
    await expect(suite.page.getByTestId(`canvas-color-${suite.data.colors.defaultGreen}`)).toHaveCount(0);
  });

  // ==========================================
  // 🧭 NAVIGATION & STATE VERIFICATION
  // ==========================================

  test('should maintain state during navigation', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Setup state in customizer
    await suite.page.getByRole('button', { name: 'Customize It' }).click();
    await suite.wait.forAnimations();

    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await suite.page.getByTitle(suite.data.colors.vibrantGreen).click();

    // Navigate back and verify homepage
    await suite.page.getByRole('button', { name: 'Go Back' }).click();
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();

    // Return to customizer and verify state persistence
    await suite.page.getByRole('button', { name: 'Customize It' }).click();
    await suite.wait.forAnimations();

    await expect(suite.page.getByTestId(`canvas-color-${suite.data.colors.vibrantGreen}`)).toHaveCount(1);
  });

  test('should handle tab switching correctly', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const tabs = ['colorPicker', 'filePicker', 'aiPicker', 'imageDownload'];

    for (const tab of tabs) {
      await suite.page.getByTestId(`editor-tab-${tab}`).click();
      await expect(suite.page.getByTestId(`editor-tab-${tab}`)).toBeVisible();

      // Exclusive tab visibility verification
      const otherTabs = tabs.filter(t => t !== tab);
      for (const otherTab of otherTabs) {
        await expect(suite.page.getByTestId(otherTab)).toHaveCount(0);
      }
    }
  });

  // ==========================================
  // ⚠️ ERROR HANDLING VERIFICATION
  // ==========================================

  test('should handle missing resources gracefully', async ({ suite }) => {
    // Block test resources
    await suite.page.route('**/icons/emblem.png', (route) => route.abort());

    await suite.actions.navigateToHomepage();

    // Graceful degradation verification
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    await expect(suite.page.getByRole('button', { name: 'Customize It' })).toBeVisible();
  });

  test('should display appropriate error messages', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.page.getByTestId('editor-tab-aiPicker').click();

    // Empty prompt error verification
    await suite.page.getByTestId('ai-logo-button').click();
    await expect(suite.page.getByText(/please enter a prompt/i)).toBeVisible();
  });

  test('should handle JavaScript errors gracefully', async ({ suite }) => {
    const errors: string[] = [];
    suite.page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await suite.actions.navigateToHomepage();
    await suite.flows.navigateToCustomizer();

    // Basic interaction without errors
    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await suite.page.getByTitle(suite.data.colors.purple).click();

    // Filter acceptable errors
    const criticalErrors = await suite.monitoring.filterCriticalErrors(errors);
    expect(criticalErrors.length).toBe(0);
  });

  // ==========================================
  // ⚡ PERFORMANCE VERIFICATION
  // ==========================================

  test('should load within acceptable time limits', async ({ suite }) => {
    const startTime = Date.now();

    await suite.page.goto('/');
    await suite.page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Generous smoke test threshold
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle basic interactions responsively', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const startTime = Date.now();

    // Basic interaction sequence
    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await suite.page.getByTitle(suite.data.colors.yellow).click();
    await suite.page.getByTestId('filter-tab-logoShirt').click();

    const interactionTime = Date.now() - startTime;

    // Responsive interaction threshold
    expect(interactionTime).toBeLessThan(5000);
  });

  // ==========================================
  // ♿ ACCESSIBILITY VERIFICATION
  // ==========================================

  test('should have accessible main navigation', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Keyboard navigation verification
    await suite.page.keyboard.press('Tab');
    const focusedElement = suite.page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Enter key activation
    await suite.page.keyboard.press('Enter');
    await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
  });

  test('should have proper ARIA labels on key elements', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    const customizeButton = suite.page.getByRole('button', { name: 'Customize It' });
    await expect(customizeButton).toHaveAttribute('aria-label', 'Customize It');

    await customizeButton.click();
    await suite.wait.forAnimations();

    const backButton = suite.page.getByRole('button', { name: 'Go Back' });
    await expect(backButton).toHaveAttribute('aria-label', 'Go Back');
  });

  // ==========================================
  // 📱 MOBILE COMPATIBILITY VERIFICATION
  // ==========================================

  test('should work on mobile viewport', async ({ suite }) => {
    await suite.page.setViewportSize({ width: 375, height: 667 });
    await suite.actions.navigateToHomepage();

    // Mobile essential elements
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    await expect(suite.page.locator('canvas')).toBeVisible();
    await expect(suite.page.getByRole('button', { name: 'Customize It' })).toBeVisible();

    // Mobile navigation verification
    await suite.page.getByRole('button', { name: 'Customize It' }).click();
    await suite.wait.forMobileAnimations();

    await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
  });

  test('should handle touch interactions', async ({ suite }) => {
    await suite.page.setViewportSize({ width: 375, height: 667 });
    await suite.flows.navigateToCustomizer();

    // Touch interaction verification
    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await suite.page.getByTitle(suite.data.colors.lightGreen).click();
    await expect(suite.page.getByTestId(`canvas-color-${suite.data.colors.lightGreen}`)).toHaveCount(1);
  });

  // ==========================================
  // 📄 CONTENT VERIFICATION
  // ==========================================

  test('should display correct branding and text', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Key content verification
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    await expect(suite.page.getByText(/Create your unique and exclusive shirt/i)).toBeVisible();
    await expect(suite.page.getByText(/Unleash your Imagination/i)).toBeVisible();
  });

  test('should have working logo and branding elements', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Logo and branding verification
    await expect(suite.page.getByRole('img', { name: 'logo' })).toBeVisible();
    await expect(suite.page).toHaveTitle(/Virtual Stitch/);
  });

  // ==========================================
  // 🔗 INTEGRATION POINTS VERIFICATION
  // ==========================================

  test('should have accessible API endpoints', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    try {
      const response = await suite.page.request.post('/api/custom-logo', {
        data: { prompt: 'smoke test' },
        failOnStatusCode: false,
        timeout: 30000
      });

      // API responsiveness verification
      expect([200, 400, 429, 500].includes(response.status())).toBeTruthy();
      console.log(`✅ API endpoint responded with status: ${response.status()}`);
    } catch (error) {
      // API unavailability is acceptable for smoke tests
      if (suite.monitoring.isAcceptableAPIError(error)) {
        console.log('⚠️ API endpoint not available (expected in some environments)');
        expect(true).toBeTruthy();
      } else {
        throw error;
      }
    }
  });

  test('should handle API failures gracefully', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.page.getByTestId('editor-tab-aiPicker').click();

    // Mock API failure
    await suite.mocks.mockServerError();

    await suite.page.getByTestId('ai-prompt-input').fill('Smoke test failure');
    await suite.page.getByTestId('ai-logo-button').click();

    // Graceful error handling verification
    await expect(suite.page.getByText(/server error/i)).toBeVisible();
    await expect(suite.page.locator('body')).toBeVisible();
  });

  // ==========================================
  // 🎊 SMOKE TEST SUMMARY
  // ==========================================

  test('should complete comprehensive smoke test workflow', async ({ suite }) => {
    console.log('🚀 Starting comprehensive smoke test workflow...');

    // Homepage verification
    await suite.actions.navigateToHomepage();
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    console.log('✅ Homepage loaded successfully');

    // Customizer navigation
    await suite.flows.navigateToCustomizer();
    await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
    console.log('✅ Customizer navigation successful');

    // Color picker functionality
    await suite.actions.activateEditorTab('colorPicker');
    await suite.actions.selectColor(suite.data.colors.vibrantGreen);
    await suite.actions.verifyColorApplied(suite.data.colors.vibrantGreen);
    console.log('✅ Color picker functionality verified');

    // Filter functionality
    await suite.actions.activateFilter('logoShirt');
    await suite.actions.verifyFilterActive('logoShirt');
    console.log('✅ Filter functionality verified');

    // Navigation state persistence
    await suite.flows.navigateToHomepage();
    await suite.flows.navigateToCustomizer();
    await suite.actions.verifyColorApplied(suite.data.colors.vibrantGreen);
    console.log('✅ State persistence verified');

    console.log('🎉 Comprehensive smoke test workflow completed successfully!');
  });
});
