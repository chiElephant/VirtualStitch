import { render, screen } from '@testing-library/react';
import Customizer from '@/pages/Customizer';

// Simple mock for store
jest.mock('@/store', () => ({
  __esModule: true,
  default: {
    intro: false, // Show customizer
    color: '#EFBD48',
    isLogoTexture: true,
    isFullTexture: false,
    logoDecal: './threejs.png',
    fullDecal: './threejs.png',
  },
}));

// Mock valtio
jest.mock('valtio', () => ({
  useSnapshot: jest.fn(() => ({
    intro: false,
    color: '#EFBD48',
    isLogoTexture: true,
    isFullTexture: false,
    logoDecal: './threejs.png',
    fullDecal: './threejs.png',
  })),
}));

// Mock all the complex components to avoid TextEncoder issues
jest.mock('@/components', () => ({
  ColorPicker: () => <div data-testid='color-picker' />,
  FilePicker: () => <div data-testid='file-picker' />,
  AIPicker: () => <div data-testid='ai-picker' />,
  ImageDownload: () => <div data-testid='image-download' />,
  Tab: () => <div data-testid='tab' />,
  CustomButton: ({ title }: { title: string }) => (
    <button data-testid='custom-button'>{title}</button>
  ),
}));

describe('Customizer', () => {
  it('renders without crashing', () => {
    render(<Customizer />);
    expect(screen.getByTestId('customizer')).toBeInTheDocument();
  });
});
