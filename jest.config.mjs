// jest.config.js
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
    '<rootDir>/lib/**/*.{ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
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
