import { test, expect } from '../__config__/base-test';

test.describe('📱 Responsive Design Excellence', () => {
  test.beforeEach(async ({ suite }) => {
    await suite.setup();
  });
  
  test.afterEach(async ({ suite }) => {
    await suite.cleanup.reset();
  });

  // ==========================================
  // 🖥️ DEVICE-SPECIFIC LAYOUT PERFECTION
  // ==========================================
  test.describe('Cross-Device Layout Validation', () => {
    Object.entries(suite.data.viewports).forEach(([deviceName, viewport]) => {
      test(`should deliver flawless experience on ${deviceName} (${viewport.width}x${viewport.height})`, async ({ suite }) => {
        await suite.page.setViewportSize(viewport);
        
        await suite.actions.navigateToHomepage();

        // Essential elements visibility
        await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
        await expect(suite.page.locator('canvas')).toBeVisible();
        await expect(suite.page.getByRole('button', { name: 'Customize It' })).toBeVisible();

        // Verify responsive navigation
        await suite.page.getByRole('button', { name: 'Customize It' }).click();
        
        const waitTime = deviceName.includes('mobile') ? 2500 : 1500;
        await suite.wait.custom(waitTime);

        await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(suite.page.getByTestId('filter-tabs-container')).toBeVisible();
        await expect(suite.page.getByRole('button', { name: 'Go Back' })).toBeVisible();

        // Test device-optimized interactions
        await suite.actions.activateEditorTab('colorPicker');
        await suite.actions.selectColor(suite.data.colors.green);
        await suite.actions.verifyColorApplied(suite.data.colors.green);

        // File upload responsiveness
        await suite.actions.activateEditorTab('filePicker');
        await suite.actions.uploadTestFile(suite.data.testFiles.emblem, 'logo');
        await expect(suite.page.getByText('emblem.png')).toBeVisible();
      });
    });
  });

  // ==========================================
  // 👆 TOUCH & MOBILE INTERACTION MASTERY
  // ==========================================
  test.describe('Touch-Optimized Interactions', () => {
    const mobileDevices = ['mobile', 'tablet', 'largeMobile'];

    mobileDevices.forEach((deviceKey) => {
      test(`should provide exceptional touch experience on ${deviceKey}`, async ({ suite }) => {
        const viewport = suite.data.viewports[deviceKey as keyof typeof suite.data.viewports];
        await suite.page.setViewportSize(viewport);

        await suite.actions.navigateToHomepage();
        await suite.flows.navigateToCustomizer();

        // Touch-optimized color picker
        await suite.page.getByTestId('editor-tab-colorPicker').click();
        await suite.page.getByTitle(suite.data.colors.lightBlue).click();
        await suite.actions.verifyColorApplied(suite.data.colors.lightBlue);

        // Touch-friendly filter interactions
        await suite.page.getByTestId('filter-tab-logoShirt').click();
        await suite.actions.verifyFilterActive('logoShirt');
      });
    });
    
    test('should meet touch target accessibility standards', async ({ suite }) => {
      await suite.page.setViewportSize(suite.data.viewports.mobile);
      await suite.flows.navigateToCustomizer();

      const interactiveElements = [
        suite.page.getByRole('button', { name: 'Go Back' }),
        suite.page.getByTestId('editor-tab-colorPicker'),
        suite.page.getByTestId('filter-tab-logoShirt')
      ];

      for (const element of interactiveElements) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          // WCAG AAA recommendation: 44px minimum
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  // ==========================================
  // 🔄 ORIENTATION CHANGE HANDLING
  // ==========================================
  test.describe('Seamless Orientation Transitions', () => {
    const mobileViewports = [
      {
        name: 'iPhone',
        portrait: suite.data.viewports.mobile,
        landscape: { width: 667, height: 375 }
      },
      {
        name: 'iPad',
        portrait: suite.data.viewports.tablet,
        landscape: { width: 1024, height: 768 }
      }
    ];

    mobileViewports.forEach(({ name, portrait, landscape }) => {
      test(`should gracefully handle orientation changes on ${name}`, async ({ suite }) => {
        // Start in portrait mode
        await suite.page.setViewportSize(portrait);
        await suite.actions.navigateToHomepage();
        await expect(suite.page.locator('canvas')).toBeVisible();

        // Setup customization in portrait
        await suite.flows.navigateToCustomizer();
        await suite.actions.activateEditorTab('colorPicker');
        await suite.actions.selectColor(suite.data.colors.purple);

        // Switch to landscape orientation
        await suite.page.setViewportSize(landscape);
        await suite.wait.forOrientationChange();

        // Verify state persistence and continued functionality
        await expect(suite.page.locator('canvas')).toBeVisible();
        await suite.actions.verifyColorApplied(suite.data.colors.purple);

        // Test continued functionality in landscape
        await suite.actions.selectColor(suite.data.colors.dark);
        await suite.actions.verifyColorApplied(suite.data.colors.dark);
      });
    });
  });

  // ==========================================
  // 🎯 VIEWPORT EDGE CASES
  // ==========================================
  test.describe('Extreme Viewport Resilience', () => {
    test('should excel on extremely small viewports', async ({ suite }) => {
      await suite.page.setViewportSize(suite.data.viewports.tiny);
      await suite.actions.navigateToHomepage();

      // Core functionality must work despite constraints
      await expect(suite.page.getByRole('button', { name: 'Customize It' })).toBeVisible();

      await suite.flows.navigateToCustomizer();
      await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();

      // Interaction capability verification
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.green);
      await suite.actions.verifyColorApplied(suite.data.colors.green);
    });
    
    test('should scale beautifully on ultra-wide displays', async ({ suite }) => {
      await suite.page.setViewportSize(suite.data.viewports.ultraWide);
      await suite.actions.navigateToHomepage();

      // Layout should scale appropriately for large screens
      await expect(suite.page.locator('canvas')).toBeVisible();
      await expect(suite.page.getByRole('button', { name: 'Customize It' })).toBeVisible();

      await suite.flows.navigateToCustomizer();
      await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();

      // Ultra-wide functionality verification
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.lightBlue);
      await suite.actions.verifyColorApplied(suite.data.colors.lightBlue);
    });
    
    test('should handle dynamic viewport transitions flawlessly', async ({ suite }) => {
      await suite.actions.navigateToHomepage();
      await suite.flows.navigateToCustomizer();

      const viewportSequence = [
        suite.data.viewports.desktop,
        suite.data.viewports.tablet,
        suite.data.viewports.mobile,
        suite.data.viewports.ultraWide,
        suite.data.viewports.tiny
      ];

      for (const viewport of viewportSequence) {
        await suite.page.setViewportSize(viewport);
        await suite.wait.forLayoutStabilization();

        // Core elements must remain functional
        await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(suite.page.locator('canvas')).toBeVisible();
      }

      // Final functionality test after all transitions
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.yellow);
      await suite.actions.verifyColorApplied(suite.data.colors.yellow);
    });
  });

  // ==========================================
  // 🎨 RESPONSIVE CONTENT ADAPTATION
  // ==========================================
  test.describe('Intelligent Content Adaptation', () => {
    test('should optimize editor tabs layout across screen sizes', async ({ suite }) => {
      // Desktop layout baseline
      await suite.page.setViewportSize(suite.data.viewports.desktop);
      await suite.flows.navigateToCustomizer();

      const desktopTabsContainer = suite.page.getByTestId('editor-tabs-container');
      const desktopBox = await desktopTabsContainer.boundingBox();

      // Mobile adaptation verification
      await suite.page.setViewportSize(suite.data.viewports.mobile);
      await suite.wait.forLayoutStabilization();

      const mobileTabsContainer = suite.page.getByTestId('editor-tabs-container');
      const mobileBox = await mobileTabsContainer.boundingBox();

      // Layout should intelligently adapt
      if (desktopBox && mobileBox) {
        const hasAdaptiveLayout = 
          Math.abs(desktopBox.x - mobileBox.x) > 50 || 
          Math.abs(desktopBox.y - mobileBox.y) > 50;
        expect(hasAdaptiveLayout).toBeTruthy();
      }

      // Functionality integrity check
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.red);
      await suite.actions.verifyColorApplied(suite.data.colors.red);
    });
    
    test('should optimize filter tabs for different screen sizes', async ({ suite }) => {
      await suite.flows.navigateToCustomizer();

      // Setup content for filter testing
      await suite.actions.uploadTestFile(suite.data.testFiles.emblem, 'logo');
      await suite.wait.forTextureLoad();

      const screenSizes = [
        suite.data.viewports.desktop,
        suite.data.viewports.tablet,
        suite.data.viewports.mobile
      ];

      for (const viewport of screenSizes) {
        await suite.page.setViewportSize(viewport);
        await suite.wait.forLayoutStabilization();

        // Filter tabs accessibility verification
        await expect(suite.page.getByTestId('filter-tab-logoShirt')).toBeVisible();
        await expect(suite.page.getByTestId('filter-tab-stylishShirt')).toBeVisible();

        // Interactive functionality verification
        await suite.actions.activateFilter('logoShirt');
        await suite.actions.verifyFilterActive('logoShirt');
      }
    });
  });

  // ==========================================
  // 📝 RESPONSIVE TYPOGRAPHY
  // ==========================================
  test.describe('Adaptive Typography Excellence', () => {
    test('should maintain optimal readability across screen sizes', async ({ suite }) => {
      const viewportsToTest = [
        suite.data.viewports.mobile,
        suite.data.viewports.tablet,
        suite.data.viewports.desktop
      ];

      for (const viewport of viewportsToTest) {
        await suite.page.setViewportSize(viewport);
        await suite.actions.navigateToHomepage();

        // Heading readability verification
        const heading = suite.page.getByRole('heading', { name: "LET'S DO IT." });
        await expect(heading).toBeVisible();

        const headingStyles = await suite.actions.getElementStyles(heading);
        
        // Device-appropriate font sizing
        const minFontSize = viewport.width <= 768 ? 16 : 14;
        expect(headingStyles.fontSize).toBeGreaterThanOrEqual(minFontSize);
      }
    });
    
    test('should scale interactive elements appropriately', async ({ suite }) => {
      await suite.page.setViewportSize(suite.data.viewports.mobile);
      await suite.actions.navigateToHomepage();

      const button = suite.page.getByRole('button', { name: 'Customize It' });
      await expect(button).toBeVisible();

      const buttonStyles = await suite.actions.getElementStyles(button);
      
      // Mobile-optimized button sizing
      expect(buttonStyles.fontSize).toBeGreaterThanOrEqual(14);
      expect(buttonStyles.padding).toBeDefined();
    });
  });

  // ==========================================
  // 📱 MOBILE-FIRST WORKFLOW VALIDATION
  // ==========================================
  test.describe('Complete Mobile Experience', () => {
    test('should deliver full workflow excellence on mobile', async ({ suite }) => {
      await suite.page.setViewportSize(suite.data.viewports.mobile);
      await suite.actions.navigateToHomepage();

      // Complete mobile user journey
      await suite.flows.navigateToCustomizer();
      await suite.wait.forMobileAnimations();

      // Color customization on mobile
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.cyan);
      await suite.actions.verifyColorApplied(suite.data.colors.cyan);

      // File upload capability
      await suite.actions.uploadTestFile(suite.data.testFiles.emblem, 'logo');
      await suite.actions.verifyTextureVisible('logo');

      // Download functionality verification
      const download = await suite.actions.downloadImage('mobile-test', 'Download Shirt');
      expect(download.suggestedFilename()).toContain('mobile-test');
    });
    
    test('should excel at mobile gesture interactions', async ({ suite }) => {
      await suite.page.setViewportSize(suite.data.viewports.mobile);
      await suite.flows.navigateToCustomizer();

      // Mobile interaction testing
      await suite.page.getByTestId('editor-tab-colorPicker').click();
      await suite.page.getByTitle(suite.data.colors.green).click();

      // Filter interaction optimization
      await suite.page.getByTestId('filter-tab-logoShirt').click();
      await suite.page.getByTestId('filter-tab-stylishShirt').click();

      // Navigation flow verification
      await suite.page.getByRole('button', { name: 'Go Back' }).click();
      await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
    });
  });

  // ==========================================
  // 🔄 CROSS-DEVICE CONSISTENCY
  // ==========================================
  test.describe('Seamless Cross-Device Experience', () => {
    test('should maintain perfect state consistency across viewport changes', async ({ suite }) => {
      // Start with desktop setup
      await suite.page.setViewportSize(suite.data.viewports.desktop);
      await suite.flows.navigateToCustomizer();

      // Establish state
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.purple);
      await suite.actions.uploadTestFile(suite.data.testFiles.emblem, 'logo');

      // Mobile transition verification
      await suite.page.setViewportSize(suite.data.viewports.mobile);
      await suite.wait.forLayoutStabilization();

      // State persistence verification
      await suite.actions.verifyColorApplied(suite.data.colors.purple);
      await suite.actions.verifyTextureVisible('logo');

      // Tablet transition verification
      await suite.page.setViewportSize(suite.data.viewports.tablet);
      await suite.wait.forLayoutStabilization();

      // Continued state integrity
      await suite.actions.verifyColorApplied(suite.data.colors.purple);
      await suite.actions.verifyTextureVisible('logo');
    });
    
    test('should provide consistent UX across all device categories', async ({ suite }) => {
      const devices = [
        { name: 'Mobile', viewport: suite.data.viewports.mobile },
        { name: 'Tablet', viewport: suite.data.viewports.tablet },
        { name: 'Desktop', viewport: suite.data.viewports.desktop }
      ];

      for (const device of devices) {
        await suite.page.setViewportSize(device.viewport);
        await suite.actions.navigateToHomepage();

        // Core user journey consistency
        await suite.flows.navigateToCustomizer();

        // Essential features accessibility
        await expect(suite.page.getByTestId('editor-tabs-container')).toBeVisible();
        await expect(suite.page.getByTestId('filter-tabs-container')).toBeVisible();

        // Consistent interaction patterns
        await suite.actions.activateEditorTab('colorPicker');
        await suite.actions.selectColor(suite.data.colors.lightBlue);
        await suite.actions.verifyColorApplied(suite.data.colors.lightBlue);
      }
    });
  });
});
