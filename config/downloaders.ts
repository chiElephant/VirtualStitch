import state from '@/store';
import { DEFAULT_LOGO, DEFAULT_FULL } from '@/config/constants';

export const downloadImageToFile = (
  fileName: string = 'image',
  activeTab: string
): boolean => {
  let decalUrl: string | null = null;

  if (activeTab === 'logoShirt') {
    decalUrl = state.logoDecal;
    // Prevent downloading if it's still the default image
    if (!decalUrl || decalUrl === DEFAULT_LOGO) {
      return false;
    }
  } else if (activeTab === 'stylishShirt') {
    decalUrl = state.fullDecal;
    // Prevent downloading if it's still the default image
    if (!decalUrl || decalUrl === DEFAULT_FULL) {
      return false;
    }
  } else {
    return false;
  }

  const link = document.createElement('a');
  link.href = decalUrl;
  const safeFileName = fileName.trim() ? `${fileName.trim()}.png` : 'image.png';
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

export const downloadCanvasToImage = (fileName: string = 'canvas'): boolean => {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    return false;
  }
  let dataURL = '';
  try {
    dataURL = canvas.toDataURL();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
  const link = document.createElement('a');
  const safeFileName =
    fileName.trim() ? `${fileName.trim()}.png` : 'canvas.png';

  link.href = dataURL || '';
  link.download = safeFileName;
  document.body.appendChild(link);
  try {
    link.click();
  } catch {
    // Silently fail if click throws but still clean up and return true
  } finally {
    document.body.removeChild(link);
  }
  return true;
};
