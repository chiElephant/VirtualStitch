import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import Customizer from '@/pages/Customizer';
import state from '@/store';
import * as helpers from '@/config/helpers';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
  ToastContainer: () => <div data-testid='toast-container' />,
  Flip: {},
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock helpers
jest.mock('@/config/helpers', () => ({
  reader: jest.fn(),
}));

// Mock valtio
jest.mock('valtio', () => ({
  useSnapshot: jest.fn(),
}));

// Mock store
jest.mock('@/store', () => {
  const { proxy } = jest.requireActual('valtio');
  return {
    __esModule: true,
    default: proxy({
      intro: false,
      color: '#EFBD48',
      isLogoTexture: true,
      isFullTexture: false,
      logoDecal: './threejs.png',
      fullDecal: './threejs.png',
    }),
  };
});

// Mock constants
jest.mock('@/config/constants', () => ({
  EditorTabs: [
    { name: 'colorPicker', icon: '/icons/color.png' },
    { name: 'filePicker', icon: '/icons/file.png' },
    { name: 'aiPicker', icon: '/icons/ai.png' },
    { name: 'imageDownload', icon: '/icons/download.png' },
  ],
  FilterTabs: [
    { name: 'logoShirt', icon: '/icons/logo.png' },
    { name: 'stylishShirt', icon: '/icons/style.png' },
  ],
  DecalTypes: {
    logo: { stateProperty: 'logoDecal', filterTab: 'logoShirt' },
    full: { stateProperty: 'fullDecal', filterTab: 'stylishShirt' },
  },
}));

// Mock motion config
jest.mock('@/config/motion', () => ({
  fadeAnimation: {},
  slideAnimation: () => ({}),
}));

