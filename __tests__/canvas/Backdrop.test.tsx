import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Backdrop from '@/canvas/Backdrop';

// Mock @react-three/drei components
jest.mock('@react-three/drei', () => ({
  AccumulativeShadows: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='AccumulativeShadows'>{children}</div>
  ),
  RandomizedLight: (props: Record<string, unknown>) => (
    <div
      data-testid='RandomizedLight'
      {...props}
    />
  ),
}));

describe('Backdrop Component', () => {
  it('renders AccumulativeShadows and RandomizedLight components', () => {
    const { getByTestId, getAllByTestId } = render(<Backdrop />);

    const shadows = getByTestId('AccumulativeShadows');
    expect(shadows).toBeInTheDocument();

    const lights = getAllByTestId('RandomizedLight');
    expect(lights.length).toBe(2);
  });
});
