import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import state from '@/store';

// Mock store
jest.mock('@/store', () => {
  const { proxy } = jest.requireActual('valtio');
  return {
    __esModule: true,
    default: proxy({
      intro: true,
      color: '#EFBD48',
      isLogoTexture: true,
      isFullTexture: false,
      logoDecal: './threejs.png',
      fullDecal: './threejs.png',
    }),
  };
});

// Simple mock for valtio
jest.mock('valtio', () => ({
  useSnapshot: jest.fn(() => ({
    intro: true,
    color: '#EFBD48',
    isLogoTexture: true,
    isFullTexture: false,
    logoDecal: './threejs.png',
    fullDecal: './threejs.png',
  })),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    section: 'section',
    header: 'header',
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
}));

// Mock Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement('img', props),
}));

// Mock CustomButton
jest.mock('@/components', () => ({
  CustomButton: ({
    title,
    handleClick,
  }: {
    title: string;
    handleClick?: () => void;
  }) =>
    React.createElement(
      'button',
      {
        'onClick': handleClick,
        'data-testid': 'custom-button',
      },
      title
    ),
}));

// Mock motion config
jest.mock('@/config/motion', () => ({
  headContainerAnimation: {},
  headContentAnimation: {},
  headTextAnimation: {},
  slideAnimation: () => ({}),
}));

// Import Home AFTER mocks
import Home from '@/pages/Home';

describe('Home component', () => {
  beforeEach(() => {
    // Reset state before each test
    state.intro = true;
  });

  it('renders correctly with intro true', () => {
    const { getByText } = render(React.createElement(Home));
    expect(getByText("LET'S DO IT.")).toBeInTheDocument();
  });

  it('renders custom button correctly', () => {
    const { getByTestId } = render(React.createElement(Home));
    const button = getByTestId('custom-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Customize It');
  });

  it('has correct src and alt on Image component', () => {
    const { getByAltText } = render(React.createElement(Home));
    const image = getByAltText('logo');
    expect(image).toHaveAttribute('src', '/icons/emblem.png');
  });

  // NEW TEST: This covers line 57 - the button click handler
  it('sets intro to false when Customize It button is clicked', () => {
    const { getByTestId } = render(React.createElement(Home));
    const button = getByTestId('custom-button');

    // Verify initial state
    expect(state.intro).toBe(true);

    // Click the button
    fireEvent.click(button);

    // Verify state changed (this covers line 57: handleClick={() => (state.intro = false)})
    expect(state.intro).toBe(false);
  });
});
