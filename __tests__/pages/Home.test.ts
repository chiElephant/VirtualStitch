// __tests__/pages/Home.test.ts
import { render } from '@testing-library/react';
import React from 'react';

// Mock store
jest.mock('@/store', () => ({
  __esModule: true,
  default: {
    intro: true,
    color: '#EFBD48',
    isLogoTexture: true,
    isFullTexture: false,
    logoDecal: './threejs.png',
    fullDecal: './threejs.png',
  },
}));

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
});
