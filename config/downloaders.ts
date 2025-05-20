import state from '@/store';
import { DEFAULT_LOGO, DEFAULT_FULL } from '@/config/constants';

/**
 * Downloads the current shirt image (logo or full) to a file.
 * Returns false if the decal is missing or still the default image.
 */
export const downloadImageToFile = (
  fileName: string = 'image',
  activeTab: string
): boolean => {
  let decalUrl: string | null = null;

  if (activeTab === 'logoShirt') {
    decalUrl = state.logoDecal;
    // Don't download if the decal is missing or it's the default logo
    if (!decalUrl || decalUrl === DEFAULT_LOGO) {
      return false;
    }
  } else if (activeTab === 'stylishShirt') {
    decalUrl = state.fullDecal;
    // Don't download if the decal is missing or it's the default full image
    if (!decalUrl || decalUrl === DEFAULT_FULL) {
      return false;
    }
  } else {
    // If activeTab is not recognized, do not attempt download
    return false;
  }

  // Create a temporary <a> tag to trigger the download
  const link = document.createElement('a');
  link.href = decalUrl;
  const safeFileName = fileName.trim() ? `${fileName.trim()}.png` : 'image.png';
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

/**
 * Downloads the current canvas content as a PNG image file.
 * Returns false if no canvas element is found.
 */
export const downloadCanvasToImage = (fileName: string = 'canvas'): boolean => {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    return false;
  }

  let dataURL = '';
  try {
    // Convert canvas contents to a base64 image string
    dataURL = canvas.toDataURL();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // If toDataURL fails (e.g. due to tainted canvas), return false
    return false;
  }

  // Use an <a> tag to simulate a download action
  const link = document.createElement('a');
  const safeFileName =
    fileName.trim() ? `${fileName.trim()}.png` : 'canvas.png';
  link.href = dataURL || '';
  link.download = safeFileName;
  document.body.appendChild(link);

  try {
    // Attempt to trigger the download
    link.click();
  } catch {
    // Ignore any errors thrown by click() to avoid crash
  } finally {
    // Clean up the DOM by removing the link
    document.body.removeChild(link);
  }
  return true;
};
