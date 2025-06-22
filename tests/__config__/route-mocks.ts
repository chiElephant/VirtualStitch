/**
 * 🎯 ENHANCED CENTRALIZED ROUTE MOCKING MANAGER
 * Consistent API mocking across all tests with standardized patterns
 */

import { Page } from '@playwright/test';
import { TestData } from './test-data';
import { StandardWaitUtils } from './wait-utilities';

export class RouteMockManager {
  private activeMocks = new Set<string>();
  private page: Page;
  private waitUtils: StandardWaitUtils;
  private mockCallCounts = new Map<string, number>();

  constructor(page: Page) {
    this.page = page;
    this.waitUtils = new StandardWaitUtils(page);
  }

  /**
   * ⚡ STANDARDIZED: Mock successful AI generation
   */
  async mockAISuccess(): Promise<void> {
    await this.setupStandardMock('/api/custom-logo', TestData.mockResponses.aiSuccess);
  }

  /**
   * ⚡ STANDARDIZED: Mock AI rate limiting
   */
  async mockAIRateLimit(): Promise<void> {
    await this.setupStandardMock(
      '/api/custom-logo',
      TestData.mockResponses.aiRateLimit
    );
  }

  /**
   * ⚡ STANDARDIZED: Mock AI server error
   */
  async mockAIServerError(): Promise<void> {
    await this.setupStandardMock(
      '/api/custom-logo',
      TestData.mockResponses.aiServerError
    );
  }

  /**
   * ⚡ STANDARDIZED: Mock AI validation error
   */
  async mockAIValidationError(): Promise<void> {
    await this.setupStandardMock(
      '/api/custom-logo',
      TestData.mockResponses.aiValidationError
    );
  }

