// jest.config.js
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/app/**/*.{ts,tsx}',
    '<rootDir>/components/**/*.{ts,tsx}',
    '<rootDir>/canvas/**/*.{ts,tsx}',
    '<rootDir>/store/**/*.{ts,tsx}',
    '<rootDir>/config/**/*.{ts,tsx}',
    '<rootDir>/pages/**/*.{ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(customJestConfig);
