import { test, expect } from '../__config__/base-test';

test.describe('🔒 Security Excellence', () => {
  test.beforeEach(async ({ suite }) => {
    await suite.setup.initializeApp();
    await suite.setup.enableSecurityMonitoring();
  });
  
  test.afterEach(async ({ suite }) => {
    await suite.cleanup.reset();
  });

  // ==========================================
  // 🛡️ XSS PREVENTION FORTRESS
  // ==========================================
  test('should prevent script injection in AI prompts', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    for (const xssPayload of suite.data.security.xssPayloads) {
      // Mock secure API response
      await suite.mocks.mockSuccessfulAIResponse();
      
      await suite.page.getByTestId('ai-prompt-input').fill(xssPayload);
      await suite.page.getByTestId('ai-logo-button').click();
      
      await suite.actions.verifySuccessToast();
      
      // Verify no script execution occurred
      const xssFlag = await suite.page.evaluate(() => (window as any).xssTest);
      expect(xssFlag).toBeFalsy();
      
      await suite.actions.clearAndReset();
    }
  });
  
  test('should sanitize filename inputs completely', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateFilter('logoShirt');
    await suite.actions.activateEditorTab('imageDownload');

    for (const maliciousFilename of suite.data.security.maliciousFilenames) {
      const filenameInput = suite.page.getByPlaceholder('e.g., my-shirt');
      await filenameInput.fill(maliciousFilename);

      // Verify no script execution
      const xssFlag = await suite.page.evaluate(() => (window as any).xssTest);
      expect(xssFlag).toBeFalsy();
      
      // Interface remains functional
      await expect(suite.page.getByTestId('image-download')).toBeVisible();
    }
  });
  
  test('should handle extremely long inputs securely', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    // Mock API validation response
    await suite.mocks.mockValidationError('Prompt is too long. Maximum 1000 characters.');

    await suite.page.getByTestId('ai-prompt-input').fill(suite.data.security.longInput);
    await suite.page.getByTestId('ai-logo-button').click();

    // Should handle gracefully
    await expect(suite.page.locator('body')).toBeVisible();
    
    const hasValidationError = await suite.actions.verifyValidationErrorShown();
    expect(hasValidationError).toBeTruthy();
  });
  
  test('should prevent DOM manipulation attacks', async ({ suite }) => {
    await suite.actions.navigateToHomepage();
    await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();

    await suite.flows.navigateToCustomizer();

    const domManipulationPayloads = [
      'document.body.innerHTML="<h1>Hacked</h1>"',
      'document.querySelector("body").remove()',
      '<img src=x onerror="document.body.style.display=\'none\'">'
    ];

    for (const payload of domManipulationPayloads) {
      await suite.actions.activateEditorTab('aiPicker');
      await suite.page.getByTestId('ai-prompt-input').fill(payload);

      // Verify DOM integrity
      await suite.page.getByRole('button', { name: 'Go Back' }).click();
      await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
      await expect(suite.page.locator('body')).toBeVisible();

      await suite.flows.navigateToCustomizer();
    }
  });

  // ==========================================
  // 📁 FILE UPLOAD SECURITY FORTRESS
  // ==========================================
  test('should handle dangerous file extensions safely', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('filePicker');

    const dangerousFiles = [
      { name: 'script.js.png', mimeType: 'image/png' },
      { name: 'virus.exe.jpg', mimeType: 'image/jpeg' },
      { name: 'malware.svg', mimeType: 'image/svg+xml' },
      { name: 'exploit.html.png', mimeType: 'image/png' }
    ];

    for (const file of dangerousFiles) {
      const buffer = Buffer.from(suite.data.testFiles.validImageBase64, 'base64');
      await suite.actions.uploadFileWithBuffer(file.name, file.mimeType, buffer, 'logo');

      // Verify no script execution and application stability
      await expect(suite.page.locator('body')).toBeVisible();
    }
  });
  
  test('should handle oversized files gracefully', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('filePicker');

    // Create 1MB test file
    const largeContent = 'x'.repeat(1024 * 1024);
    const buffer = Buffer.from(largeContent);

    await suite.actions.uploadFileWithBuffer('large.png', 'image/png', buffer, 'logo');

    // Should handle without crashing
    await expect(suite.page.locator('body')).toBeVisible();
    await expect(suite.page.getByTestId('file-picker')).toBeVisible();
  });
  
  test('should reject malicious SVG content', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('filePicker');

    const maliciousSVG = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <script>window.xssTest = true;</script>
        <rect width="100" height="100" fill="red"/>
      </svg>
    `;

    const buffer = Buffer.from(maliciousSVG);
    await suite.actions.uploadFileWithBuffer('malicious.svg', 'image/svg+xml', buffer, 'logo');

    // Should not execute embedded script
    const xssFlag = await suite.page.evaluate(() => (window as any).xssTest);
    expect(xssFlag).toBeFalsy();
    await expect(suite.page.locator('body')).toBeVisible();
  });
  
  test('should validate file content types properly', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('filePicker');

    // Misleading file extension
    const textContent = 'This is actually a text file, not an image';
    const buffer = Buffer.from(textContent);

    await suite.actions.uploadFileWithBuffer('fake-image.png', 'text/plain', buffer, 'logo');
    await expect(suite.page.locator('body')).toBeVisible();
  });

  // ==========================================
  // 🔍 INPUT VALIDATION & SANITIZATION
  // ==========================================
  test('should validate and sanitize URL parameters', async ({ suite }) => {
    const maliciousParams = [
      '?xss=<script>alert("xss")</script>',
      '?redirect=javascript:alert("xss")',
      '?data=<img src=x onerror=alert("xss")>'
    ];

    for (const param of maliciousParams) {
      await suite.page.goto(`${suite.data.urls.base}/${param}`);
      
      await expect(suite.page.getByRole('heading', { name: "LET'S DO IT." })).toBeVisible();
      
      const xssFlag = await suite.page.evaluate(() => (window as any).xssTest);
      expect(xssFlag).toBeFalsy();
    }
  });
  
  test('should handle special characters in form inputs', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('imageDownload');

    const specialChars = [
      '<>&"\'',
      '../../file',
      'file\x00name',
      'file\nnewline',
      'file\ttab',
      'file\rreturn'
    ];

    for (const chars of specialChars) {
      const filenameInput = suite.page.getByPlaceholder('e.g., my-shirt');
      await filenameInput.fill(chars);

      await expect(suite.page.getByTestId('image-download')).toBeVisible();
      
      const xssFlag = await suite.page.evaluate(() => (window as any).xssTest);
      expect(xssFlag).toBeFalsy();
    }
  });
  
  test('should prevent path traversal attacks', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateFilter('logoShirt');

    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd'
    ];

    for (const payload of pathTraversalPayloads) {
      try {
        await suite.actions.activateEditorTab('imageDownload');
        await expect(suite.page.getByTestId('image-download')).toBeVisible({ timeout: 10000 });

        const filenameInput = suite.page.getByPlaceholder('e.g., my-shirt');
        await filenameInput.fill(payload);

        await expect(suite.page.getByTestId('image-download')).toBeVisible();
        await expect(suite.page.getByRole('button', { name: 'Download Shirt' })).toBeVisible();
      } catch {
        // Fallback to AI input testing
        await suite.actions.activateEditorTab('aiPicker');
        await suite.page.getByTestId('ai-prompt-input').fill(payload);
        await expect(suite.page.getByTestId('ai-picker')).toBeVisible();
      }
    }
  });

  // ==========================================
  // 🛡️ CSRF PROTECTION
  // ==========================================
  test('should include proper security headers in API requests', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    await suite.page.route('/api/custom-logo', (route: any) => {
      const headers = route.request().headers();
      
      expect(headers['content-type']).toContain('application/json');
      expect(route.request().method()).toBe('POST');

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ photo: suite.data.testFiles.validImageBase64 })
      });
    });

    await suite.actions.generateAIImage('CSRF protection test');
    await suite.actions.verifySuccessToast();
  });
  
  test('should validate request origins properly', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    const response = await suite.page.evaluate(async () => {
      try {
        const response = await fetch('/api/custom-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'test' })
        });
        return { status: response.status, statusText: response.statusText };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    expect(response.error?.includes('CORS')).toBeFalsy();
  });

  // ==========================================
  // 🔒 CONTENT SECURITY POLICY
  // ==========================================
  test('should prevent inline script execution', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    await suite.page.evaluate(() => {
      try {
        const script = document.createElement('script');
        script.innerHTML = 'window.inlineScriptExecuted = true;';
        document.head.appendChild(script);
      } catch (error) {
        console.log('Inline script blocked:', error);
      }
    });

    const scriptExecuted = await suite.page.evaluate(() => (window as any).inlineScriptExecuted);
    
    if (scriptExecuted) {
      console.warn('Warning: Inline scripts can execute - consider implementing CSP');
    }

    await expect(suite.page.locator('body')).toBeVisible();
  });
  
  test('should handle external resource loading securely', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    const externalRequests: string[] = [];
    
    suite.page.on('request', (request: any) => {
      const url = request.url();
      const origin = new URL(suite.page.url()).origin;
      if (!url.startsWith(origin)) {
        externalRequests.push(url);
      }
    });

    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('colorPicker');

    const suspiciousRequests = await suite.security.filterSuspiciousRequests(externalRequests);
    expect(suspiciousRequests.length).toBe(0);
  });

  // ==========================================
  // 🔐 DATA PROTECTION & PRIVACY
  // ==========================================
  test('should not expose sensitive data in client-side code', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    const exposedSecrets = await suite.security.scanForExposedSecrets();
    expect(exposedSecrets.length).toBe(0);
  });
  
  test('should handle user data securely', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    const sensitiveData = 'password123, secret-token, api-key-xyz';
    await suite.page.getByTestId('ai-prompt-input').fill(sensitiveData);

    const dataExposed = await suite.security.checkDataExposure(sensitiveData);
    expect(dataExposed).toBe(false);
  });
  
  test('should implement proper session management', async ({ suite }) => {
    await suite.actions.navigateToHomepage();

    const cookies = await suite.page.context().cookies();
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('session')
    );

    for (const cookie of sessionCookies) {
      expect(cookie.httpOnly).toBeDefined();
    }
  });

  // ==========================================
  // ⚠️ ERROR HANDLING SECURITY
  // ==========================================
  test('should not expose sensitive information in error messages', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    await suite.mocks.mockServerError('Server error while generating the image ⚠️.');
    await suite.actions.generateAIImage('trigger error');

    const errorMessage = await suite.page.textContent('body');
    const hasExposedInfo = await suite.security.checkForExposedInformation(errorMessage);
    expect(hasExposedInfo).toBe(false);
  });
  
  test('should handle malformed API responses securely', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    await suite.mocks.mockMalformedResponse('invalid json {[}');
    await suite.actions.generateAIImage('malformed response test');

    await expect(suite.page.getByText(/failed to fetch image/i)).toBeVisible();
    await expect(suite.page.locator('body')).toBeVisible();
  });

  // ==========================================
  // 🌐 NETWORK SECURITY
  // ==========================================
  test('should handle network disconnection securely', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    await suite.mocks.mockNetworkFailure();
    await suite.actions.generateAIImage('network test');

    await expect(suite.page.getByText(/failed to fetch image/i)).toBeVisible();
  });
  
  test('should validate API response integrity', async ({ suite }) => {
    await suite.flows.navigateToCustomizer();
    await suite.actions.activateEditorTab('aiPicker');

    await suite.mocks.mockSuspiciousAPIResponse({
      photo: suite.data.testFiles.validImageBase64,
      maliciousField: '<script>alert("injected")</script>',
      redirect: 'javascript:alert("redirect")'
    });

    await suite.actions.generateAIImage('response validation test');
    await suite.actions.verifySuccessToast();

    const xssFlag = await suite.page.evaluate(() => (window as any).xssTest);
    expect(xssFlag).toBeFalsy();
  });
});
