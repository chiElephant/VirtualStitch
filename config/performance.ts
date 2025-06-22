// config/performance.ts - Performance optimization utilities

/**
 * Debounce function to limit rapid consecutive calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Optimized image loading with compression
 */
export async function loadImageOptimized(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate optimal dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Use image smoothing for better quality
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress the image
        const dataUrl = canvas.toDataURL('image/png', quality);
        resolve(dataUrl);
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Preload and cache textures for faster application
 */
class TextureCache {
  private cache = new Map<string, string>();
  private maxSize = 50; // Maximum cached items
  
  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  
  get(key: string): string | undefined {
    return this.cache.get(key);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const textureCache = new TextureCache();

/**
 * Optimized texture application with caching
 */
export async function applyTextureOptimized(
  file: File,
  type: 'logo' | 'full',
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
  
  // Check cache first
  if (textureCache.has(fileKey)) {
    onProgress?.(100);
    const cachedResult = textureCache.get(fileKey);
    if (cachedResult) {
      return cachedResult;
    }
  }
  
  onProgress?.(10);
  
  try {
    // Optimize image based on type
    const maxDimensions = type === 'logo' ? { width: 512, height: 512 } : { width: 1024, height: 1024 };
    const quality = type === 'logo' ? 0.9 : 0.8;
    
    onProgress?.(30);
    
    const optimizedImage = await loadImageOptimized(
      file,
      maxDimensions.width,
      maxDimensions.height,
      quality
    );
    
    onProgress?.(80);
    
    // Cache the result
    textureCache.set(fileKey, optimizedImage);
    
    onProgress?.(100);
    
    return optimizedImage;
  } catch (error) {
    console.error('Texture optimization failed:', error);
    throw error;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks = new Map<string, number>();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startMark(name: string): void {
    this.marks.set(name, performance.now());
    performance.mark(`${name}-start`);
  }
  
  endMark(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    this.marks.delete(name);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  getMetrics(): PerformanceEntry[] {
    return performance.getEntriesByType('measure');
  }
  
  clearMetrics(): void {
    performance.clearMarks();
    performance.clearMeasures();
    this.marks.clear();
  }
}

/**
 * Optimized file validation with early returns
 */
export async function validateFileOptimized(file: File): Promise<{ isValid: boolean; error?: string }> {
  // Quick size check first
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' };
  }
  
  // Quick type check
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select an image file.' };
  }
  
  // Supported formats
  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported format. Please use PNG, JPG, or SVG.' };
  }
  
  return { isValid: true };
}

/**
 * Optimized texture operation with progress tracking
 */
export async function performTextureOperation(
  file: File,
  type: 'logo' | 'full',
  onProgress?: (progress: number) => void,
  onComplete?: (result: string) => void
): Promise<void> {
  const monitor = PerformanceMonitor.getInstance();
  monitor.startMark('texture-operation');
  
  try {
    onProgress?.(5);
    
    // Fast validation
    const validation = await validateFileOptimized(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    onProgress?.(15);
    
    // Optimized texture application
    const result = await applyTextureOptimized(file, type, (progress) => {
      onProgress?.(15 + (progress * 0.8)); // Map to 15-95%
    });
    
    onProgress?.(95);
    
    // Apply to state
    onComplete?.(result);
    
    onProgress?.(100);
    
    const duration = monitor.endMark('texture-operation');
    console.log(`Texture operation completed in ${duration.toFixed(2)}ms`);
    
  } catch (error) {
    monitor.endMark('texture-operation');
    console.error('Texture operation failed:', error);
    throw error;
  }
}

// Export optimized helpers for use in components
export const optimizedHelpers = {
  debounce,
  throttle,
  loadImageOptimized,
  applyTextureOptimized,
  validateFileOptimized,
  performTextureOperation,
  textureCache,
  PerformanceMonitor,
};