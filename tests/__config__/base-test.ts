/**
 * 🎯 ENHANCED BASE TEST CLASS
 * Provides consistent setup and utilities across all test suites
 * ⚡ Standardized waiting, assertions, and route mocking
 */

import { Page } from '@playwright/test';
import { TestConfig, EditorTabName, FilterTabName } from './test-config';
import { TestData } from './test-data';
import { RouteMockManager } from './route-mocks';
import { StandardWaitUtils } from './wait-utilities';
import { StandardAssertions } from './standard-assertions';

export interface BaseTestOptions {
  navigateToCustomizer?: boolean;
  openEditorTab?: EditorTabName;
  activateFilter?: FilterTabName;
  mockRoutes?: boolean;
  mockScenario?: 'success' | 'rateLimit' | 'serverError' | 'validation' | 'xssProtection';
  skipWaitForReady?: boolean;
  cleanupMocks?: boolean;
}

export abstract class BaseTestSuite {
  protected page: Page;
  protected routeMocks: RouteMockManager;
  protected wait: StandardWaitUtils;
  protected assert: StandardAssertions;

  constructor(page: Page) {
    this.page = page;
    this.routeMocks = new RouteMockManager(page);
    this.wait = new StandardWaitUtils(page);
    this.assert = new StandardAssertions(page);
  }

  /**
   * ⚡ STANDARDIZED: Enhanced setup for most tests
   */
  async setup(options: BaseTestOptions = {}): Promise<void> {
    const {
      navigateToCustomizer = true,
      openEditorTab,
      activateFilter,
      mockRoutes = false,
      mockScenario = 'success',
      skipWaitForReady = false,
      cleanupMocks = true,
    } = options;

    // Clean up any existing mocks if requested
    if (cleanupMocks) {
      await this.routeMocks.cleanupAll();
    }

    // Setup route mocks if requested
    if (mockRoutes) {
      await this.routeMocks.setupMockScenario(mockScenario);
    }

    // Navigate to customizer if requested
    if (navigateToCustomizer) {
      await this.navigateToCustomizer();
      
      if (!skipWaitForReady) {
        await this.wait.waitForCustomizerReady();
      }
    }

    // Open specific editor tab if requested
    if (openEditorTab) {
      await this.openEditorTab(openEditorTab);
    }

    // Activate filter if requested
    if (activateFilter) {
      await this.activateFilter(activateFilter);
    }
  }

  /**
   * ⚡ STANDARDIZED: Enhanced cleanup after each test
   */
  async cleanup(): Promise<void> {
    await this.routeMocks.cleanupAll();
  }

  /**
   * ⚡ STANDARDIZED: Navigate to customizer with proper waiting
   */
  protected async navigateToCustomizer(): Promise<void> {
    await this.page.goto('/');
    await this.page.getByRole('button', { name: TestData.buttonLabels.actions.customizeIt }).click();
    await this.wait.waitForElement(TestConfig.selectors.editorTabs.container, {
      timeout: TestConfig.timeouts.long,
    });
  }

  /**
   * ⚡ STANDARDIZED: Open editor tab with enhanced error handling
   */
  protected async openEditorTab(tabName: EditorTabName): Promise<void> {
    const tabSelector = TestConfig.selectors.editorTabs[tabName];

    // Wait for tab to be available
    await this.wait.waitForElement(tabSelector, {
      timeout: TestConfig.timeouts.long,
    });

    // Click the tab
    await this.page.locator(tabSelector).click();
    
    // Wait for tab content to be ready
    await this.wait.waitForTabReady(tabName);
  }

  /**
   * ⚡ STANDARDIZED: Activate filter with proper waiting
   */
  protected async activateFilter(filterName: FilterTabName): Promise<void> {
    const filterSelector = TestConfig.selectors.filterTabs[filterName];
    
    await this.page.locator(filterSelector).click();
    await this.wait.waitStandard(TestConfig.delays.medium);
  }

  /**
   * ⚡ STANDARDIZED: Common interaction helpers using standardized assertions
   */
  protected async selectColor(color: string): Promise<void> {
    await this.page.getByTitle(color).click();
    await this.wait.waitStandard(TestConfig.delays.brief);
  }

  protected async uploadFile(filePath: string, applyAs: 'logo' | 'full' = 'logo'): Promise<void> {
    // Ensure file picker is open
    const filePickerVisible = await this.page.locator(TestConfig.selectors.inputs.filePickerInput).isVisible();
    if (!filePickerVisible) {
      await this.openEditorTab('filePicker');
    }

    // Wait for file input
    await this.wait.waitForElement(TestConfig.selectors.inputs.filePickerInput, {
      timeout: TestConfig.timeouts.medium,
    });

    // Upload file
    await this.page.locator(TestConfig.selectors.inputs.filePickerInput).setInputFiles(filePath);
    
    // Wait for validation
    await this.wait.waitForFileValidation();

    // Check for validation errors
    const hasError = await this.page.locator('.Toastify__toast--error').isVisible();
    if (hasError) {
      const errorText = await this.page.locator('.Toastify__toast--error').textContent();
      throw new Error(`File validation failed: ${errorText}`);
    }

    // Apply the file - use correct button text
    const buttonText = applyAs === 'logo' ? 
      TestData.buttonLabels.actions.logoButton : 
      TestData.buttonLabels.actions.fullPatternButton;
    
    await this.page.getByRole('button', { name: buttonText }).click();
    await this.wait.waitForTextureApplication();

    // Ensure appropriate filter is activated
    const filterTab = applyAs === 'logo' ? 'logoShirt' : 'stylishShirt';
    const textureSelector = TestConfig.selectors.textures[applyAs];
    
    const textureCount = await this.page.locator(textureSelector).count();
    if (textureCount === 0) {
      await this.activateFilter(filterTab);
    }
  }
}
