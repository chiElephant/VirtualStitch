import { Page, ConsoleMessage, Request, Response, Route, Download } from '@playwright/test';
import type { VirtualStitchTestSuite } from '../__config__/base-test';

// Define all test fixture types
export interface TestFixtures {
  suite: VirtualStitchTestSuite;
  stateMonitor: StateMonitor;
  workflowTracker: WorkflowTracker;
  axeBuilder: AxeBuilder;
  performanceMetrics: PerformanceMetrics;
  responsiveMetrics: ResponsiveMetrics;
  securityMonitor: SecurityMonitor;
}

export interface StateMonitor {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getMetrics: () => Record<string, any>;
}

export interface WorkflowTracker {
  startTracking: () => void;
  stopTracking: () => void;
  getEvents: () => Array<any>;
  measureOperation: <T>(operation: () => Promise<T>, name: string) => Promise<{ result: T; duration: number }>;
}

export interface AxeBuilder {
  analyze: () => Promise<{ violations: Array<any> }>;
  include: (selector: string) => AxeBuilder;
  exclude: (selector: string) => AxeBuilder;
}

export interface PerformanceMetrics {
  measure: () => Promise<Record<string, any>>;
  getCoreWebVitals: () => Promise<Record<string, any>>;
  getMemoryUsage: () => Promise<{ usedJSHeapSize: number | null }>;
  createNetworkMonitor: () => Promise<NetworkMonitor>;
}

export interface ResponsiveMetrics {
  measureTouch: () => Promise<Record<string, any>>;
  validateViewport: () => Promise<boolean>;
  measureElement: (element: any) => Promise<{ width: number; height: number }>;
}

export interface SecurityMonitor {
  checkForViolations: () => Array<any>;
  validateInput: (input: string) => boolean;
  scanForVulnerabilities: () => Promise<Array<string>>;
  monitorRequests: () => void;
}

export interface NetworkMonitor {
  getRequests: () => Array<{
    url: string;
    status: number;
    responseTime: number;
  }>;
}

// Viewport configuration types
export interface ViewportConfig {
  width: number;
  height: number;
}

export interface DeviceViewports {
  mobile: ViewportConfig;
  tablet: ViewportConfig;
  desktop: ViewportConfig;
  [key: string]: ViewportConfig;
}

// Test data types
export interface TestDataConfig {
  performance: {
    apiResponseThreshold: number;
    loadTimeThreshold: number;
    memoryThreshold: number;
  };
  viewports: DeviceViewports;
  security: {
    maxFileSize: number;
    allowedExtensions: string[];
  };
}

// Function parameter types for test callbacks
export interface PlaywrightTestArgs {
  page: Page;
}

export interface ExtendedTestArgs extends PlaywrightTestArgs, TestFixtures {}

// Test function type definitions
export type TestFunction<T = {}> = (args: T & ExtendedTestArgs) => Promise<void>;
export type BeforeEachFunction<T = {}> = (args: T & ExtendedTestArgs) => Promise<void>;
export type AfterEachFunction<T = {}> = (args: T & ExtendedTestArgs) => Promise<void>;

// Route handler types
export type RouteHandler = (route: Route) => Promise<void> | void;
export type ConsoleHandler = (msg: ConsoleMessage) => void;
export type RequestHandler = (request: Request) => void;
export type ResponseHandler = (response: Response) => void;