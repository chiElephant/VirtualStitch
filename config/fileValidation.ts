// config/fileValidation.ts

// File size limits (in bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DIMENSIONS = 4096; // 4K max width/height

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validates file size and type before processing
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    };
  }

  // Check MIME type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please select a valid image file.'
    };
  }

  // Check for common image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPG, PNG, GIF, WebP, BMP).'
    };
  }

  return { isValid: true, file };
};

/**
 * Validates that the file is actually a valid image by checking its binary header
 */
export const validateImageFile = (file: File): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 16)); // Check first 16 bytes
      
      // Check magic numbers for common image formats
      const isValidImage = 
        // PNG: 89 50 4E 47
        (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) ||
        // JPEG: FF D8 FF
        (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) ||
        // GIF: 47 49 46 38
        (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x38) ||
        // WebP: 52 49 46 46 ... 57 45 42 50
        (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
         uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) ||
        // BMP: 42 4D
        (uint8Array[0] === 0x42 && uint8Array[1] === 0x4D);

      if (!isValidImage) {
        resolve({
          isValid: false,
          error: 'File does not appear to be a valid image format.'
        });
        return;
      }

      resolve({ isValid: true, file });
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Failed to read file for validation.'
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validates image dimensions by loading it
 */
export const validateImageDimensions = (file: File): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
        resolve({
          isValid: false,
          error: `Image dimensions too large. Maximum dimensions are ${MAX_DIMENSIONS}x${MAX_DIMENSIONS}px.`
        });
        return;
      }

      resolve({ isValid: true, file });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Failed to load image. The file may be corrupted or in an unsupported format.'
      });
    };

    img.src = url;
  });
};

/**
 * Complete file validation pipeline
 */
export const validateImageFileComplete = async (file: File): Promise<FileValidationResult> => {
  // Basic validation first
  const basicValidation = validateFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Binary header validation
  const binaryValidation = await validateImageFile(file);
  if (!binaryValidation.isValid) {
    return binaryValidation;
  }

  // Dimension validation
  const dimensionValidation = await validateImageDimensions(file);
  if (!dimensionValidation.isValid) {
    return dimensionValidation;
  }

  return { isValid: true, file };
};
