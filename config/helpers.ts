import { toast } from 'react-toastify';
import { downloadCanvasToImage, downloadImageToFile } from './downloaders';

// Handles downloading either a canvas or decal image based on the given type.
// Automatically resets the input file name on success.
// Displays user-friendly toast notifications for error handling.
export const handleImageDownload = (
  type: 'canvas' | 'image',
  fileName: string,
  activeFilterTab: string,
  resetFileName: () => void
) => {
  let success = false;

  if (type === 'canvas') {
    success = downloadCanvasToImage(fileName.trim() || 'canvas');
    if (!success) {
      toast.error('No canvas found to download.', {
        position: 'top-center',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
    }
  } else if (type === 'image') {
    success = downloadImageToFile(fileName.trim() || 'image', activeFilterTab);
    if (!success) {
      toast.error(
        'No decal found to download. Please generate or upload an image first.',
        {
          position: 'top-center',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        }
      );
    }
  }

  if (success) {
    resetFileName();
  }
};

// Reads a Blob file (e.g., an uploaded image) and converts it into a base64 data URL.
// Returns a Promise that resolves with the file's content.
export const reader = (file: Blob) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = () => reject(new Error('File reading failed.'));
    try {
      fileReader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });

// Calculates whether black or white text will be more legible on a given background color.
// Uses luminance based on the YIQ formula to determine brightness.
// Assumes input is a valid 6-digit hex color string.
export const getContrastingColor = (color: string) => {
  // Remove the '#' character if it exists
  const hex = color.replace('#', '');

  // Basic validation: must be 6 hex digits
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return 'black';
  }

  // Convert the hex string to RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate the brightness of the color
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white depending on the brightness
  return brightness > 128 ? 'black' : 'white';
};
