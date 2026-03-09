import { test, expect } from '../__config__/base-test';

test.describe('🚀 Environment Tests', () => {
  test.beforeEach(async ({ suite }) => {
    await suite.setup.initializeApp();
    await suite.setup.verifyEnvironmentHealth();
  });

  test.afterEach(async ({ suite }) => {
    await suite.cleanup.reset();
  });

  // ==========================================
  // 🏥 ENVIRONMENT HEALTH CHECKS
  // ==========================================

  test('should verify all critical services are operational', async ({ suite }) => {
    // Check API health endpoints
    await suite.api.verifyHealthEndpoints();
    
    // Verify database connectivity
    await suite.api.verifyDatabaseConnection();
    
    // Check external service integrations
    await suite.api.verifyExternalServiceHealth();
  });

  test('should handle environment-specific configurations', async ({ suite }) => {
    // Verify environment variables are properly set
    await suite.actions.verifyEnvironmentConfiguration();
    
    // Test feature flags for the environment
    await suite.actions.verifyFeatureFlags();
    
    // Validate security headers
    await suite.actions.verifySecurityHeaders();
  });

  test('should perform smoke tests on critical user journeys', async ({ suite }) => {
    // Quick smoke test of core functionality
    await suite.flows.executeQuickSmokeTest();
    
    // Verify all critical pages load
    const criticalPages = [
      '/',
      '/customizer',
      '/gallery',
      '/about'
    ];
    
    for (const path of criticalPages) {
      await suite.page.goto(`${suite.data.urls.base}${path}`);
      await suite.actions.verifyPageLoadSuccess();
      await suite.monitoring.checkForConsoleErrors();
    }
  });

  // ==========================================
  // 🔒 SECURITY VALIDATION
  // ==========================================

  test('should verify security configurations', async ({ suite }) => {
    // Check for HTTPS enforcement
    await suite.actions.verifyHTTPSRedirect();
    
    // Verify CSP headers
    await suite.actions.verifyContentSecurityPolicy();
    
    // Check for sensitive data exposure
    await suite.actions.verifySensitiveDataProtection();
  });

  test('should validate CORS policies', async ({ suite }) => {
    // Test CORS for allowed origins
    await suite.api.verifyCORSPolicies();
    
    // Verify preflight requests work correctly
    await suite.api.verifyPreflightRequests();
  });
});
