import { render, fireEvent } from '@testing-library/react';
import { FilePicker } from '@/components';
import React from 'react';

describe('FilePicker', () => {
  let setFile: jest.Mock;
  let readFile: jest.Mock;

  beforeEach(() => {
    setFile = jest.fn();
    readFile = jest.fn();
  });

  it('renders file input, Logo and Full buttons', () => {
    const { getByLabelText, getByText } = render(
      <FilePicker
        file={null}
        setFile={setFile}
        readFile={readFile}
      />
    );
    expect(getByLabelText(/upload file/i)).toBeInTheDocument();
    expect(getByText('Logo')).toBeInTheDocument();
    expect(getByText('Full')).toBeInTheDocument();
  });

  it('calls setFile when a file is uploaded', () => {
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const { getByLabelText } = render(
      <FilePicker
        file={null}
        setFile={setFile}
        readFile={readFile}
      />
    );
    const input = getByLabelText(/upload file/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(setFile).toHaveBeenCalledWith(file);
  });

  it('calls readFile with "logo" when Logo button is clicked', () => {
    const { getByText } = render(
      <FilePicker
        file={null}
        setFile={setFile}
        readFile={readFile}
      />
    );
    const logoBtn = getByText('Logo');
    fireEvent.click(logoBtn);
    expect(readFile).toHaveBeenCalledWith('logo');
  });

  it('calls readFile with "full" when Full button is clicked', () => {
    const { getByText } = render(
      <FilePicker
        file={null}
        setFile={setFile}
        readFile={readFile}
      />
    );
    const fullBtn = getByText('Full');
    fireEvent.click(fullBtn);
    expect(readFile).toHaveBeenCalledWith('full');
  });

  it('displays filename when file is selected', () => {
    const file = new File(['abc'], 'my-image.jpg', { type: 'image/jpeg' });
    const { getByText } = render(
      <FilePicker
        file={file}
        setFile={setFile}
        readFile={readFile}
      />
    );
    expect(getByText('my-image.jpg')).toBeInTheDocument();
  });

  it('displays "No file selected" when no file is passed', () => {
    const { getByText } = render(
      <FilePicker
        file={null}
        setFile={setFile}
        readFile={readFile}
      />
    );
    expect(getByText(/no file selected/i)).toBeInTheDocument();
  });
});
