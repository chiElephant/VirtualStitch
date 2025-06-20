import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log('🚀 Starting global setup for enhanced test suite...');

  // Verify base URL is accessible
  if (baseURL) {
    console.log(`🔍 Verifying base URL: ${baseURL}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      const response = await page.goto(baseURL, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      if (response?.status() === 200) {
        console.log('✅ Base URL is accessible');
      } else {
        console.warn(`⚠️ Base URL returned status: ${response?.status()}`);
      }

      // Check for essential elements
      try {
        await page.waitForSelector('body', { timeout: 5000 });
        console.log('✅ Page body loaded successfully');

        // Check for canvas (Three.js)
        const hasCanvas = (await page.locator('canvas').count()) > 0;
        if (hasCanvas) {
          console.log('✅ 3D canvas detected');
        } else {
          console.warn(
            '⚠️ No canvas element found - 3D functionality may not be available'
          );
        }

        // Check for main navigation
        const hasCustomizeButton =
          (await page.getByRole('button', { name: 'Customize It' }).count()) >
          0;
        if (hasCustomizeButton) {
          console.log('✅ Main navigation detected');
        } else {
          console.warn('⚠️ Main customize button not found');
        }
      } catch (error) {
        console.warn('⚠️ Essential elements check failed:', error);
      }
    } catch (error) {
      console.error('❌ Failed to access base URL:', error);
      throw new Error(`Global setup failed: Unable to access ${baseURL}`);
    } finally {
      await page.close();
      await browser.close();
    }
  }

  // Set up test environment variables
  process.env.PLAYWRIGHT_GLOBAL_SETUP_COMPLETE = 'true';

  // Log test structure information
  console.log('📁 Test structure:');
  console.log('   🔥 Smoke tests: Critical path validation');
  console.log('   🧪 Core tests: Component functionality');
  console.log('   🔄 Integration tests: User workflows');
  console.log('   🛡️ Quality tests: Accessibility, performance, security');
  console.log('   🌐 API tests: Health checks and integration');
  console.log('   🚀 Deployment tests: Production validation');

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;
