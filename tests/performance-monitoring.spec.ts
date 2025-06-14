import { test, expect } from '@playwright/test';

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

test.describe.skip('Performance Monitoring @performance-monitoring', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Expect page to load within 5 seconds in production
    expect(loadTime).toBeLessThan(5000);
  });

  test('Core Web Vitals are within acceptable ranges', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get Core Web Vitals with proper typing
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

        // Timeout after 10 seconds
        setTimeout(() => resolve(vitals), 10000);
      });
    });

    // Basic checks (adjust thresholds as needed for your app)
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(4000); // 4s for production
    if (vitals.cls) expect(vitals.cls).toBeLessThan(0.25); // 0.25 threshold
    if (vitals.fcp) expect(vitals.fcp).toBeLessThan(2000); // 2s for FCP
  });

  test('no console errors on page load', async ({ page }) => {
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
        !error.includes('Non-passive event listener')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('canvas renders without performance issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');

    // Wait for canvas to be ready
    await page.waitForTimeout(2000);

    // Check that canvas is not blank (has some content)
    const canvasContent = await page.evaluate((): boolean => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some((channel) => channel !== 0);
    });

    expect(canvasContent).toBeTruthy();
  });

  test('page memory usage is reasonable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get memory info if available
    const memoryInfo = await page.evaluate((): number | null => {
      // Check if performance.memory is available (Chrome only)
      const perfWithMemory = performance as PerformanceWithMemory;
      if (perfWithMemory.memory) {
        return perfWithMemory.memory.usedJSHeapSize;
      }
      return null;
    });

    // Only check memory if the API is available (Chrome)
    if (memoryInfo !== null) {
      // Expect less than 50MB of JS heap usage (adjust as needed)
      expect(memoryInfo).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('network requests complete efficiently', async ({ page }) => {
    const networkRequests: Array<{
      url: string;
      status: number;
      responseTime: number;
    }> = [];

    page.on('response', (response) => {
      const request = response.request();
      const timing = response.request().timing();

      networkRequests.push({
        url: request.url(),
        status: response.status(),
        responseTime: timing ? timing.responseEnd - timing.requestStart : 0,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that most requests are successful
    const failedRequests = networkRequests.filter((req) => req.status >= 400);
    expect(failedRequests.length).toBeLessThan(networkRequests.length * 0.1); // Less than 10% failure rate

    // Check that API requests are reasonably fast
    const apiRequests = networkRequests.filter((req) =>
      req.url.includes('/api/')
    );
    const slowApiRequests = apiRequests.filter(
      (req) => req.responseTime > 5000
    ); // 5 seconds
    expect(slowApiRequests.length).toBe(0);
  });
});
