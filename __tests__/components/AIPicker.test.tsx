import { render, screen, fireEvent } from '@testing-library/react';
import { AIPicker } from '@/components';

describe('AIPicker', () => {
  const setPromptMock = jest.fn();
  const handleSubmitMock = jest.fn();

  beforeEach(() => {
    setPromptMock.mockClear();
    handleSubmitMock.mockClear();
  });

  it('renders textarea with provided prompt', () => {
    render(
      <AIPicker
        prompt='Initial prompt'
        setPrompt={setPromptMock}
        generatingImg={false}
        handleSubmit={handleSubmitMock}
      />
    );
    expect(screen.getByPlaceholderText('Ask AI...')).toHaveValue(
      'Initial prompt'
    );
  });

  it('updates prompt when typing', () => {
    render(
      <AIPicker
        prompt=''
        setPrompt={setPromptMock}
        generatingImg={false}
        handleSubmit={handleSubmitMock}
      />
    );
    const textarea = screen.getByPlaceholderText('Ask AI...');
    fireEvent.change(textarea, { target: { value: 'New prompt' } });
    expect(setPromptMock).toHaveBeenCalledWith('New prompt');
  });

  it('renders both buttons when not generating image', () => {
    render(
      <AIPicker
        prompt=''
        setPrompt={setPromptMock}
        generatingImg={false}
        handleSubmit={handleSubmitMock}
      />
    );
    expect(screen.getByText('AI Logo')).toBeInTheDocument();
    expect(screen.getByText('AI Full')).toBeInTheDocument();
  });

  it('renders only the loading button when generating image', () => {
    render(
      <AIPicker
        prompt=''
        setPrompt={setPromptMock}
        generatingImg={true}
        handleSubmit={handleSubmitMock}
      />
    );
    expect(screen.getByText('Asking AI...')).toBeInTheDocument();
    expect(screen.queryByText('AI Logo')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Full')).not.toBeInTheDocument();
  });

  it('calls handleSubmit with "logo" when AI Logo button is clicked', () => {
    render(
      <AIPicker
        prompt=''
        setPrompt={setPromptMock}
        generatingImg={false}
        handleSubmit={handleSubmitMock}
      />
    );
    fireEvent.click(screen.getByText('AI Logo'));
    expect(handleSubmitMock).toHaveBeenCalledWith('logo');
  });

  it('calls handleSubmit with "full" when AI Full button is clicked', () => {
    render(
      <AIPicker
        prompt=''
        setPrompt={setPromptMock}
        generatingImg={false}
        handleSubmit={handleSubmitMock}
      />
    );
    fireEvent.click(screen.getByText('AI Full'));
    expect(handleSubmitMock).toHaveBeenCalledWith('full');
  });
});
