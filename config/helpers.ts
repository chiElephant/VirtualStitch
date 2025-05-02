import state from '@/store';

export const downloadImageToFile = (
  fileName: string = 'image',
  activeTab: string
): boolean => {
  let decalUrl: string | null = null;

  if (activeTab === 'logoShirt') {
    decalUrl = state.logoDecal;
  } else if (activeTab === 'stylishShirt') {
    decalUrl = state.fullDecal;
  }

  if (!decalUrl || activeTab === '') {
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
  const dataURL = canvas.toDataURL();
  const link = document.createElement('a');

  const safeFileName =
    fileName.trim() ? `${fileName.trim()}.png` : 'canvas.png';

  link.href = dataURL || '';
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

export const reader = (file: Blob) =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsDataURL(file);
  });

export const getContrastingColor = (color: string) => {
  // Remove the '#' character if it exists
  const hex = color.replace('#', '');

  // Convert the hex string to RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate the brightness of the color
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white depending on the brightness
  return brightness > 128 ? 'black' : 'white';
};
