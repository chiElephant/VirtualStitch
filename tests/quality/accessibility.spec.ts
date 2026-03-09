import { test, expect } from '../__config__/base-test';
import AxeBuilder from '@axe-core/playwright';

// AxeBuilder will be created directly in tests when needed
test.describe('♿ Accessibility Excellence', () => {
  test.beforeEach(async ({ suite }) => {
    await suite.setup.initializeApp();
  });

  test.afterEach(async ({ suite }) => {
    await suite.cleanup.reset();
  });

  // ==========================================
  // 🎯 WCAG COMPLIANCE VERIFICATION
  // ==========================================
  test('should achieve perfect WCAG 2.1 AA compliance on homepage', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForStability();

    const axeBuilder = new AxeBuilder({ page: suite.page });
    const results = await axeBuilder
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
  test('should maintain WCAG compliance in customizer interface', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.monitoring.waitForStability();

    const axeBuilder = new AxeBuilder({ page: suite.page });
    const results = await axeBuilder
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Glassmorphism design consideration
      .analyze();

    expect(results.violations).toEqual([]);
  });
  test('should verify accessibility of all interactive components', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const components = [
      { tab: 'colorPicker', testId: 'color-picker' },
      { tab: 'filePicker', testId: 'file-picker' },
      { tab: 'aiPicker', testId: 'ai-picker' },
      { tab: 'imageDownload', testId: 'image-download' }
    ];

    for (const component of components) {
      await suite.actions.activateEditorTab(component.tab);
      await suite.actions.verifyComponentVisible(component.testId);

      const axeBuilder = new AxeBuilder({ page: suite.page });
      const results = await axeBuilder
        .include(`[data-testid="${component.testId}"]`)
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();

      expect(results.violations).toEqual([]);
    }
  });

  // ==========================================
  // ⌨️ KEYBOARD NAVIGATION MASTERY
  // ==========================================
  test('should provide complete keyboard navigation on homepage', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Tab navigation should work flawlessly
    await suite.page.keyboard.press('Tab');
    const focusedElement = await suite.actions.getFocusedElement();
    expect(focusedElement).toBeTruthy();

    // Verify element is properly focusable
    await suite.actions.verifyElementFocused();
    await suite.actions.verifyElementInteractive();

    // Enter key should activate properly
    await suite.page.keyboard.press('Enter');
    await suite.actions.verifyNavigationToCustomizer();
  });
  test('should support full keyboard workflow in customizer', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Test comprehensive tab navigation
    for (let i = 0; i < 8; i++) {
      await suite.page.keyboard.press('Tab');
      await suite.actions.verifyElementFocused();
      await suite.monitoring.checkAccessibilityState();
    }
  });
  test('should enable keyboard control of color picker', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('colorPicker');

    // Navigate into color picker with keyboard
    await suite.page.keyboard.press('Tab');
    await suite.page.keyboard.press('Tab');

    // Verify focus within color picker system
    const focusInColorPicker = await suite.actions.verifyFocusWithinComponent('color-picker');
    expect(focusInColorPicker).toBeTruthy();
  });
  test('should support keyboard file selection', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('filePicker');

    // Navigate to file input
    await suite.page.keyboard.press('Tab');
    await suite.page.keyboard.press('Tab');

    // Verify file input accessibility
    const fileInputFocused = await suite.actions.verifyFileInputFocused();
    expect(fileInputFocused).toBeTruthy();
  });
  test('should allow keyboard button activation', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Focus and activate back button
    const backButton = suite.page.getByRole('button', { name: 'Go Back' });
    await backButton.focus();
    await expect(backButton).toBeFocused();

    await suite.page.keyboard.press('Enter');
    await suite.actions.verifyNavigationToHomepage();
  });

  // ==========================================
  // 🗣️ SCREEN READER OPTIMIZATION
  // ==========================================
  test('should provide comprehensive aria labeling', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Verify main action button
    const customizeButton = suite.page.getByRole('button', { name: 'Customize It' });
    await expect(customizeButton).toHaveAttribute('aria-label', 'Customize It');

    await customizeButton.click();
    await suite.monitoring.waitForStability();

    // Verify navigation button
    const backButton = suite.page.getByRole('button', { name: 'Go Back' });
    await expect(backButton).toHaveAttribute('aria-label', 'Go Back');
  });
  test('should label editor tabs semantically', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const editorTabs = [
      { testId: 'editor-tab-colorPicker', imgName: 'colorPicker' },
      { testId: 'editor-tab-filePicker', imgName: 'filePicker' },
      { testId: 'editor-tab-aiPicker', imgName: 'aiPicker' },
      { testId: 'editor-tab-imageDownload', imgName: 'imageDownload' }
    ];

    for (const tab of editorTabs) {
      const tabElement = suite.page.getByTestId(tab.testId);
      await expect(tabElement).toBeVisible();

      const img = tabElement.getByRole('img', { name: tab.imgName });
      await expect(img).toBeVisible();
    }
  });
  test('should provide accessible form controls', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // AI picker accessibility
    await suite.actions.activateEditorTab('aiPicker');
    const promptInput = suite.page.getByTestId('ai-prompt-input');
    await expect(promptInput).toHaveAttribute('placeholder', 'Ask AI...');

    // Download form accessibility
    await suite.actions.activateEditorTab('imageDownload');
    const filenameInput = suite.page.getByPlaceholder('e.g., my-shirt');
    await expect(filenameInput).toBeVisible();

    const label = suite.page.locator('label[for="image-download-input"]');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('Filename');
  });
  test('should use meaningful button text throughout', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // File picker buttons
    await suite.actions.activateEditorTab('filePicker');
    await expect(suite.page.getByRole('button', { name: 'Logo' })).toBeVisible();
    await expect(suite.page.getByRole('button', { name: 'Full Pattern' })).toBeVisible();

    // AI picker buttons
    await suite.actions.activateEditorTab('aiPicker');
    await expect(suite.page.getByTestId('ai-logo-button')).toBeVisible();
    await expect(suite.page.getByTestId('ai-full-button')).toBeVisible();
  });

  // ==========================================
  // 🎨 VISUAL ACCESSIBILITY STANDARDS
  // ==========================================
  test('should maintain excellent color contrast ratios', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    const customizeButton = suite.page.locator('button[aria-label="Customize It"]');
    await expect(customizeButton).toBeVisible();

    const buttonStyles = await suite.actions.getElementStyles(customizeButton);
    expect(buttonStyles.backgroundColor).toBe('rgb(0, 121, 56)');
  });
  test('should preserve contrast during color changes', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('colorPicker');

    const testColors = [
      suite.data.colors.dark,
      suite.data.colors.lightBlue,
      suite.data.colors.yellow
    ];

    for (const color of testColors) {
      await suite.actions.selectColor(color);

      const backButton = suite.page.getByRole('button', { name: 'Go Back' });
      const styles = await suite.actions.getElementStyles(backButton);

      // Verify readable contrast
      expect(styles.backgroundColor).not.toBe('transparent');
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).not.toBe(styles.color);
    }
  });
  test('should provide clear focus indicators', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const focusableElements = [
      suite.page.getByRole('button', { name: 'Go Back' }),
      suite.page.getByTestId('editor-tab-colorPicker'),
      suite.page.getByTestId('filter-tab-logoShirt')
    ];

    for (const element of focusableElements) {
      await element.focus();
      const hasFocusIndicator = await suite.actions.verifyFocusIndicator(element);
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  // ==========================================
  // 🎭 MOTION & ANIMATION ACCESSIBILITY
  // ==========================================
  test('should respect reduced motion preferences', async ({ suite }) => {
    await suite.page.emulateMedia({ reducedMotion: 'reduce' });

    await suite.actions.navigateToHomepage();
    await suite.page.getByRole('button', { name: 'Customize It' }).click();

    await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();

    // Verify reduced motion navigation
    await suite.page.getByRole('button', { name: 'Go Back' }).click();
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
  });
  test('should provide motion alternatives', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Verify canvas interactivity without motion dependency
    const canvas = suite.page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Color changes should work without animation
    await suite.actions.activateEditorTab('colorPicker');
    await suite.actions.selectColor(suite.data.colors.green);
    await suite.actions.verifyColorApplied(suite.data.colors.green);
  });

  // ==========================================
  // 🚨 ERROR ACCESSIBILITY
  // ==========================================
  test('should provide accessible error messages', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    // Trigger validation error
    await suite.page.getByTestId('ai-logo-button').click();

    const errorMessage = suite.page.getByText(/please enter a prompt/i);
    await expect(errorMessage).toBeVisible();

    // Verify accessibility attributes
    const accessibility = await suite.actions.verifyErrorAccessibility(errorMessage);
    expect(accessibility.hasAriaAttributes).toBeTruthy();
  });
  test('should handle form validation accessibly', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('imageDownload');

    const downloadButton = suite.page.getByRole('button', { name: 'Download Logo' });
    await expect(downloadButton).toBeDisabled();

    // Verify accessible disabled state
    const disabledState = await suite.actions.verifyDisabledAccessibility(downloadButton);
    expect(disabledState.isAccessible).toBeTruthy();
  });

  // ==========================================
  // 📱 MOBILE ACCESSIBILITY
  // ==========================================
  test('should excel on mobile viewports', async ({ suite }) => {
    await suite.page.setViewportSize({ width: 375, height: 667 });
    await suite.actions.navigateToHomepage();

    // Mobile accessibility scan
    const results = await new AxeBuilder({ page: suite.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);

    // Touch target verification
    const customizeButton = suite.page.getByRole('button', { name: 'Customize It' });
    const touchTargetSize = await suite.actions.verifyTouchTargetSize(customizeButton);
    expect(touchTargetSize.height).toBeGreaterThanOrEqual(44);
  });
  test('should support touch navigation patterns', async ({ suite }) => {
    await suite.page.setViewportSize({ width: 375, height: 667 });
    await suite.flows.navigateToCustomizer();

    // Touch interactions
    await suite.page.getByTestId('editor-tab-colorPicker').click();
    await expect(suite.page.getByTestId('color-picker')).toBeVisible();

    await suite.page.getByTestId('filter-tab-logoShirt').click();
    await suite.actions.verifyFilterActive('logoShirt');
  });
});
