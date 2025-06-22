// config/helpers.ts
import { toast } from 'react-toastify';
import { downloadCanvasToImage, downloadImageToFile } from './downloaders';

// Maximum data URL size (roughly 10MB when base64 encoded)
const MAX_DATA_URL_SIZE = 10 * 1024 * 1024;

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

// Enhanced file reader with better error handling and size limits
export const reader = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    // Check file size before reading
    if (file.size > MAX_DATA_URL_SIZE) {
      reject(
        new Error(
          `File too large. Maximum size is ${MAX_DATA_URL_SIZE / (1024 * 1024)}MB.`
        )
      );
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
      const result = fileReader.result as string;

      // Validate the result
      if (!result || typeof result !== 'string') {
        reject(new Error('Failed to read file content.'));
        return;
      }

      // Check if the data URL is valid
      if (!result.startsWith('data:')) {
        reject(new Error('Invalid file format.'));
        return;
      }

      // Check final size
      if (result.length > MAX_DATA_URL_SIZE) {
        reject(new Error('Processed file is too large.'));
        return;
      }

      resolve(result);
    };

    fileReader.onerror = () => {
      reject(new Error('File reading failed.'));
    };

    fileReader.onabort = () => {
      reject(new Error('File reading was aborted.'));
    };

    try {
      fileReader.readAsDataURL(file);
    } catch (error) {
      reject(
        error instanceof Error ? error : (
          new Error('Unknown error during file reading.')
        )
      );
    }
  });

// Safely reads a file with comprehensive error handling
export const safeFileReader = async (file: Blob): Promise<string | null> => {
  try {
    const result = await reader(file);
    return result;
  } catch (error) {
    console.error('File reading error:', error);

    // Show user-friendly error message
    const errorMessage =
      error instanceof Error ?
        error.message
      : 'Unknown error occurred while reading file.';
    toast.error(`Failed to read file: ${errorMessage}`, {
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    });

    return null;
  }
};

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
