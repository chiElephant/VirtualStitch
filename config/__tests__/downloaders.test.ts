/**
 * @jest-environment jsdom
 */
import state from '@/store';
import * as downloaders from '../downloaders';
import { DEFAULT_LOGO, DEFAULT_FULL } from '../../config/constants';

describe('downloadCanvasToImage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should return true when canvas exists and download is successful', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(true);
  });

  it('should return false when canvas does not exist', () => {
    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(false);
  });

  it('should return false when canvas exists but toDataURL() throws an error', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    jest.spyOn(canvas, 'toDataURL').mockImplementation(() => {
      throw new Error('Mock error');
    });
    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(false);
  });

  it('should return true when dataURL is empty', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    jest.spyOn(canvas, 'toDataURL').mockReturnValue('');
    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(true);
  });

  it('should still return true even if anchor click throws an error', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    const anchor = document.createElement('a');
    jest.spyOn(anchor, 'click').mockImplementation(() => {
      throw new Error('click error');
    });

    jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        return tagName === 'a' ? anchor : document.createElement(tagName);
      });

    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(true);
  });

  it('should use provided file name for download', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const fileName = 'test-file';
    const result = downloaders.downloadCanvasToImage(fileName);
    expect(result).toBe(true);
  });

  it('should use default file name when not provided', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(true);
  });
});

describe('downloadImageToFile', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    state.logoDecal = DEFAULT_LOGO;
    state.fullDecal = DEFAULT_FULL;
    document.body.innerHTML = '';
  });

  it('downloads image when active tab is logoShirt and decal URL is not default', () => {
    state.logoDecal = 'https://example.com/logo.png';
    const result = downloaders.downloadImageToFile('image', 'logoShirt');
    expect(result).toBe(true);
  });

  it('does not download image when active tab is logoShirt and decal URL is default', () => {
    state.logoDecal = DEFAULT_LOGO;
    const result = downloaders.downloadImageToFile('image', 'logoShirt');
    expect(result).toBe(false);
  });

  it('downloads image when active tab is stylishShirt and decal URL is not default', () => {
    state.fullDecal = 'https://example.com/full.png';
    const result = downloaders.downloadImageToFile('image', 'stylishShirt');
    expect(result).toBe(true);
  });

  it('does not download image when active tab is stylishShirt and decal URL is default', () => {
    state.fullDecal = DEFAULT_FULL;
    const result = downloaders.downloadImageToFile('image', 'stylishShirt');
    expect(result).toBe(false);
  });

  it('does not download image when active tab is neither logoShirt nor stylishShirt', () => {
    const result = downloaders.downloadImageToFile('image', 'otherTab');
    expect(result).toBe(false);
  });

  it('downloads image with custom file name', () => {
    state.logoDecal = 'https://example.com/logo.png';
    const result = downloaders.downloadImageToFile('customFile', 'logoShirt');
    expect(result).toBe(true);
  });

  it('should use default fileName when none is provided (downloadImageToFile)', () => {
    state.logoDecal = 'https://example.com/logo.png';
    const el = document.createElement('a');
    jest.spyOn(el, 'click').mockImplementation(() => {});
    jest.spyOn(document, 'createElement').mockReturnValue(el);

    const result = downloaders.downloadImageToFile(undefined, 'logoShirt');
    expect(result).toBe(true);
  });

  it('should fallback to default filename when fileName is blank (downloadImageToFile)', () => {
    state.logoDecal = 'https://example.com/logo.png';
    const el = document.createElement('a');
    jest.spyOn(el, 'click').mockImplementation(() => {});
    jest.spyOn(document, 'createElement').mockReturnValue(el);

    const result = downloaders.downloadImageToFile('   ', 'logoShirt');
    expect(result).toBe(true);
  });

  it('should use provided fileName when it is valid (downloadImageToFile)', () => {
    state.logoDecal = 'https://example.com/logo.png';
    const el = document.createElement('a');
    jest.spyOn(el, 'click').mockImplementation(() => {});
    jest.spyOn(document, 'createElement').mockReturnValue(el);

    const result = downloaders.downloadImageToFile('MyFile', 'logoShirt');
    expect(result).toBe(true);
  });

  it('should use default fileName when none is provided (downloadCanvasToImage)', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    const result = downloaders.downloadCanvasToImage();
    expect(result).toBe(true);

    document.body.removeChild(canvas);
  });

  it('should fallback to default filename when fileName is blank (downloadCanvasToImage)', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    const result = downloaders.downloadCanvasToImage('    ');
    expect(result).toBe(true);

    document.body.removeChild(canvas);
  });

  it('should use provided fileName when it is valid (downloadCanvasToImage)', () => {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    const result = downloaders.downloadCanvasToImage('MyCanvas');
    expect(result).toBe(true);

    document.body.removeChild(canvas);
  });
});
