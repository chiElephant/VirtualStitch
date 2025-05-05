import * as Helpers from '../../config/helpers';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import Customizer from '../Customizer';
import state from '../../store';

// Mock getContrastingColor if needed
jest.mock('../../config/helpers', () => ({
  ...jest.requireActual('../../config/helpers'),
  getContrastingColor: () => '#ffffff',
  reader: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn();
  state.intro = false; // Ensure Customizer renders its main content
});

describe('Customizer', () => {
  it('should display warning toast when handleSubmit is called with empty prompt', async () => {
    const { getByTestId, container } = render(<Customizer />);
    const aiPickerTab = getByTestId('editor-tab-aiPicker');
    fireEvent.click(aiPickerTab);
    const aiLogoButton = getByTestId('ai-logo-button');
    fireEvent.click(aiLogoButton);
    await waitFor(() => {
      expect(container.querySelector('.Toastify__toast')?.textContent).toMatch(
        /Please enter a prompt/
      );
    });
  });

  it('should call handleSubmit with valid prompt', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ photo: 'mockedBase64Image' }),
    });
    const { getByTestId, container } = render(<Customizer />);
    const aiPickerTab = getByTestId('editor-tab-aiPicker');
    fireEvent.click(aiPickerTab);
    const promptInput = getByTestId('ai-prompt-input');
    fireEvent.change(promptInput, { target: { value: 'Mock prompt' } });
    const aiLogoButton = getByTestId('ai-logo-button');
    fireEvent.click(aiLogoButton);
    await waitFor(() => {
      expect(container.querySelector('.Toastify__toast')?.textContent).toMatch(
        /Image applied successfully/
      );
    });
  });

  it('should display error toast when handleSubmit encounters server error (429)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });
    const { getByTestId, container } = render(<Customizer />);
    const aiPickerTab = getByTestId('editor-tab-aiPicker');
    fireEvent.click(aiPickerTab);
    const promptInput = getByTestId('ai-prompt-input');
    fireEvent.change(promptInput, { target: { value: 'Mock prompt' } });
    const aiLogoButton = getByTestId('ai-logo-button');
    fireEvent.click(aiLogoButton);
    await waitFor(() => {
      expect(container.querySelector('.Toastify__toast')?.textContent).toMatch(
        /You are making requests too quickly/
      );
    });
  });

  it('should display error toast when handleSubmit encounters server error (500)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const { getByTestId, container } = render(<Customizer />);
    const aiPickerTab = getByTestId('editor-tab-aiPicker');
    fireEvent.click(aiPickerTab);
    const promptInput = getByTestId('ai-prompt-input');
    fireEvent.change(promptInput, { target: { value: 'Mock prompt' } });
    const aiLogoButton = getByTestId('ai-logo-button');
    fireEvent.click(aiLogoButton);
    await waitFor(() => {
      expect(container.querySelector('.Toastify__toast')?.textContent).toMatch(
        /Server error while generating the image/
      );
    });
  });

  it('should display error toast when handleSubmit encounters unexpected error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));
    const { getByTestId, container } = render(<Customizer />);
    const aiPickerTab = getByTestId('editor-tab-aiPicker');
    fireEvent.click(aiPickerTab);
    const promptInput = getByTestId('ai-prompt-input');
    fireEvent.change(promptInput, { target: { value: 'Mock prompt' } });
    const aiLogoButton = getByTestId('ai-logo-button');
    fireEvent.click(aiLogoButton);
    await waitFor(() => {
      expect(container.querySelector('.Toastify__toast')?.textContent).toMatch(
        /Failed to fetch image/
      );
    });
  });

  it('should display error toast when handleSubmit encounters an unexpected server error (403)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
    });
    const { getByTestId, container } = render(<Customizer />);
    const aiPickerTab = getByTestId('editor-tab-aiPicker');
    fireEvent.click(aiPickerTab);
    const promptInput = getByTestId('ai-prompt-input');
    fireEvent.change(promptInput, { target: { value: 'Mock prompt' } });
    const aiLogoButton = getByTestId('ai-logo-button');
    fireEvent.click(aiLogoButton);
    await waitFor(() => {
      expect(container.querySelector('.Toastify__toast')?.textContent).toMatch(
        /Unexpected error occurred/i
      );
    });
  });

  it('should set intro state to true and hide customizer content when Go Back is clicked', async () => {
    const { getByTestId, queryByTestId } = render(<Customizer />);
    const goBackButton = getByTestId('go-back-button');

    // Intro starts as false to show the main content
    expect(state.intro).toBe(false);
    expect(getByTestId('customizer-main')).toBeInTheDocument();

    // Click Go Back and wait for state to propagate
    await act(async () => {
      fireEvent.click(goBackButton);
    });

    // Now state.intro should be true
    expect(state.intro).toBe(true);

    // Wait for DOM to re-render
    await waitFor(() => {
      expect(queryByTestId('customizer-main')).not.toBeInTheDocument();
    });
  });

  it('should disable download button when default logo is selected', () => {
    const { getByTestId, getByRole } = render(<Customizer />);
    const imageDownloadTab = getByTestId('editor-tab-imageDownload');
    fireEvent.click(imageDownloadTab);
    const downloadLogoButton = getByRole('button', { name: /Download Logo/i });
    expect(downloadLogoButton).toBeDisabled();
  });

  it('should enable download button and reset filename after successful download with user image', async () => {
    const { getByTestId, getByRole } = render(<Customizer />);
    const imageDownloadTab = getByTestId('editor-tab-imageDownload');
    fireEvent.click(imageDownloadTab);
    const logoButton = getByRole('button', { name: /Logo/i });
    fireEvent.click(logoButton);
    // Add assertions related to enabling download button and resetting filename as needed
  });

  it('should check both Download Shirt and Download Logo buttons for disabled state', () => {
    const { getByTestId, getByRole } = render(<Customizer />);
    const imageDownloadTab = getByTestId('editor-tab-imageDownload');
    fireEvent.click(imageDownloadTab);
    const downloadShirtButton = getByRole('button', {
      name: /Download Shirt/i,
    });
    const downloadLogoButton = getByRole('button', { name: /Download Logo/i });
    expect(downloadShirtButton).toBeDisabled();
    expect(downloadLogoButton).toBeDisabled();
  });
});

