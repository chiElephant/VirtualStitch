import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log('🚀 Starting VirtualStitch test suite global setup...');

  // Environment verification
  if (baseURL) {
    console.log(`🔍 Verifying application availability: ${baseURL}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      const response = await page.goto(baseURL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      if (response?.status() === 200) {
        console.log('✅ Application is accessible and responding');
      } else {
        console.warn(`⚠️ Application returned status: ${response?.status()}`);
      }

      // Critical component verification
      try {
        await page.waitForSelector('body', { timeout: 5000 });
        console.log('✅ Page structure loaded successfully');

        // Three.js canvas verification
        const hasCanvas = (await page.locator('canvas').count()) > 0;
        if (hasCanvas) {
          console.log('✅ 3D rendering canvas detected');
        } else {
          console.warn('⚠️ Canvas element not found - 3D functionality may be unavailable');
        }

        // Main navigation verification
        const hasCustomizeButton = (await page.getByRole('button', { name: 'Customize It' }).count()) > 0;
        if (hasCustomizeButton) {
          console.log('✅ Primary navigation elements detected');
        } else {
          console.warn('⚠️ Main customize button not found');
        }

        // Quick functionality test
        try {
          await page.getByRole('button', { name: 'Customize It' }).click();
          await page.waitForSelector('[data-testid="editor-tabs-container"]', { timeout: 5000 });
          console.log('✅ Core navigation functionality verified');
        } catch {
          console.warn('⚠️ Core navigation test failed - proceeding with caution');
        }

      } catch (error) {
        console.warn('⚠️ Component verification failed:', error);
      }
    } catch (error) {
      console.error('❌ Application accessibility check failed:', error);
      throw new Error(`Global setup failed: Unable to access ${baseURL}`);
    } finally {
      await page.close();
      await browser.close();
    }
  }

  // Test environment configuration
  process.env.VIRTUALSTITCH_TEST_SUITE_ACTIVE = 'true';
  process.env.TEST_FRAMEWORK_VERSION = '2.0.0';

  // Test suite architecture overview
  console.log('🏗️  VirtualStitch Test Suite Architecture:');
  console.log('   💨 Smoke Tests: Critical path validation & deployment verification');
  console.log('   🧪 Core Tests: Component functionality & interaction validation');
  console.log('   🔄 Integration Tests: State management & complete user workflows');
  console.log('   🛡️  Quality Tests: Accessibility, performance, security & responsive design');
  console.log('   🌐 API Tests: Health checks, integration & endpoint validation');
  console.log('   🚀 Deployment Tests: Production validation & environment verification');

  // Feature coverage summary
  console.log('🎯 Coverage Areas:');
  console.log('   🎨 Color Picker: Advanced color selection & application');
  console.log('   📁 File Upload: Multi-format texture upload & processing');
  console.log('   🤖 AI Integration: DALL-E API integration & error handling');
  console.log('   💾 State Management: Valtio state synchronization & persistence');
  console.log('   📱 Responsive Design: Cross-device compatibility & touch optimization');
  console.log('   ♿ Accessibility: WCAG compliance & screen reader support');
  console.log('   ⚡ Performance: Core Web Vitals & resource optimization');

  console.log('✅ VirtualStitch test suite global setup completed successfully');
}

export default globalSetup;
