import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Tab } from '../index';

// Mock valtio state
const mockColor = '#ff0000';
jest.mock('../../store', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('valtio', () => ({
  useSnapshot: () => ({ color: mockColor }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

import type { StaticImageData } from 'next/image';
describe('Tab Component', () => {
  const tabObj = {
    name: 'TestTab',
    icon: '/icon.png' as unknown as StaticImageData,
  };

  it('Renders correctly with default props', () => {
    const handleClick = jest.fn();
    const { getByAltText } = render(
      <Tab
        tab={tabObj}
        handleClick={handleClick}
      />
    );
    const img = getByAltText('TestTab');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
  });

  it('Calls handleClick when clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Tab
        tab={tabObj}
        handleClick={handleClick}
      />
    );
    const div = container.querySelector('div');
    fireEvent.click(div!);
    expect(handleClick).toHaveBeenCalled();
  });

  it('Applies active styles when isFilterTab and isActiveTab are true', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Tab
        tab={tabObj}
        handleClick={handleClick}
        isFilterTab={true}
        isActiveTab={true}
      />
    );
    const div = container.querySelector('div');
    expect(div).toHaveStyle(`background-color: ${mockColor}`);
    expect(div).toHaveStyle('opacity: 0.5');
  });

  it('Applies default styles when isFilterTab is false', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Tab
        tab={tabObj}
        handleClick={handleClick}
      />
    );
    const div = container.querySelector('div');
    expect(div).toHaveStyle('background-color: transparent');
    expect(div).toHaveStyle('opacity: 1');
  });

  it('Renders correct classes based on isFilterTab', () => {
    const handleClick = jest.fn();
    // isFilterTab true
    const { container: c1 } = render(
      <Tab
        tab={tabObj}
        handleClick={handleClick}
        isFilterTab={true}
      />
    );
    const div1 = c1.querySelector('div');
    expect(div1?.className).toContain('tab-btn');
    expect(div1?.className).toContain('rounded-full');
    expect(div1?.className).toContain('glassmorphism');
    // isFilterTab false
    const { container: c2 } = render(
      <Tab
        tab={tabObj}
        handleClick={handleClick}
        isFilterTab={false}
      />
    );
    const div2 = c2.querySelector('div');
    expect(div2?.className).toContain('tab-btn');
    expect(div2?.className).toContain('rounded-4');
    expect(div2?.className).not.toContain('rounded-full');
    expect(div2?.className).not.toContain('glassmorphism');
  });
});
