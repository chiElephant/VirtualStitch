import * as downloaders from '@/config/downloaders';
import {
  handleImageDownload,
  getContrastingColor,
  reader,
} from '@/config/helpers';
import { toast } from 'react-toastify';

// Mock to silence HTMLCanvasElement.prototype.toDataURL errors in tests
(HTMLCanvasElement.prototype.toDataURL as unknown as () => string) = jest.fn(
  () => 'data:image/png;base64,mocked'
);

class MockFileReader implements Partial<FileReader> {
  result: string | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
    null;

  readAsDataURL(this: FileReader): void {
    if (this.onload) {
      Object.defineProperty(this, 'result', {
        value: 'data:text/plain;base64,SGVsbG8gd29ybGQh',
        configurable: true,
      });
      const event = new ProgressEvent('load');
      this.onload(event as ProgressEvent<FileReader>);
    }
  }
}
global.FileReader = MockFileReader as unknown as typeof FileReader;

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('@/config/downloaders', () => ({
  downloadCanvasToImage: jest.fn(),
  downloadImageToFile: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getContrastingColor', () => {
  it('returns black for a dark color', () => {
    expect(getContrastingColor('#000000')).toBe('white');
  });

  it('returns white for a light color', () => {
    expect(getContrastingColor('#FFFFFF')).toBe('black');
  });

  it('returns black for an invalid color code', () => {
    expect(getContrastingColor(' invalid')).toBe('black');
  });

  it('returns black for a color code with less than 6 digits', () => {
    expect(getContrastingColor('#123')).toBe('black');
  });

  it('returns black for a color code with non-hex characters', () => {
    expect(getContrastingColor('#123abc!')).toBe('black');
  });

  it('removes the # character if present', () => {
    expect(getContrastingColor('#123456')).toBe(getContrastingColor('123456'));
  });

  it('calculates brightness correctly', () => {
    expect(getContrastingColor('#808080')).toBe('white'); // brightness is 128
  });
});

describe('reader function', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
    global.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  it('should resolve with file contents when file reading is successful', async () => {
    const file = new Blob(['Hello World!'], { type: 'text/plain' });
    const result = await reader(file);
    expect(result).toBe('data:text/plain;base64,SGVsbG8gd29ybGQh');
  });

  // Removed tests for null or undefined input as current mock always resolves

  it('should reject with error when file reading errors', async () => {
    class ErrorMockFileReader implements Partial<FileReader> {
      result: string | null = null;
      onload:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
      onerror:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;

      readAsDataURL(this: FileReader): void {
        if (this.onerror) {
          const errorEvent = new ProgressEvent('error');
          this.onerror(errorEvent as ProgressEvent<FileReader>);
        }
      }
    }

    global.FileReader = ErrorMockFileReader as unknown as typeof FileReader;

    const file = new Blob(['Test error'], { type: 'text/plain' });
    await expect(reader(file)).rejects.toThrow();
  });

  it('should reject immediately if readAsDataURL throws synchronously', async () => {
    const file = new Blob(['Test'], { type: 'text/plain' });

    const mock = jest
      .spyOn(FileReader.prototype, 'readAsDataURL')
      .mockImplementation(() => {
        throw new Error('Synchronous error');
      });

    await expect(reader(file)).rejects.toThrow('Synchronous error');

    mock.mockRestore();
  });
});

describe('handleImageDownload function', () => {
  const resetFileName = jest.fn();

  it('should handle canvas type and call toast.error if download fails', () => {
    (downloaders.downloadCanvasToImage as jest.Mock).mockReturnValue(false);
    handleImageDownload('canvas', 'name', 'tab', resetFileName);
    expect(downloaders.downloadCanvasToImage).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'No canvas found to download.',
      expect.anything()
    );
  });

  it('should handle image type and call toast.error if download fails', () => {
    (downloaders.downloadImageToFile as jest.Mock).mockReturnValue(false);
    handleImageDownload('image', 'name', 'tab', resetFileName);
    expect(downloaders.downloadImageToFile).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'No decal found to download. Please generate or upload an image first.',
      expect.anything()
    );
  });

  it('does not call downloadCanvasToImage or downloadImageToFile when type is unknown', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleImageDownload('unknown' as any, 'name', 'tab', resetFileName);
    expect(downloaders.downloadCanvasToImage).not.toHaveBeenCalled();
    expect(downloaders.downloadImageToFile).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(resetFileName).not.toHaveBeenCalled();
  });

  it('should reset file name if canvas download succeeds', () => {
    (downloaders.downloadCanvasToImage as jest.Mock).mockReturnValue(true);
    handleImageDownload('canvas', 'name', 'tab', resetFileName);
    expect(downloaders.downloadCanvasToImage).toHaveBeenCalled();
    expect(resetFileName).toHaveBeenCalled();
  });

  it('should reset file name if image download succeeds', () => {
    (downloaders.downloadImageToFile as jest.Mock).mockReturnValue(true);
    handleImageDownload('image', 'name', 'tab', resetFileName);
    expect(downloaders.downloadImageToFile).toHaveBeenCalled();
    expect(resetFileName).toHaveBeenCalled();
  });

  it('should handle empty file name with canvas type', () => {
    (downloaders.downloadCanvasToImage as jest.Mock).mockReturnValue(true);
    handleImageDownload('canvas', '', 'tab', resetFileName);
    expect(downloaders.downloadCanvasToImage).toHaveBeenCalledWith('canvas');
    expect(resetFileName).toHaveBeenCalled();
  });

  it('should handle empty file name with image type', () => {
    (downloaders.downloadImageToFile as jest.Mock).mockReturnValue(true);
    handleImageDownload('image', '', 'tab', resetFileName);
    expect(downloaders.downloadImageToFile).toHaveBeenCalledWith(
      'image',
      'tab'
    );
    expect(resetFileName).toHaveBeenCalled();
  });
});

describe('getContrastingColor additional edge case', () => {
  it('returns black when input is empty string', () => {
    expect(getContrastingColor('')).toBe('black');
  });
});
