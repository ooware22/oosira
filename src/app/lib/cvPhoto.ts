/**
 * The optional CV photo lives only on this device.
 *
 * It is never saved with the CV: it is kept out of cv_data entirely, and the
 * server only ever receives it inside the single request that renders a PDF
 * (or sends an application), uses it in memory, and drops it — see
 * pdf_export/photo.py in the backend. localStorage is just a convenience so
 * the user doesn't have to pick the file again on every download.
 */

const STORAGE_KEY = 'oosira_cv_photo';
const OUTPUT_SIZE = 400;
const JPEG_QUALITY = 0.85;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type PhotoErrorCode = 'type' | 'size' | 'read';

export class PhotoError extends Error {
  constructor(public code: PhotoErrorCode) {
    super(code);
  }
}

// Storage can throw (private mode, blocked site data, quota), so every access
// is guarded; failing just means the photo isn't remembered.
export function loadStoredPhoto(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && value.startsWith('data:image/jpeg;base64,') ? value : null;
  } catch {
    return null;
  }
}

export function storePhoto(dataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, dataUrl);
  } catch {
    /* not remembered on this device; still usable for this download */
  }
}

export function clearStoredPhoto(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing stored */
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoError('read'));
    };
    img.src = url;
  });
}

/**
 * Square-crop and compress to a small JPEG. Re-drawing through a canvas also
 * drops EXIF metadata (GPS location included) before the photo goes anywhere.
 */
export async function processPhotoFile(file: File): Promise<string> {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) throw new PhotoError('type');
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError('size');

  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new PhotoError('read');

  const side = Math.min(w, h);
  const sx = (w - side) / 2;
  // Portraits keep the upper part of the frame, where the face usually is.
  const sy = h > w ? (h - side) * 0.2 : (h - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError('read');
  // Transparent PNGs would otherwise turn black in the JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
