/**
 * 🎯 STANDARDIZED WAITING UTILITIES
 * Consistent timeout patterns and waiting strategies across all tests
 */

import { Page, Locator, expect } from '@playwright/test';
import { TestConfig } from './test-config';

export class StandardWaitUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ⚡ STANDARDIZED: Wait for element to be visible with consistent timeout
   */
  async waitForElement(
    selector: string | Locator,
    options: {
      timeout?: number;
      state?: 'visible' | 'hidden' | 'attached' | 'detached';
    } = {}
  ): Promise<void> {
    const { timeout = TestConfig.timeouts.medium, state = 'visible' } = options;
    
    if (typeof selector === 'string') {
      await this.page.waitForSelector(selector, { state, timeout });
    } else {
      await selector.waitFor({ state, timeout });
    }
  }

  /**
   * ⚡ STANDARDIZED: Wait for customizer to be fully ready
   */
  async waitForCustomizerReady(): Promise<void> {
    // Wait for all essential containers in parallel for better performance
    await Promise.all([
      this.waitForElement(TestConfig.selectors.editorTabs.container),
      this.waitForElement(TestConfig.selectors.filterTabs.container),
      this.waitForElement(TestConfig.selectors.components.canvas),
    ]);

    // Brief wait for animations to complete
    await this.waitStandard(TestConfig.delays.medium);
  }

  /**
   * ⚡ STANDARDIZED: Wait for tab content to be ready
   */
  async waitForTabReady(
    tabName: 'colorPicker' | 'filePicker' | 'aiPicker' | 'imageDownload'
  ): Promise<void> {
    const componentSelector = TestConfig.selectors.components[tabName];
    
    // Standard wait for tab animation
    await this.waitStandard(TestConfig.delays.medium);
    
    // Wait for component visibility (except imageDownload which may have conditions)
    if (tabName !== 'imageDownload') {
      await this.waitForElement(componentSelector, {
        timeout: TestConfig.timeouts.medium,
      });
    } else {
      // For imageDownload, try to wait but don't fail if not available
      try {
        await this.waitForElement(componentSelector, {
          timeout: TestConfig.timeouts.short,
        });
      } catch {
        console.log('ImageDownload tab content not immediately available - this may be expected');
      }
    }
  }

  /**
   * ⚡ STANDARDIZED: Wait for texture operations to complete
   */
  async waitForTextureApplication(): Promise<void> {
    await this.waitStandard(TestConfig.timeouts.textureApplication);
  }

  /**
   * ⚡ ALIAS: Wait for texture operations (backward compatibility)
   */
  async forTextureApplication(): Promise<void> {
    await this.waitForTextureApplication();
  }

  /**
   * ⚡ STANDARDIZED: Wait for WebGL context recovery
   */
  async forWebGLRecovery(): Promise<void> {
    await this.waitStandard(2000); // Wait for WebGL context recovery
  }

  /**
   * ⚡ STANDARDIZED: Wait for state stabilization
   */
  async forStateStabilization(): Promise<void> {
    await this.waitStandard(TestConfig.delays.medium);
  }

  /**
   * ⚡ SHORT WAIT: Brief pause
   */
  async short(): Promise<void> {
    await this.waitStandard(TestConfig.delays.short);
  }

  /**
   * ⚡ MINIMAL WAIT: Very short pause
   */
  async minimal(): Promise<void> {
    await this.waitStandard(TestConfig.delays.minimal);
  }

  /**
   * ⚡ VERY SHORT WAIT: Ultra brief pause
   */
  async veryShort(): Promise<void> {
    await this.waitStandard(TestConfig.delays.brief);
  }

  /**
   * ⚡ STANDARDIZED: Wait for network idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * ⚡ STANDARDIZED: Wait for toast to disappear (alias)
   */
  async waitForToastToDisappear(text: string | RegExp): Promise<void> {
    await this.waitForToastsToDisappear(text);
  }

  /**
   * ⚡ ADDITIONAL WAIT METHODS: Missing wait utilities
   */
  async forMobileAnimations(): Promise<void> {
    await this.waitStandard(500); // Wait for mobile-specific animations
  }

  async forOrientationChange(): Promise<void> {
    await this.waitStandard(1000); // Wait for orientation change animations
  }

  async forThreeJSInitialization(): Promise<void> {
    await this.waitStandard(2000); // Wait for Three.js initialization
  }

  async forColorTransition(): Promise<void> {
    await this.waitStandard(300); // Wait for color transition animations
  }

  async forLayoutStabilization(): Promise<void> {
    await this.waitStandard(500); // Wait for layout stabilization
  }

  async forTextureLoad(): Promise<void> {
    await this.waitStandard(1000); // Wait for texture loading
  }

  async custom(ms: number): Promise<void> {
    await this.waitStandard(ms); // Custom wait time
  }

  /**
   * ⚡ STANDARDIZED: Wait for animations to complete
   */
  async waitForAnimations(): Promise<void> {
    await this.waitStandard(TestConfig.timeouts.animation);
  }

  /**
   * ⚡ STANDARDIZED: Wait for API responses with consistent timeouts
   */
  async waitForAPIResponse(): Promise<void> {
    await this.waitStandard(TestConfig.timeouts.medium);
  }

  /**
   * ⚡ STANDARDIZED: Wait for toasts to disappear completely
   */
  async waitForToastsToDisappear(
    specificText?: string | RegExp,
    timeout: number = TestConfig.timeouts.medium
  ): Promise<void> {
    try {
      if (specificText) {
        // Wait for specific toast to disappear
        await expect(this.page.getByText(specificText)).not.toBeVisible({
          timeout,
        });
      } else {
        // Wait for all toasts to clear
        await this.page.waitForFunction(
          () => {
            const toasts = document.querySelectorAll('.Toastify__toast');
            return toasts.length === 0;
          },
          { timeout }
        );
      }
    } catch {
      // Fallback: wait for toast exit animations
      console.log('🔄 Toast timeout - waiting for exit animations...');
      await this.page
        .waitForFunction(
          () => {
            const visibleToasts = document.querySelectorAll(
              '.Toastify__toast:not([data-in="false"])'
            );
            return visibleToasts.length === 0;
          },
          { timeout: TestConfig.timeouts.short }
        )
        .catch(() => {
          console.log('⚠️ Toast clearing timeout - continuing with test');
        });
    }
  }

  /**
   * ⚡ STANDARDIZED: Wait for page to be stable (network idle + brief pause)
   */
  async waitForPageStability(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.waitStandard(TestConfig.delays.brief);
  }

  /**
   * ⚡ STANDARDIZED: Wait for file validation to complete
   */
  async waitForFileValidation(): Promise<void> {
    await this.waitStandard(TestConfig.timeouts.fileValidation);
  }

  /**
   * ⚡ STANDARDIZED: Wait for route mock to be registered
   */
  async waitForRouteMockRegistration(): Promise<void> {
    await this.waitStandard(TestConfig.timeouts.routeMockRegistration);
  }

  /**
   * ⚡ STANDARDIZED: Base wait method - made public for utilities
   */
  async waitStandard(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * ⚡ STANDARDIZED: Conditional wait - only wait if condition is not met
   */
  async waitUntil(
    condition: () => Promise<boolean>,
    options: {
      timeout?: number;
      interval?: number;
      timeoutMsg?: string;
    } = {}
  ): Promise<void> {
    const {
      timeout = TestConfig.timeouts.medium,
      interval = 100,
      timeoutMsg = 'Condition not met within timeout'
    } = options;

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.waitStandard(interval);
    }
    
    throw new Error(timeoutMsg);
  }

  /**
   * ⚡ STANDARDIZED: Wait with retry logic for flaky operations
   */
  async waitWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = TestConfig.retries.flaky,
      retryDelay = TestConfig.delays.short,
      timeout = TestConfig.timeouts.medium
    } = options;

    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          ),
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
          await this.waitStandard(retryDelay);
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }
}

/**
 * 🎯 PERFORMANCE TIMING UTILITIES
 * Standardized performance measurement
 */
export class PerformanceWaitUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ⚡ STANDARDIZED: Measure operation performance
   */
  async measureOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ ${operationName} completed in ${duration}ms`);
    
    return { result, duration };
  }

  /**
   * ⚡ STANDARDIZED: Verify performance thresholds
   */
  async verifyPerformanceThreshold(
    operation: () => Promise<void>,
    maxDuration: number,
    operationName: string
  ): Promise<void> {
    const { duration } = await this.measureOperation(operation, operationName);
    
    if (duration > maxDuration) {
      console.warn(`⚠️ ${operationName} took ${duration}ms (threshold: ${maxDuration}ms)`);
    }
    
    expect(duration).toBeLessThanOrEqual(maxDuration);
  }
}
