import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { ColorPicker } from '@/components';
import { presetColors } from '@/config/presetColors';
import state from '@/store';

interface SketchPickerProps {
  color: string;
  onChange: (color: { hex: string }) => void;
  presetColors: string[];
}

jest.mock('react-color', () => ({
  SketchPicker: ({ color, onChange, presetColors }: SketchPickerProps) => (
    <div data-testid='sketch-picker'>
      <div>Color: {color}</div>
      <button onClick={() => onChange({ hex: '#FFFFFF' })}>Change Color</button>
      <div data-testid='preset-colors'>{presetColors.join(',')}</div>
    </div>
  ),
}));

describe('ColorPicker', () => {
  beforeEach(() => {
    // Reset color before each test
    state.color = '#ccc';
  });

  it('renders the SketchPicker with correct color', () => {
    const { getByText } = render(<ColorPicker />);
    expect(getByText(`Color: ${state.color}`)).toBeInTheDocument();
  });

  it('updates state.color when color is changed', async () => {
    const { getByText } = render(<ColorPicker />);
    await act(async () => {
      fireEvent.click(getByText('Change Color'));
    });
    expect(state.color).toBe('#FFFFFF');
  });

  it('renders preset colors correctly', () => {
    const { getByTestId } = render(<ColorPicker />);
    const displayedColors = getByTestId('preset-colors').textContent;

    for (const color of presetColors) {
      expect(displayedColors).toContain(color);
    }
  });
});
