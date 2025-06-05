import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/app/**/*.{ts,tsx}',
    '<rootDir>/components/**/*.{ts,tsx}',
    '<rootDir>/canvas/**/*.{ts,tsx}',
    '<rootDir>/store/**/*.{ts,tsx}',
    '<rootDir>/config/**/*.{ts,tsx}',
    '<rootDir>/pages/**/*.{ts,tsx}',
  ],
  // Codecov-optimized coverage configuration
  coverageDirectory: './test-results/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  // Add test results output
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results/unit',
        outputName: 'junit.xml',
      },
    ],
  ],
  // FIXED: moduleNameMapper (was moduleNameMapping)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/', // ✅ ignore Playwright folder
  ],
  verbose: false,
  silent: true,
};

export default createJestConfig(customJestConfig);
