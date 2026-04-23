import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  /** Maximum file size in MB. Default: 1 */
  maxSizeMB?: number;
  /** Maximum width or height of the image. Default: 1920 */
  maxWidthOrHeight?: number;
  /** Use Web Worker for better performance. Default: true */
  useWebWorker?: boolean;
  /** Initial compression quality (0-1). Default: 0.8 */
  initialQuality?: number;
}

/**
 * Compresses an image file in the browser to reduce size while maintaining acceptable quality.
 * Useful for uploading large document images without losing readability.
 * 
 * @param file The original image File object
 * @param options Compression options
 * @returns A Promise that resolves to the compressed File object (or original if it fails/isn't an image)
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  // If not an image, return original immediately
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const defaultOptions = {
    maxSizeMB: 1, // Compress to ~1MB or less
    maxWidthOrHeight: 1920, // Maintain Full HD resolution, which is enough for reading documents
    useWebWorker: true,
    initialQuality: 0.8, // 80% quality retains good visual fidelity
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, finalOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails for any reason, return the original file
    // to ensure the upload process isn't completely broken
    return file;
  }
};
