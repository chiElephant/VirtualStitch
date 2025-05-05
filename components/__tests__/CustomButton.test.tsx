import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomButton } from '../index';
import state from '@/store';
import { getContrastingColor } from '@/config/helpers';

describe('CustomButton', () => {
  it('renders with label and triggers onClick', () => {
    const handleClick = jest.fn();
    render(
      <CustomButton
        type='filled'
        title='Download'
        handleClick={handleClick}
        customStyles=''
      />
    );

    const button = screen.getByText('Download');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders disabled button', () => {
    render(
      <CustomButton
        type='filled'
        title='Download'
        handleClick={jest.fn()}
        customStyles=''
        disabled={true}
      />
    );

    const button = screen.getByText('Download') as HTMLButtonElement;
    expect(button).toBeDisabled();
  });

  it('applies the correct style for filled type', () => {
    const { container } = render(
      <CustomButton
        type='filled'
        title='Download'
        handleClick={jest.fn()}
        customStyles=''
      />
    );
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).toHaveStyle(`background-color: ${state.color}`);
    expect(button).toHaveStyle(`color: ${getContrastingColor(state.color)}`);
  });

  it('applies the correct style for outlined type', () => {
    const { container } = render(
      <CustomButton
        type='outlined'
        title='Download'
        handleClick={jest.fn()}
        customStyles=''
      />
    );
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).toHaveStyle(`border-width: 1px`);
    expect(button).toHaveStyle(`border-color: ${state.color}`);
    expect(button).toHaveStyle(`color: ${state.color}`);
  });

  it('applies custom styles', () => {
    const { container } = render(
      <CustomButton
        type='filled'
        title='Download'
        handleClick={jest.fn()}
        customStyles='my-custom-style'
      />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('my-custom-style');
  });

  it('renders as enabled by default', () => {
    render(
      <CustomButton
        type='filled'
        title='Download'
        handleClick={jest.fn()}
        customStyles=''
      />
    );
    const button = screen.getByText('Download') as HTMLButtonElement;
    expect(button).not.toBeDisabled();
  });
});
