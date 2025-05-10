import React from 'react';
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import CanvasModel from '@/canvas/index';

jest.mock('@react-three/fiber', () => {
  const actual = jest.requireActual('@react-three/fiber');
  return {
    ...actual,
    Canvas: jest.fn(({ children }) => (
      <div data-testid='mock-canvas'>{children}</div>
    )),
    AmbientLight: jest.fn(() => <div data-testid='mock-ambient-light' />),
  };
});
jest.mock('@react-three/drei', () => ({
  Environment: jest.fn(() => <div data-testid='mock-environment' />),
  Center: jest.fn(({ children }) => (
    <div data-testid='mock-center'>{children}</div>
  )),
}));
jest.mock('@/canvas/CameraRig', () =>
  jest.fn(({ children }) => <div data-testid='mock-camera-rig'>{children}</div>)
);
jest.mock('@/canvas/Backdrop', () =>
  jest.fn(() => <div data-testid='mock-backdrop' />)
);
jest.mock('@/canvas/Shirt', () =>
  jest.fn(() => <div data-testid='mock-shirt' />)
);

describe('CanvasModel', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<CanvasModel />);
    expect(getByTestId('mock-canvas')).toBeInTheDocument();
  });

  it('renders CameraRig, Backdrop, Center, Shirt, and Environment', () => {
    const { getByTestId } = render(<CanvasModel />);
    expect(getByTestId('mock-camera-rig')).toBeInTheDocument();
    expect(getByTestId('mock-backdrop')).toBeInTheDocument();
    expect(getByTestId('mock-center')).toBeInTheDocument();
    expect(getByTestId('mock-shirt')).toBeInTheDocument();
    expect(getByTestId('mock-environment')).toBeInTheDocument();
  });

  it('passes correct props to Canvas', () => {
    render(<CanvasModel />);
    const canvasProps = (Canvas as jest.Mock).mock.calls[0][0];
    expect(canvasProps).toEqual(
      expect.objectContaining({
        shadows: true,
        camera: { position: [0, 0, 5], fov: 35 },
        gl: { preserveDrawingBuffer: true },
        className: 'w-full max-w-full h-full transition-all ease-in',
      })
    );
  });
});
