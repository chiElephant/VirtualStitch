import { render, screen } from '@testing-library/react';
import App from '@/app/page';

// Mock all the complex 3D components
jest.mock('@/canvas', () => ({
  __esModule: true,
  default: () => <div data-testid='canvas-model' />,
}));

jest.mock('@/canvas/Backdrop', () => ({
  __esModule: true,
  default: () => <div data-testid='backdrop' />,
}));

jest.mock('@/canvas/CameraRig', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='camera-rig'>{children}</div>
  ),
}));

jest.mock('@/canvas/Shirt', () => ({
  __esModule: true,
  default: () => <div data-testid='shirt' />,
}));

jest.mock('@/pages/Home', () => ({
  __esModule: true,
  default: () => <div data-testid='home-component' />,
}));

jest.mock('@/pages/Customizer', () => ({
  __esModule: true,
  default: () => <div data-testid='customizer-component' />,
}));

describe('App Page', () => {
  it('renders the Home, CanvasModel, and Customizer components correctly', () => {
    render(<App />);

    expect(screen.getByTestId('home-component')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-model')).toBeInTheDocument();
    expect(screen.getByTestId('customizer-component')).toBeInTheDocument();
  });
});
