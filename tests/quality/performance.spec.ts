import { test, expect } from '@playwright/test';
import { TestUtils, PERFORMANCE_THRESHOLDS, VIEWPORTS } from '../utils/test-helpers';

interface PerformanceVitals {
  lcp?: number;
  cls?: number;
  fcp?: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

test.describe('Performance Tests @performance-monitoring', () => {
  let utils: TestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });

    test('should have no critical console errors on load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('ResizeObserver') &&
          !error.includes('Non-passive event listener') &&
          !error.includes('favicon.ico')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals benchmarks', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const vitals = await page.evaluate((): Promise<PerformanceVitals> => {
        return new Promise((resolve) => {
          const vitals: PerformanceVitals = {};

          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // Cumulative Layout Shift
          new PerformanceObserver((list) => {
            let cls = 0;
            for (const entry of list.getEntries()) {
              const layoutEntry = entry as LayoutShiftEntry;
              if (!layoutEntry.hadRecentInput) {
                cls += layoutEntry.value;
              }
            }
            vitals.cls = cls;
          }).observe({ entryTypes: ['layout-shift'] });

          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.fcp = entries[0].startTime;
            resolve(vitals);
          }).observe({ entryTypes: ['paint'] });

          // Timeout fallback
          setTimeout(() => resolve(vitals), 10000);
        });
      });

      // Apply thresholds
      if (vitals.lcp) expect(vitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
      if (vitals.cls) expect(vitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
      if (vitals.fcp) expect(vitals.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp);
    });
  });

  test.describe('Interaction Performance', () => {
    test('should handle rapid interactions smoothly', async ({ page }) => {
      await utils.nav.goToCustomizer();

      const startTime = Date.now();

      // Rapid interactions
      await utils.color.openColorPicker();
      await utils.color.selectColor('#80C670');
      await utils.nav.openEditorTab('file-picker');
      await utils.nav.openEditorTab('ai-picker');
      await utils.nav.openEditorTab('image-download');

      const interactionTime = Date.now() - startTime;
      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
    });

    test('should maintain performance during texture operations', async ({ page }) => {
      await utils.nav.goToCustomizer();

      const startTime = Date.now();

      // Upload and apply multiple textures
      await utils.file.uploadFile('./fixtures/emblem.png', 'logo');
      await utils.file.uploadFile('./fixtures/emblem2.png', 'full');
      
      // Toggle filters
      await utils.texture.activateFilter('logoShirt');
      await utils.texture.activateFilter('stylishShirt');

      const textureTime = Date.now() - startTime;
      expect(textureTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
    });
  });

  test.describe('Canvas and WebGL Performance', () => {
    test('should render canvas efficiently', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('canvas');
      await page.waitForTimeout(3000); // Allow Three.js initialization

      const canvasInfo = await page.evaluate((): { exists: boolean; hasContent: boolean } => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return { exists: false, hasContent: false };
        
        const hasContent = canvas.width > 0 && canvas.height > 0;
        return { exists: true, hasContent };
      });

      expect(canvasInfo.exists).toBeTruthy();
      expect(canvasInfo.hasContent).toBeTruthy();
    });

    test('should handle multiple color changes efficiently', async ({ page }) => {
      await utils.nav.goToCustomizer();
      await utils.color.openColorPicker();

      const startTime = Date.now();

      // Multiple rapid color changes
      const colors = ['#CCCCCC', '#EFBD4E', '#80C670', '#726DE8', '#353934'];
      for (const color of colors) {
        await utils.color.selectColor(color);
        await page.waitForTimeout(50);
      }

      const colorChangeTime = Date.now() - startTime;
      expect(colorChangeTime).toBeLessThan(2000); // Should be fast
    });
  });

  test.describe('Memory Usage', () => {
    test('should maintain reasonable memory consumption', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const memoryInfo = await page.evaluate((): number | null => {
        const perfWithMemory = performance as PerformanceWithMemory;
        return perfWithMemory.memory ? perfWithMemory.memory.usedJSHeapSize : null;
      });

      // Only check if memory API is available (Chrome)
      if (memoryInfo !== null) {
        expect(memoryInfo).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
      }
    });

    test('should not leak memory during extended usage', async ({ page }) => {
      await utils.nav.goToCustomizer();

      // Get initial memory if available
      const initialMemory = await page.evaluate((): number | null => {
        const perfWithMemory = performance as PerformanceWithMemory;
        return perfWithMemory.memory ? perfWithMemory.memory.usedJSHeapSize : null;
      });

      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await utils.color.openColorPicker();
        await utils.color.selectColor('#80C670');
        await utils.nav.openEditorTab('file-picker');
        await utils.nav.openEditorTab('ai-picker');
        await page.waitForTimeout(100);
      }

      // Force garbage collection if possible
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      const finalMemory = await page.evaluate((): number | null => {
        const perfWithMemory = performance as PerformanceWithMemory;
        return perfWithMemory.memory ? perfWithMemory.memory.usedJSHeapSize : null;
      });

      // Check for significant memory leaks
      if (initialMemory !== null && finalMemory !== null) {
        const memoryIncrease = finalMemory - initialMemory;
        const maxAcceptableIncrease = 50 * 1024 * 1024; // 50MB
        expect(memoryIncrease).toBeLessThan(maxAcceptableIncrease);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should complete network requests efficiently', async ({ page }) => {
      const networkRequests: Array<{
        url: string;
        status: number;
        responseTime: number;
      }> = [];

      page.on('response', (response) => {
        const request = response.request();
        const timing = request.timing();

        networkRequests.push({
          url: request.url(),
          status: response.status(),
          responseTime: timing ? timing.responseEnd - timing.requestStart : 0,
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check request success rate
      const failedRequests = networkRequests.filter((req) => req.status >= 400);
      const failureRate = failedRequests.length / networkRequests.length;
      expect(failureRate).toBeLessThan(0.1); // Less than 10% failure

      // Check API request performance
      const apiRequests = networkRequests.filter((req) => req.url.includes('/api/'));
      const slowApiRequests = apiRequests.filter(
        (req) => req.responseTime > PERFORMANCE_THRESHOLDS.apiResponse
      );
      expect(slowApiRequests.length).toBe(0);
    });
  });

  test.describe('Performance Across Viewports', () => {
    Object.entries(VIEWPORTS).forEach(([deviceName, viewport]) => {
      test(`should maintain performance on ${deviceName}`, async ({ page }) => {
        await page.setViewportSize(viewport);

        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        // Allow extra time for mobile devices
        const threshold = deviceName.includes('mobile') ? 
          PERFORMANCE_THRESHOLDS.pageLoad * 1.5 : 
          PERFORMANCE_THRESHOLDS.pageLoad;

        expect(loadTime).toBeLessThan(threshold);

        // Test basic interaction performance
        const interactionStart = Date.now();
        await page.getByRole('button', { name: 'Customize It' }).click();
        await page.waitForSelector('[data-testid="editor-tabs-container"]', {
          state: 'visible',
        });
        const interactionTime = Date.now() - interactionStart;

        expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
      });
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should provide essential performance metrics', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');

        return {
          domInteractive: navigation.domInteractive,
          domComplete: navigation.domComplete,
          loadEventEnd: navigation.loadEventEnd,
          paintEntriesCount: paintEntries.length,
          supportsPerformanceAPI: typeof performance !== 'undefined',
        };
      });

      // Verify essential metrics are available
      expect(performanceMetrics.supportsPerformanceAPI).toBe(true);
      expect(performanceMetrics.domInteractive).toBeGreaterThan(0);
      expect(performanceMetrics.domComplete).toBeGreaterThan(0);
      expect(performanceMetrics.loadEventEnd).toBeGreaterThan(0);
    });

    test('should support custom performance tracking', async ({ page }) => {
      await page.goto('/');

      // Test custom performance marks
      await page.evaluate(() => {
        performance.mark('test-mark-start');
        performance.mark('test-mark-end');
        performance.measure('test-measure', 'test-mark-start', 'test-mark-end');
      });

      const customMetrics = await page.evaluate(() => {
        const marks = performance.getEntriesByType('mark');
        const measures = performance.getEntriesByType('measure');
        
        return {
          marksCount: marks.length,
          measuresCount: measures.length,
          supportsMarks: typeof performance.mark === 'function',
          supportsMeasures: typeof performance.measure === 'function',
        };
      });

      expect(customMetrics.supportsMarks).toBe(true);
      expect(customMetrics.supportsMeasures).toBe(true);
      expect(customMetrics.marksCount).toBeGreaterThan(0);
      expect(customMetrics.measuresCount).toBeGreaterThan(0);
    });
  });
});
