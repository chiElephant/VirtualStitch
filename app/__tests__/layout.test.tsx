import { metadata } from '../layout';
import React from 'react';
import RootLayout from '../layout';
import { render } from '@testing-library/react';

beforeEach(() => {
  // Suppress the known Next.js warning about <html> inside <div> during testing
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('In HTML, <html> cannot be a child of <div>.')) {
      return;
    }
  });
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

  it('has correct metadata (for SEO and app identity)', () => {
    expect(metadata.title).toBe('Virtual Stitch');
    expect(metadata.description).toBe('Design It. Wear It. Virtually Perfect.');
  });
});
