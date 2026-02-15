/**
 * Client-side image compression utility.
 *
 * Resizes images to a max dimension and re-encodes as JPEG at reduced quality
 * so that base64 data-URLs stored in localStorage stay well under the ~5 MB
 * quota.  A typical 1920×1080 photo becomes ~30-60 KB after compression.
 */

export interface CompressOptions {
  /** Maximum width in pixels (default 800) */
  maxWidth?: number;
  /** Maximum height in pixels (default 600) */
  maxHeight?: number;
  /** JPEG quality 0–1 (default 0.75) */
  quality?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.75,
};

/**
 * Read a File, resize it on a canvas, and return a compact JPEG data-URL.
 * Returns null if the file cannot be decoded as an image.
 */
export function compressImageFile(
  file: File,
  opts?: CompressOptions,
): Promise<string | null> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULTS, ...opts };

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down proportionally
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Wrapper around localStorage.setItem that catches QuotaExceededError
 * and returns false so callers can show a user-facing warning.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`[safeLocalStorageSet] Failed for key "${key}":`, e);
    return false;
  }
}
