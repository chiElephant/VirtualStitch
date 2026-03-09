/**
 * 🤖 AI PICKER TEST SUITE
 * Comprehensive testing of AI generation functionality
 * ⚡ Uses standardized VirtualStitchTestSuite framework
 */

import { test, expect } from '../__config__/base-test';

test.describe('🤖 AI Picker', () => {
  // ====================================================================
  // 🔧 SETUP & TEARDOWN
  // ====================================================================

  test.beforeEach(async ({ suite }) => {
    // Clean setup with AI-specific mock routing
    await suite.setup({
      navigateToCustomizer: true,
      openEditorTab: 'aiPicker',
      mockRoutes: true,
      mockScenario: 'success',
    });
  });

  // ====================================================================
  // 🎨 UI COMPONENTS
  // ====================================================================

  test.describe('UI Components', () => {
    test('should display complete AI picker interface', async ({ page, suite }) => {
      await suite.assert.verifyPickerOpen('aiPicker');
      await suite.assert.verifyComponentVisible('aiPicker');
      
      // Verify all essential UI elements
      await expect(page.getByTestId('ai-prompt-input')).toBeVisible();
      await expect(page.getByTestId('ai-logo-button')).toBeVisible();
      await expect(page.getByTestId('ai-full-button')).toBeVisible();
    });

    test('should accept and display prompt text correctly', async ({ page, suite }) => {
      const testPrompt = suite.data.prompts.valid[0];
      
      await suite.safeFill('[data-testid="ai-prompt-input"]', testPrompt);
      await expect(page.getByTestId('ai-prompt-input')).toHaveValue(testPrompt);
    });
  });

  // ====================================================================
  // ✅ SUCCESSFUL AI GENERATION
  // ====================================================================

  test.describe('Successful AI Generation', () => {
    test('should generate and apply logo texture successfully', async ({ suite }) => {
      await suite.generateAndVerifyAIImage(suite.data.prompts.valid[0], 'logo');
    });

    test('should generate and apply full texture successfully', async ({ suite }) => {
      await suite.generateAndVerifyAIImage(suite.data.prompts.valid[1], 'full');
    });

    test('should close AI picker after successful generation', async ({ page, suite }) => {
      await suite.routeMocks.mockAISuccess();
      await suite.generateAIImage(suite.data.prompts.valid[2], 'logo');
      
      await suite.assert.verifySuccessToast();
      await suite.assert.verifyPickerClosed('aiPicker');
    });

    test('should handle multiple valid prompts sequentially', async ({ suite }) => {
      for (const prompt of suite.data.prompts.valid.slice(0, 3)) {
        // Reopen AI picker for each iteration
        await suite.openEditorTab('aiPicker');
        await suite.generateAndVerifyAIImage(prompt, 'logo');
        
        // Brief pause between generations
        await suite.wait.waitStandard(200);
      }
    });
  });

  // ====================================================================
  // ⚠️ ERROR HANDLING
  // ====================================================================

  test.describe('Error Handling', () => {
    test('should show validation warning for empty prompt', async ({ page, suite }) => {
      await page.getByTestId('ai-logo-button').click();
      await suite.assert.verifyErrorToast('validation');
    });

    test('should handle rate limiting gracefully', async ({ suite }) => {
      await suite.routeMocks.mockAIRateLimit();
      await suite.generateAIImage('Test rate limit');
      await suite.assert.verifyErrorToast('rate-limit');
    });

    test('should handle server errors gracefully', async ({ suite }) => {
      await suite.routeMocks.mockAIServerError();
      await suite.generateAIImage('Test server error');
      await suite.assert.verifyErrorToast('server');
    });

    test('should handle validation errors appropriately', async ({ suite }) => {
      await suite.routeMocks.mockAIValidationError();
      await suite.generateAIImage('Test validation error');
      await suite.assert.verifyErrorToast('validation');
    });

    test('should handle network disconnection', async ({ suite }) => {
      await suite.routeMocks.mockNetworkDisconnection();
      await suite.generateAIImage('Test network error');
      await suite.assert.verifyErrorToast('network');
    });
  });

  // ====================================================================
  // ⏳ LOADING STATES
  // ====================================================================

  test.describe('Loading States', () => {
    test('should display loading state during generation', async ({ page, suite }) => {
      // Setup delayed response
      const resolveResponse = await suite.routeMocks.mockAIDelayed(2000);
      
      // Start generation
      await suite.generateAIImage('Test loading state');
      
      // Verify loading state
      await suite.assert.verifyLoadingState('Asking AI...');
      await expect(page.getByTestId('ai-logo-button')).not.toBeVisible();
      await expect(page.getByTestId('ai-full-button')).not.toBeVisible();
      
      // Resolve the delayed response
      resolveResponse();
      
      // Verify loading completes
      await suite.assert.verifyLoadingComplete();
    });

    test('should disable inputs during generation', async ({ page, suite }) => {
      const resolveResponse = await suite.routeMocks.mockAIDelayed(1500);
      
      await suite.generateAIImage('Test input disabled');
      
      // Input should be disabled during loading
      await expect(page.getByTestId('ai-prompt-input')).toBeDisabled();
      
      resolveResponse();
      
      // Input should be re-enabled after completion
      await suite.wait.waitStandard(500);
      await expect(page.getByTestId('ai-prompt-input')).toBeEnabled();
    });
  });

  // ====================================================================
  // 🛡️ INPUT VALIDATION AND SECURITY
  // ====================================================================

  test.describe('Input Validation and Security', () => {
    test('should reject malicious XSS prompts comprehensively', async ({ suite }) => {
      console.log('🛡️ Testing XSS protection...');
      
      await suite.routeMocks.mockXSSProtection();
      
      for (const maliciousPrompt of suite.data.prompts.invalid) {
        console.log(`Testing XSS: ${maliciousPrompt.substring(0, 30)}...`);
        
        await suite.testMaliciousInput(maliciousPrompt, 'prompt', 'reject');
        
        // Ensure AI picker is available for next iteration
        await suite.openEditorTab('aiPicker');
        await suite.wait.waitStandard(suite.data.delays.brief);
      }
      
      console.log('✅ All XSS attacks successfully blocked');
    });

    test('should handle edge cases properly', async ({ page, suite }) => {
      console.log('🧪 Testing edge cases...');
      
      await suite.routeMocks.mockAISuccess();
      
      for (const edgeCase of suite.data.prompts.edgeCases) {
        console.log(`Testing: ${edgeCase.name}`);
        
        await suite.openEditorTab('aiPicker');
        
        await page.getByTestId('ai-prompt-input').fill(edgeCase.value);
        await page.getByTestId('ai-logo-button').click();
        
        if (edgeCase.expectsValidation) {
          await suite.assert.verifyErrorToast('validation');
          console.log(`✅ ${edgeCase.name}: Validation correctly triggered`);
        } else {
          await suite.assert.verifySuccessToast();
          console.log(`✅ ${edgeCase.name}: Properly accepted`);
        }
        
        await suite.wait.waitStandard(suite.data.delays.brief);
      }
    });

    test('should handle rapid sequential attempts safely', async ({ suite }) => {
      console.log('⚡ Testing rapid attack mitigation...');
      
      await suite.routeMocks.mockXSSProtection();
      
      const rapidAttacks = suite.data.prompts.invalid.slice(0, 3);
      
      for (let i = 0; i < rapidAttacks.length; i++) {
        const attack = rapidAttacks[i];
        console.log(`Rapid attack ${i + 1}: ${attack.substring(0, 20)}...`);
        
        await suite.openEditorTab('aiPicker');
        await suite.testMaliciousInput(attack, 'prompt', 'reject');
        
        console.log(`✅ Rapid attack ${i + 1} blocked`);
        await suite.wait.waitStandard(100);
      }
      
      console.log('✅ All rapid attacks successfully blocked');
    });

    test('should validate unicode and special characters', async ({ page, suite }) => {
      console.log('🌍 Testing special character handling...');
      
      await suite.routeMocks.mockAISuccess();
      
      const unicodePrompt = 'Create красивый sunset with 美しい colors';
      await suite.generateAndVerifyAIImage(unicodePrompt, 'logo');
      
      console.log('✅ Unicode characters properly handled');
    });
  });

  // ====================================================================
  // 💾 STATE PERSISTENCE
  // ====================================================================

  test.describe('State Persistence', () => {
    test('should preserve prompt when switching tabs', async ({ page, suite }) => {
      const testPrompt = 'Preserve this prompt text';
      
      await page.getByTestId('ai-prompt-input').fill(testPrompt);
      
      // Switch to color picker and back
      await suite.openEditorTab('colorPicker');
      await suite.openEditorTab('aiPicker');
      
      // Verify prompt is preserved
      await expect(page.getByTestId('ai-prompt-input')).toHaveValue(testPrompt);
    });

    test('should maintain state after successful generation', async ({ page, suite }) => {
      const testPrompt = 'Maintain state test';
      
      await suite.generateAndVerifyAIImage(testPrompt, 'logo');
      
      // Reopen AI picker
      await suite.openEditorTab('aiPicker');
      
      // Prompt should be preserved
      await expect(page.getByTestId('ai-prompt-input')).toHaveValue(testPrompt);
    });

    test('should clear input after explicit user action', async ({ page, suite }) => {
      const testPrompt = 'Clear this prompt';
      
      await page.getByTestId('ai-prompt-input').fill(testPrompt);
      await page.getByTestId('ai-prompt-input').fill('');
      
      await suite.assert.verifyInputEmpty('ai-prompt-input');
    });
  });

  // ====================================================================
  // 🚀 PERFORMANCE AND RELIABILITY
  // ====================================================================

  test.describe('Performance and Reliability', () => {
    test('should complete AI generation within performance threshold', async ({ suite }) => {
      const { duration } = await suite.measureOperation(
        async () => {
          await suite.generateAndVerifyAIImage('Performance test', 'logo');
        },
        'AI Generation Workflow',
        suite.data.performance.maxTextureOperation
      );
      
      expect(duration).toBeLessThanOrEqual(suite.data.performance.maxTextureOperation);
    });

    test('should maintain application stability during errors', async ({ suite }) => {
      // Test multiple error scenarios
      const errorScenarios = ['rateLimit', 'serverError', 'validation'] as const;
      
      for (const scenario of errorScenarios) {
        await suite.routeMocks.setupMockScenario(scenario);
        await suite.openEditorTab('aiPicker');
        await suite.generateAIImage(`Test ${scenario}`);
        
        // Verify app remains stable
        await suite.assert.verifyApplicationStable();
        
        console.log(`✅ App stable during ${scenario} error`);
      }
    });

    test('should handle concurrent operations gracefully', async ({ suite }) => {
      await suite.routeMocks.mockAISuccess();
      
      // Test rapid tab switching during AI generation
      const resolveResponse = await suite.routeMocks.mockAIDelayed(1000);
      
      await suite.generateAIImage('Concurrent test');
      
      // Switch tabs during generation
      await suite.openEditorTab('colorPicker');
      await suite.openEditorTab('filePicker');
      await suite.openEditorTab('aiPicker');
      
      resolveResponse();
      
      // Verify operation completes successfully
      await suite.assert.verifyApplicationStable();
    });
  });
});