  /**
   * ⚡ STANDARDIZED: Mock custom AI response
   */
  async mockAICustom(status: number, body: unknown): Promise<void> {
    await this.setupStandardMock('/api/custom-logo', {
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  }

  /**
   * ⚡ STANDARDIZED: Mock delayed AI response for testing loading states
   */
  async mockAIDelayed(delayMs: number = 2000): Promise<() => void> {
    let resolveResponse: () => void;
    const responsePromise = new Promise<void>((resolve) => {
      resolveResponse = resolve;
    });

    await this.page.route('/api/custom-logo', async (route) => {
      await responsePromise;
      route.fulfill(TestData.mockResponses.aiSuccess);
    });

    this.activeMocks.add('/api/custom-logo');
    this.mockCallCounts.set('/api/custom-logo', 0);
    await this.waitUtils.waitForRouteMockRegistration();

    // Return function to resolve the delay
    return () => {
      setTimeout(resolveResponse!, delayMs);
    };
  }

  /**
   * ⚡ STANDARDIZED: Mock XSS protection - rejects malicious content
   */
  async mockXSSProtection(): Promise<void> {
    await this.page.route('/api/custom-logo', (route) => {
      const requestBody = route.request().postDataJSON();
      const prompt = requestBody?.prompt || '';

      // Increment call count
      const currentCount = this.mockCallCounts.get('/api/custom-logo') || 0;
      this.mockCallCounts.set('/api/custom-logo', currentCount + 1);

      // Check for malicious patterns
      const isMalicious = TestData.prompts.invalid.some(
        (pattern) =>
          prompt.includes(pattern) ||
          prompt.includes('<script') ||
          prompt.includes('javascript:') ||
          prompt.includes('onerror=')
      );

      if (isMalicious) {
        route.fulfill(TestData.mockResponses.aiValidationError);
      } else {
        route.fulfill(TestData.mockResponses.aiSuccess);
      }
    });

    this.activeMocks.add('/api/custom-logo');
    this.mockCallCounts.set('/api/custom-logo', 0);
    await this.waitUtils.waitForRouteMockRegistration();
  }

  /**
   * ⚡ STANDARDIZED: Mock network disconnection
   */
  async mockNetworkDisconnection(): Promise<void> {
    await this.page.route('/api/custom-logo', (route) => {
      route.abort('internetdisconnected');
    });

    this.activeMocks.add('/api/custom-logo');
    this.mockCallCounts.set('/api/custom-logo', 0);
    await this.waitUtils.waitForRouteMockRegistration();
  }

  /**
   * ⚡ STANDARDIZED: Mock timeout
   */
  async mockTimeout(): Promise<void> {
    await this.page.route('/api/custom-logo', () => {
      // Don't respond - let it timeout
    });

    this.activeMocks.add('/api/custom-logo');
    this.mockCallCounts.set('/api/custom-logo', 0);
    await this.waitUtils.waitForRouteMockRegistration();
  }

  /**
   * ⚡ STANDARDIZED: Setup a mock for a specific URL
   */
  private async setupStandardMock(
    url: string,
    response: Parameters<import('@playwright/test').Route['fulfill']>[0]
  ): Promise<void> {
    await this.page.route(url, (route) => {
      // Increment call count
      const currentCount = this.mockCallCounts.get(url) || 0;
      this.mockCallCounts.set(url, currentCount + 1);
      
      route.fulfill(response);
    });

    this.activeMocks.add(url);
    this.mockCallCounts.set(url, 0);
    
    // Standardized wait for route registration
    await this.waitUtils.waitForRouteMockRegistration();
  }

  /**
   * ⚡ STANDARDIZED: Clean up all active mocks
   */
  async cleanupAll(): Promise<void> {
    for (const url of this.activeMocks) {
      try {
        await this.page.unroute(url);
      } catch {
        // Ignore cleanup errors in parallel execution
        console.log(`⚠️ Mock cleanup warning for ${url}`);
      }
    }
    this.activeMocks.clear();
    this.mockCallCounts.clear();
  }

  /**
   * ⚡ STANDARDIZED: Clean up specific mock
   */
  async cleanup(url: string): Promise<void> {
    try {
      await this.page.unroute(url);
      this.activeMocks.delete(url);
      this.mockCallCounts.delete(url);
    } catch {
      console.log(`⚠️ Mock cleanup warning for ${url}`);
    }
  }

  /**
   * 🔍 DEBUG: Get active mocks for debugging
   */
  getActiveMocks(): string[] {
    return Array.from(this.activeMocks);
  }

  /**
   * 🔍 DEBUG: Get call counts for debugging
   */
  getMockCallCounts(): Map<string, number> {
    return new Map(this.mockCallCounts);
  }

  /**
   * 🔍 DEBUG: Get call count for specific URL
   */
  getCallCount(url: string): number {
    return this.mockCallCounts.get(url) || 0;
  }

  /**
   * ⚡ STANDARDIZED: Comprehensive mock setup for full test isolation
   */
  async setupDefaultTestMocks(): Promise<void> {
    // Clean any existing mocks first
    await this.cleanupAll();
    
    // Set up default success mock
    await this.mockAISuccess();
    
    console.log('🔧 Default test mocks configured');
  }

  /**
   * ⚡ STANDARDIZED: Setup specific mock scenario
   */
  async setupMockScenario(
    scenario: 'success' | 'rateLimit' | 'serverError' | 'validation' | 'xssProtection'
  ): Promise<void> {
    await this.cleanupAll();
    
    switch (scenario) {
      case 'success':
        await this.mockAISuccess();
        break;
      case 'rateLimit':
        await this.mockAIRateLimit();
        break;
      case 'serverError':
        await this.mockAIServerError();
        break;
      case 'validation':
        await this.mockAIValidationError();
        break;
      case 'xssProtection':
        await this.mockXSSProtection();
        break;
      default:
        throw new Error(`Unknown mock scenario: ${scenario}`);
    }
    
    console.log(`🔧 Mock scenario '${scenario}' configured`);
  }
}