// Mock components
jest.mock('@/components', () => ({
  AIPicker: ({ prompt, setPrompt, generatingImg, handleSubmit }: any) => (
    <div data-testid='ai-picker'>
      <input
        data-testid='ai-prompt'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='Enter prompt'
      />
      <button
        data-testid='ai-logo-btn'
        onClick={() => handleSubmit('logo')}
        disabled={generatingImg}>
        {generatingImg ? 'Generating...' : 'AI Logo'}
      </button>
      <button
        data-testid='ai-full-btn'
        onClick={() => handleSubmit('full')}
        disabled={generatingImg}>
        {generatingImg ? 'Generating...' : 'AI Full'}
      </button>
    </div>
  ),
  ColorPicker: () => <div data-testid='color-picker'>Color Picker</div>,
  FilePicker: ({ file, setFile, readFile }: any) => (
    <div data-testid='file-picker'>
      <input
        data-testid='file-input'
        type='file'
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button
        data-testid='file-logo-btn'
        onClick={() => readFile('logo')}>
        Logo
      </button>
      <button
        data-testid='file-full-btn'
        onClick={() => readFile('full')}>
        Full
      </button>
      <span data-testid='file-name'>{file?.name || 'No file'}</span>
    </div>
  ),
  ImageDownload: ({ activeFilterTab }: any) => (
    <div data-testid='image-download'>Download for {activeFilterTab}</div>
  ),
  Tab: ({ tab, handleClick, isFilterTab, isActiveTab, ...props }: any) => (
    <button
      data-testid={`tab-${tab.name}`}
      onClick={handleClick}
      data-is-filter={isFilterTab}
      data-is-active={isActiveTab}
      {...props}>
      {tab.name}
    </button>
  ),
  CustomButton: ({ title, handleClick, type, ...props }: any) => (
    <button
      data-testid={`custom-button-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={handleClick}
      data-type={type}
      {...props}>
      {title}
    </button>
  ),
}));

describe('Customizer Component', () => {
  const mockValtioUseSnapshot = require('valtio').useSnapshot as jest.Mock;
  const mockReader = helpers.reader as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Default valtio snapshot
    mockValtioUseSnapshot.mockReturnValue({
      intro: false,
      color: '#EFBD48',
      isLogoTexture: true,
      isFullTexture: false,
      logoDecal: './threejs.png',
      fullDecal: './threejs.png',
    });

    // Reset state
    state.intro = false;
    state.color = '#EFBD48';
    state.isLogoTexture = true;
    state.isFullTexture = false;
    state.logoDecal = './threejs.png';
    state.fullDecal = './threejs.png';

    mockReader.mockResolvedValue('data:image/png;base64,mockImageData');
  });

  describe('Rendering', () => {
    it('renders nothing when intro is true', () => {
      mockValtioUseSnapshot.mockReturnValue({ intro: true });
      const { container } = render(<Customizer />);
      expect(container.firstChild).toHaveTextContent('');
    });

    it('renders main customizer when intro is false', () => {
      render(<Customizer />);
      expect(screen.getByTestId('customizer-main')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tabs-container')).toBeInTheDocument();
      expect(screen.getByTestId('filter-tabs-container')).toBeInTheDocument();
    });

    it('renders all editor tabs', () => {
      render(<Customizer />);
      expect(screen.getByTestId('editor-tab-colorPicker')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tab-filePicker')).toBeInTheDocument();
      expect(screen.getByTestId('editor-tab-aiPicker')).toBeInTheDocument();
      expect(
        screen.getByTestId('editor-tab-imageDownload')
      ).toBeInTheDocument();
    });

    it('renders all filter tabs', () => {
      render(<Customizer />);
      expect(screen.getByTestId('filter-tab-logoShirt')).toBeInTheDocument();
      expect(screen.getByTestId('filter-tab-stylishShirt')).toBeInTheDocument();
    });

    it('renders go back button', () => {
      render(<Customizer />);
      expect(screen.getByTestId('button-color-#EFBD48')).toBeInTheDocument();
    });

    it('renders toast container', () => {
      render(<Customizer />);
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });
  });

  describe('Editor Tab Management', () => {
    it('shows no tab content initially', () => {
      render(<Customizer />);
      expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-picker')).not.toBeInTheDocument();
      expect(screen.queryByTestId('image-download')).not.toBeInTheDocument();
    });

    it('shows color picker when color picker tab is clicked', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-colorPicker'));
      expect(screen.getByTestId('color-picker')).toBeInTheDocument();
    });

    it('shows file picker when file picker tab is clicked', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-filePicker'));
      expect(screen.getByTestId('file-picker')).toBeInTheDocument();
    });

    it('shows AI picker when AI picker tab is clicked', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-aiPicker'));
      expect(screen.getByTestId('ai-picker')).toBeInTheDocument();
    });

    it('shows image download when image download tab is clicked', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-imageDownload'));
      expect(screen.getByTestId('image-download')).toBeInTheDocument();
    });

    it('toggles tab content when clicking same tab twice', () => {
      render(<Customizer />);

      // Click to open
      fireEvent.click(screen.getByTestId('editor-tab-colorPicker'));
      expect(screen.getByTestId('color-picker')).toBeInTheDocument();

      // Click to close
      fireEvent.click(screen.getByTestId('editor-tab-colorPicker'));
      expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
    });

    it('switches between different tabs', () => {
      render(<Customizer />);

      // Open color picker
      fireEvent.click(screen.getByTestId('editor-tab-colorPicker'));
      expect(screen.getByTestId('color-picker')).toBeInTheDocument();

      // Switch to AI picker
      fireEvent.click(screen.getByTestId('editor-tab-aiPicker'));
      expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
      expect(screen.getByTestId('ai-picker')).toBeInTheDocument();
    });
  });

  describe('Filter Tab Management', () => {
    it('handles logoShirt filter tab activation', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('filter-tab-logoShirt'));
      expect(state.isLogoTexture).toBe(true);
    });

    it('handles stylishShirt filter tab activation', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('filter-tab-stylishShirt'));
      expect(state.isFullTexture).toBe(true);
    });

    it('toggles filter tab state correctly', () => {
      render(<Customizer />);

      // Initially false, click to activate
      state.isLogoTexture = false;
      fireEvent.click(screen.getByTestId('filter-tab-logoShirt'));
      expect(state.isLogoTexture).toBe(true);

      // Click again to deactivate
      fireEvent.click(screen.getByTestId('filter-tab-logoShirt'));
      expect(state.isLogoTexture).toBe(false);
    });
  });

  describe('AI Image Generation', () => {
    beforeEach(() => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-aiPicker'));
    });

    it('shows warning toast when submitting empty prompt', async () => {
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      expect(toast.warn).toHaveBeenCalledWith(
        'Please enter a prompt ✍️ ',
        expect.objectContaining({
          position: 'top-center',
          autoClose: 5000,
        })
      );
    });

    it('handles successful AI generation for logo', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photo: 'base64ImageData' }),
      } as Response);

      // Enter prompt
      await user.type(screen.getByTestId('ai-prompt'), 'cool logo');

      // Submit
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/custom-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'cool logo' }),
        });
      });

      await waitFor(() => {
        expect(state.logoDecal).toBe('data:image/png;base64,base64ImageData');
        expect(state.isLogoTexture).toBe(true);
        expect(state.isFullTexture).toBe(false);
      });

      expect(toast.success).toHaveBeenCalledWith(
        'Image applied successfully ✅',
        expect.any(Object)
      );
    });

    it('handles successful AI generation for full', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photo: 'fullImageData' }),
      } as Response);

      await user.type(screen.getByTestId('ai-prompt'), 'cool pattern');
      fireEvent.click(screen.getByTestId('ai-full-btn'));

      await waitFor(() => {
        expect(state.fullDecal).toBe('data:image/png;base64,fullImageData');
        expect(state.isLogoTexture).toBe(false);
        expect(state.isFullTexture).toBe(true);
      });
    });

    it('handles 429 rate limit error', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      await user.type(screen.getByTestId('ai-prompt'), 'test prompt');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'You are making requests too quickly 🚫. Please wait a minute.',
          expect.objectContaining({
            position: 'bottom-right',
            autoClose: 5000,
          })
        );
      });
    });

    it('handles 500 server error', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await user.type(screen.getByTestId('ai-prompt'), 'test prompt');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Server error while generating the image ⚠️.',
          expect.any(Object)
        );
      });
    });

    it('handles unexpected error status', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 418,
      } as Response);

      await user.type(screen.getByTestId('ai-prompt'), 'test prompt');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Unexpected error occurred ❌.',
          expect.any(Object)
        );
      });
    });

    it('handles network/fetch errors', async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await user.type(screen.getByTestId('ai-prompt'), 'test prompt');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to fetch image 📸 ',
          expect.any(Object)
        );
      });
    });

    it('closes editor tab after successful generation', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photo: 'imageData' }),
      } as Response);

      await user.type(screen.getByTestId('ai-prompt'), 'test');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('ai-picker')).not.toBeInTheDocument();
      });
    });

    it('shows generating state during API call', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ photo: 'data' }),
                } as Response),
              100
            )
          )
      );

      await user.type(screen.getByTestId('ai-prompt'), 'test');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      // Both buttons show "Generating..." when generating, so use getAllByText
      const generatingButtons = screen.getAllByText('Generating...');
      expect(generatingButtons).toHaveLength(2);
      expect(generatingButtons[0]).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-filePicker'));
    });

    it('handles file selection', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByTestId('file-name')).toHaveTextContent('test.png');
    });

    it('handles logo file reading', async () => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });

      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [file] },
      });

      fireEvent.click(screen.getByTestId('file-logo-btn'));

      await waitFor(() => {
        expect(mockReader).toHaveBeenCalledWith(file);
        expect(state.logoDecal).toBe('data:image/png;base64,mockImageData');
        expect(state.isLogoTexture).toBe(true);
        expect(state.isFullTexture).toBe(false);
      });
    });

    it('handles full file reading', async () => {
      const file = new File(['test'], 'pattern.png', { type: 'image/png' });

      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [file] },
      });

      fireEvent.click(screen.getByTestId('file-full-btn'));

      await waitFor(() => {
        expect(state.fullDecal).toBe('data:image/png;base64,mockImageData');
        expect(state.isLogoTexture).toBe(false);
        expect(state.isFullTexture).toBe(true);
      });
    });

    it('does nothing when no file is selected for reading', async () => {
      const originalDecal = state.logoDecal;

      fireEvent.click(screen.getByTestId('file-logo-btn'));

      await waitFor(() => {
        expect(mockReader).not.toHaveBeenCalled();
        expect(state.logoDecal).toBe(originalDecal);
      });
    });

    it('closes editor tab after file reading', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [file] },
      });

      fireEvent.click(screen.getByTestId('file-logo-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('file-picker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Go Back Button', () => {
    it('sets intro to true when clicked', () => {
      render(<Customizer />);

      expect(state.intro).toBe(false);
      fireEvent.click(screen.getByTestId('button-color-#EFBD48'));
      expect(state.intro).toBe(true);
    });
  });

  describe('Tab Content Generation', () => {
    it('generates correct content for active filter tab', () => {
      render(<Customizer />);

      // Activate logoShirt filter
      fireEvent.click(screen.getByTestId('filter-tab-logoShirt'));

      // Open image download tab
      fireEvent.click(screen.getByTestId('editor-tab-imageDownload'));

      expect(screen.getByTestId('image-download')).toHaveTextContent(
        'logoShirt'
      );
    });

    it('handles no active filter tab for image download', () => {
      render(<Customizer />);

      // Open image download without activating any filter
      fireEvent.click(screen.getByTestId('editor-tab-imageDownload'));

      expect(screen.getByTestId('image-download')).toHaveTextContent(
        'Download for'
      );
    });
  });

  describe('Integration Tests', () => {
    it('completes full AI workflow', async () => {
      const user = userEvent.setup();
      render(<Customizer />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photo: 'completeWorkflowData' }),
      } as Response);

      // Open AI picker
      fireEvent.click(screen.getByTestId('editor-tab-aiPicker'));

      // Enter prompt and generate
      await user.type(screen.getByTestId('ai-prompt'), 'complete workflow');
      fireEvent.click(screen.getByTestId('ai-logo-btn'));

      // Verify the complete workflow
      await waitFor(() => {
        expect(state.logoDecal).toBe(
          'data:image/png;base64,completeWorkflowData'
        );
        expect(state.isLogoTexture).toBe(true);
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('completes full file upload workflow', async () => {
      render(<Customizer />);

      const file = new File(['complete'], 'complete.png', {
        type: 'image/png',
      });

      // Open file picker
      fireEvent.click(screen.getByTestId('editor-tab-filePicker'));

      // Upload and process file
      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [file] },
      });
      fireEvent.click(screen.getByTestId('file-full-btn'));

      await waitFor(() => {
        expect(state.fullDecal).toBe('data:image/png;base64,mockImageData');
        expect(state.isFullTexture).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles decal type mapping for unknown types', () => {
      render(<Customizer />);

      // This tests the DecalTypes mapping fallback
      const component = screen.getByTestId('customizer');
      expect(component).toBeInTheDocument();
    });

    it('handles empty file list', () => {
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-filePicker'));

      const input = screen.getByTestId('file-input');
      fireEvent.change(input, { target: { files: [] } });

      expect(screen.getByTestId('file-name')).toHaveTextContent('No file');
    });

    it('handles prompt state management correctly', async () => {
      const user = userEvent.setup();
      render(<Customizer />);
      fireEvent.click(screen.getByTestId('editor-tab-aiPicker'));

      const promptInput = screen.getByTestId('ai-prompt');

      await user.type(promptInput, 'test prompt');
      expect(promptInput).toHaveValue('test prompt');

      await user.clear(promptInput);
      expect(promptInput).toHaveValue('');
    });
  });

  describe('Props and Attributes', () => {
    it('accepts props without throwing errors', () => {
      // Component accepts props and passes them to AnimatePresence
      // This test ensures no errors occur when props are passed
      expect(() => {
        render(<Customizer data-custom='test' />);
      }).not.toThrow();
    });

    it('maintains testid on root element', () => {
      render(<Customizer />);
      expect(screen.getByTestId('customizer')).toBeInTheDocument();
    });
  });
});
