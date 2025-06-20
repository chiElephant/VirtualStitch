import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  try {
    // Generate test execution summary
    const testResultsDir = './test-results';
    const summaryFile = join(testResultsDir, 'execution-summary.json');

    const summary = {
      timestamp: new Date().toISOString(),
      testStructure: 'enhanced-organized',
      categories: {
        smoke: 'Critical path validation',
        core: 'Component functionality',
        integration: 'User workflows',
        quality: 'Accessibility, performance, security',
        api: 'Health checks and integration',
        deployment: 'Production validation',
      },
      environment: {
        ci: !!process.env.CI,
        baseUrl: config.projects[0].use.baseURL,
        nodeEnv: process.env.NODE_ENV,
        setupComplete: process.env.PLAYWRIGHT_GLOBAL_SETUP_COMPLETE === 'true',
      },
    };

    // Ensure test results directory exists
    try {
      await fs.mkdir(testResultsDir, { recursive: true });
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
      console.log('📊 Test execution summary saved');
    } catch (error) {
      console.warn('⚠️ Could not save execution summary:', error);
    }

    // Clean up temporary files if any
    try {
      const tempFiles = [
        './test-results/temp-setup.json',
        './test-results/.playwright-cache',
      ];

      for (const file of tempFiles) {
        try {
          await fs.unlink(file);
        } catch {
          // File doesn't exist, ignore
        }
      }
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }

    // Log performance insights if available
    try {
      const perfDir = './test-results/playwright/performance';
      const perfFiles = await fs.readdir(perfDir).catch(() => []);

      if (perfFiles.length > 0) {
        console.log(`📈 Performance data: ${perfFiles.length} files generated`);
      }
    } catch {
      // Performance directory doesn't exist, ignore
    }

    // Log accessibility insights if available
    try {
      const a11yDir = './test-results/playwright/accessibility';
      const a11yFiles = await fs.readdir(a11yDir).catch(() => []);

      if (a11yFiles.length > 0) {
        console.log(
          `♿ Accessibility data: ${a11yFiles.length} files generated`
        );
      }
    } catch {
      // Accessibility directory doesn't exist, ignore
    }

    // Final cleanup
    delete process.env.PLAYWRIGHT_GLOBAL_SETUP_COMPLETE;

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown error:', error);
    // Don't throw - teardown errors shouldn't fail the test run
  }
}

export default globalTeardown;
