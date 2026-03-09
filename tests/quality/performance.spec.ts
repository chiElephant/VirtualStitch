import { test, expect } from '../__config__/base-test';

// Performance metrics will be created directly in tests when needed
test.describe('⚡ Performance Excellence', () => {
  test.beforeEach(async ({ suite }) => {
    await suite.setup.initializeApp();
    await suite.monitoring.startPerformanceTracking();
  });

  test.afterEach(async ({ suite }) => {
    await suite.monitoring.stopPerformanceTracking();
    await suite.cleanup.reset();
  });

  // ==========================================
  // 🚀 PAGE LOAD PERFORMANCE
  // ==========================================
  test('should achieve lightning-fast page loads', async ({ suite }) => {
    const startTime = Date.now();
    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForNetworkIdle();
    
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(suite.data.performance.pageLoadThreshold);
  });
  test('should load without critical console errors', async ({ suite }) => {
    const errors: string[] = [];
    
    suite.page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForNetworkIdle();

    // Filter known acceptable errors
    const criticalErrors = await suite.monitoring.filterCriticalErrors(errors);
    expect(criticalErrors).toHaveLength(0);
  });

  // ==========================================
  // 📊 CORE WEB VITALS EXCELLENCE
  // ==========================================
  test('should exceed Core Web Vitals benchmarks', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForNetworkIdle();

    const vitals = await suite.monitoring.getCoreWebVitals();

    // Apply strict performance thresholds
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(suite.data.performance.lcp);
    if (vitals.cls) expect(vitals.cls).toBeLessThan(suite.data.performance.cls);
    if (vitals.fcp) expect(vitals.fcp).toBeLessThan(suite.data.performance.fcp);
    if (vitals.fid) expect(vitals.fid).toBeLessThan(suite.data.performance.fid);
  });

  // ==========================================
  // ⚡ INTERACTION PERFORMANCE
  // ==========================================
  test('should handle rapid user interactions smoothly', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const startTime = Date.now();

    // Execute rapid interaction sequence
    await suite.actions.activateEditorTab('colorPicker');
    await suite.actions.selectColor(suite.data.colors.vibrantGreen);
    await suite.actions.activateEditorTab('filePicker');
    await suite.actions.activateEditorTab('aiPicker');
    await suite.actions.activateEditorTab('imageDownload');

    const interactionTime = Date.now() - startTime;
    // Interaction time measured

    expect(interactionTime).toBeLessThan(suite.data.performance.interactionThreshold);
  });
  test('should maintain performance during texture operations', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const startTime = Date.now();

    // Optimized texture operations
    const texture1Time = await suite.actions.performOptimizedTextureOperation(
      suite.data.testFiles.emblem,
      'logo'
    );
    
    const texture2Time = await suite.actions.performOptimizedTextureOperation(
      suite.data.testFiles.emblem2,
      'full'
    );

    // Toggle filters efficiently
    await suite.actions.activateFilter('logoShirt');
    await suite.actions.activateFilter('stylishShirt');

    const totalTime = Date.now() - startTime;
    
    console.log(`Texture operations: ${totalTime}ms (emblem: ${texture1Time}ms, emblem2: ${texture2Time}ms)`);
    expect(totalTime).toBeLessThan(suite.data.performance.textureOperationThreshold);
  });

  // ==========================================
  // 🎨 CANVAS & WEBGL PERFORMANCE
  // ==========================================
  test('should render canvas with optimal efficiency', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await suite.page.waitForSelector('canvas');
    await suite.wait.forThreeJSInitialization();

    const canvasPerformance = await suite.monitoring.getCanvasPerformanceMetrics();
    
    expect(canvasPerformance.exists).toBeTruthy();
    expect(canvasPerformance.hasContent).toBeTruthy();
    expect(canvasPerformance.fps).toBeGreaterThan(30); // Minimum 30 FPS
  });
  test('should handle rapid color changes efficiently', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('colorPicker');

    const startTime = Date.now();

    // Rapid color sequence
    const colors = [
      suite.data.colors.lightGray,
      suite.data.colors.yellow,
      suite.data.colors.vibrantGreen,
      suite.data.colors.purple,
      suite.data.colors.dark
    ];

    for (const color of colors) {
      await suite.actions.selectColor(color);
      await suite.wait.forColorTransition();
    }

    const colorChangeTime = Date.now() - startTime;
    expect(colorChangeTime).toBeLessThan(2000); // Sub-2-second total
  });

  // ==========================================
  // 🧠 MEMORY MANAGEMENT
  // ==========================================
  test('should maintain optimal memory consumption', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForNetworkIdle();

    const memoryInfo = await suite.monitoring.getMemoryUsage();

    if (memoryInfo.usedJSHeapSize !== null) {
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(suite.data.performance.memoryUsageLimit);
    }
  });
  test('should prevent memory leaks during extended usage', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const initialMemory = await suite.monitoring.getMemoryUsage();

    // Intensive operation cycle
    for (let i = 0; i < 10; i++) {
      await suite.actions.activateEditorTab('colorPicker');
      await suite.actions.selectColor(suite.data.colors.vibrantGreen);
      await suite.actions.activateEditorTab('filePicker');
      await suite.actions.activateEditorTab('aiPicker');
      await suite.wait.short();
    }

    // Force garbage collection if available
    await suite.monitoring.forceGarbageCollection();
    
    const finalMemory = await suite.monitoring.getMemoryUsage();

    if (initialMemory.usedJSHeapSize !== null && finalMemory.usedJSHeapSize !== null) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const maxAcceptableIncrease = 50 * 1024 * 1024; // 50MB max
      expect(memoryIncrease).toBeLessThan(maxAcceptableIncrease);
    }
  });

  // ==========================================
  // 🌐 NETWORK PERFORMANCE
  // ==========================================
  test('should achieve optimal network request efficiency', async ({ suite }) => {
    const networkMonitor = await suite.monitoring.createNetworkMonitor();

    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForNetworkIdle();

    const requests = await networkMonitor.getRequests();

    // Verify request success rate
    const failedRequests = requests.filter(req => req.status >= 400);
    const failureRate = failedRequests.length / requests.length;
    expect(failureRate).toBeLessThan(0.1); // < 10% failure rate

    // Verify API performance
    const apiRequests = requests.filter(req => req.url.includes('/api/'));
    const slowApiRequests = apiRequests.filter(
      req => req.responseTime > suite.data.performance.apiResponseThreshold
    );
    expect(slowApiRequests.length).toBe(0);
  });

  // ==========================================
  // 📱 CROSS-VIEWPORT PERFORMANCE
  // ==========================================
  test.describe('Performance Across Device Types', () => {
    Object.entries(suite.data.viewports).forEach(([deviceName, viewport]) => {
      test(`should maintain excellence on ${deviceName}`, async ({ suite }) => {
        await suite.page.setViewportSize(viewport);

        const startTime = Date.now();
        await suite.actions.navigateToHomepage();
        await suite.monitoring.waitForNetworkIdle();
        const loadTime = Date.now() - startTime;

        // Device-specific thresholds
        const threshold = deviceName.includes('mobile') 
          ? suite.data.performance.pageLoadThreshold * 1.5
          : suite.data.performance.pageLoadThreshold;

        expect(loadTime).toBeLessThan(threshold);

        // Interaction performance test
        const interactionStart = Date.now();
        await suite.page.getByRole('button', { name: 'Customize It' }).click();
        await suite.page.waitForSelector('[data-testid="editor-tabs-container"]', { state: 'visible' });
        const interactionTime = Date.now() - interactionStart;

        expect(interactionTime).toBeLessThan(suite.data.performance.interactionThreshold);
      });
    });
  });

  // ==========================================
  // 📈 PERFORMANCE MONITORING
  // ==========================================
  test('should provide comprehensive performance metrics', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await suite.monitoring.waitForNetworkIdle();

    const metrics = await suite.monitoring.getComprehensiveMetrics();

    // Essential metrics verification
    expect(metrics.supportsPerformanceAPI).toBe(true);
    expect(metrics.domInteractive).toBeGreaterThan(0);
    expect(metrics.domComplete).toBeGreaterThan(0);
    expect(metrics.loadEventEnd).toBeGreaterThan(0);
    expect(metrics.resourceTimings).toBeDefined();
  });
  test('should support advanced performance tracking', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    // Custom performance marks
    await suite.monitoring.createPerformanceMark('test-mark-start');
    await suite.monitoring.createPerformanceMark('test-mark-end');
    await suite.monitoring.createPerformanceMeasure('test-measure', 'test-mark-start', 'test-mark-end');

    const customMetrics = await suite.monitoring.getCustomPerformanceMetrics();

    expect(customMetrics.supportsMarks).toBe(true);
    expect(customMetrics.supportsMeasures).toBe(true);
    expect(customMetrics.marksCount).toBeGreaterThan(0);
    expect(customMetrics.measuresCount).toBeGreaterThan(0);
  });

  // ==========================================
  // 🔥 STRESS TESTING
  // ==========================================
  test('should handle concurrent operations efficiently', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    const startTime = Date.now();

    // Concurrent operations
    const operations = [
      suite.actions.activateEditorTab('colorPicker'),
      suite.actions.selectColor(suite.data.colors.vibrantGreen),
      suite.actions.activateFilter('logoShirt'),
      suite.actions.activateFilter('stylishShirt')
    ];

    await Promise.all(operations);

    const concurrentTime = Date.now() - startTime;
    expect(concurrentTime).toBeLessThan(suite.data.performance.concurrentOperationThreshold);
  });
  test('should maintain performance under load simulation', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();

    // Simulate heavy load
    const loadOperations = Array.from({ length: 20 }, async (_, i) => {
      await suite.actions.activateEditorTab(i % 2 === 0 ? 'colorPicker' : 'filePicker');
      await suite.wait.short();
    });

    const startTime = Date.now();
    await Promise.all(loadOperations);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(suite.data.performance.loadSimulationThreshold);

    // Verify app stability after load
    await suite.monitoring.verifyApplicationStability();
  });
});
