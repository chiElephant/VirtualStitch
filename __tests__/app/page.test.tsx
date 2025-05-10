import { render, screen } from '@testing-library/react';
import App from '@/app/page';

describe('App Page', () => {
  it('renders the Home, CanvasModel, and Customizer components correctly', () => {
    render(<App />);

    expect(screen.getByTestId('home-component')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-model')).toBeInTheDocument();
    expect(screen.getByTestId('customizer')).toBeInTheDocument();
  });
});