it('should open ImageDownload tab and render it', () => {
  const { getByTestId } = render(<Customizer />);
  const imageDownloadTab = getByTestId('editor-tab-imageDownload');
  fireEvent.click(imageDownloadTab);
  // Check if ImageDownload component renders (adjust test ID if needed)
  expect(getByTestId('image-download')).toBeInTheDocument();
});

it('should handle file upload and call readFile', async () => {
  const { getByTestId, getByRole } = render(<Customizer />);
  const filePickerTab = getByTestId('editor-tab-filePicker');
  fireEvent.click(filePickerTab);

  const fileInput = getByTestId('file-picker-input');
  const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
  fireEvent.change(fileInput, { target: { files: [file] } });

  const logoButton = getByRole('button', { name: /Logo/i });
  fireEvent.click(logoButton);

  await waitFor(() => {
    expect(Helpers.reader).toHaveBeenCalled();
  });
});

it('should handle file upload and apply full texture decal', async () => {
  const { getByTestId, getByRole } = render(<Customizer />);
  const filePickerTab = getByTestId('editor-tab-filePicker');
  fireEvent.click(filePickerTab);

  const fileInput = getByTestId('file-picker-input');
  const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
  fireEvent.change(fileInput, { target: { files: [file] } });

  const fullButton = getByRole('button', { name: /Full/i });
  fireEvent.click(fullButton);

  await waitFor(() => {
    expect(Helpers.reader).toHaveBeenCalled();
    expect(state.isFullTexture).toBe(true);
    expect(state.isLogoTexture).toBe(false);
  });
});

it('should toggle logoShirt filter tab on click', () => {
  state.isLogoTexture = false;
  const { getByTestId } = render(<Customizer />);
  const logoTab = getByTestId('filter-tab-logoShirt');

  // Initially false
  expect(state.isLogoTexture).toBe(false);

  fireEvent.click(logoTab);

  expect(state.isLogoTexture).toBe(true);
});

it('should toggle stylishShirt filter tab on click', () => {
  state.isFullTexture = false;
  const { getByTestId } = render(<Customizer />);
  const stylishTab = getByTestId('filter-tab-stylishShirt');

  // Initially false
  expect(state.isFullTexture).toBe(false);

  fireEvent.click(stylishTab);

  expect(state.isFullTexture).toBe(true);
});

it('should not call reader if no file is selected and Logo is clicked', async () => {
  const { getByTestId, getByRole } = render(<Customizer />);
  const filePickerTab = getByTestId('editor-tab-filePicker');
  fireEvent.click(filePickerTab);

  // Do not select a file

  const logoButton = getByRole('button', { name: /Logo/i });
  fireEvent.click(logoButton);

  await waitFor(() => {
    expect(Helpers.reader).not.toHaveBeenCalled();
  });
});

it('should toggle the editor tab open and closed when clicking the same tab twice', async () => {
  const { getByTestId, queryByTestId } = render(<Customizer />);
  const aiPickerTab = getByTestId('editor-tab-aiPicker');

  // First click: open
  fireEvent.click(aiPickerTab);
  expect(getByTestId('ai-prompt-input')).toBeInTheDocument();

  // Second click: close
  fireEvent.click(aiPickerTab);

  await waitFor(() => {
    expect(queryByTestId('ai-prompt-input')).not.toBeInTheDocument();
  });
});
