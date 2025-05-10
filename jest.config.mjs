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
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/', // ✅ ignore Playwright folder
  ],
  verbose: true,
};

export default createJestConfig(customJestConfig);
