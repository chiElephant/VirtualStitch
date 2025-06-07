// __tests__/app/layout.test.tsx

import { metadata, viewport } from '@/app/layout';
import React from 'react';
import RootLayout from '@/app/layout';
import { render } from '@testing-library/react';

// Mock Next.js font imports
jest.mock('next/font/google', () => ({
  Geist: jest.fn(() => ({
    variable: '--font-geist-sans',
    subsets: ['latin'],
  })),
  Geist_Mono: jest.fn(() => ({
    variable: '--font-geist-mono',
    subsets: ['latin'],
  })),
}));

beforeEach(() => {
  // Clear mocks to ensure accurate call tracking
  jest.clearAllMocks();

  // Suppress the known Next.js warning about <html> inside <div> during testing
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('In HTML, <html> cannot be a child of <div>.')) {
      return;
    }
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RootLayout', () => {
  it('renders the child content', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid='child'>Hello World</div>
      </RootLayout>
    );
    expect(getByTestId('child')).toBeInTheDocument();
  });

  it('renders the component structure correctly', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid='test-content'>Test content</div>
      </RootLayout>
    );

    // Test that the children are rendered properly
    expect(container).toContainHTML(
      '<div data-testid="test-content">Test content</div>'
    );
  });

  it('has correct metadata exports', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Virtual Stitch');
    expect(metadata.description).toBe(
      'VirtualStitch is a custom apparel design platform by 303Devs LLC, offering intuitive tools to create, preview, and download unique shirt patterns.'
    );
  });

  it('has correct viewport exports', () => {
    expect(viewport).toBeDefined();
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
  });

  it('imports and uses fonts correctly', () => {
    // Simply test that the component renders without errors
    // The font imports are covered by importing the layout module
    expect(() => {
      render(
        <RootLayout>
          <div>Font test</div>
        </RootLayout>
      );
    }).not.toThrow();
  });
});
