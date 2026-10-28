/**
 * Client-side photo validation and canvas resizing utility.
 * Enforces:
 * - JPG or PNG formats only
 * - Maximum 5 MB file size
 * - Canvas resizing to max dimensions (1200x1200) before saving
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const validMimes = ['image/jpeg', 'image/png'];
  const hasValidExt = /\.(jpe?g|png)$/i.test(file.name);
  if (!validMimes.includes(file.type) && !hasValidExt) {
    return {
      valid: false,
      error: 'Only JPG and PNG images are allowed.',
    };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return {
      valid: false,
      error: 'Photo file size must not exceed 5 MB.',
    };
  }

  return { valid: true };
}

export function resizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (typeof Image === 'undefined') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (!width || !height || (width <= maxWidth && height <= maxHeight)) {
          resolve(dataUrl);
          return;
        }

        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mimeType, quality));
        } catch {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

