/**
 * The optional CV photo lives only on this device.
 *
 * It is never saved with the CV: it is kept out of cv_data entirely, and the
 * server only ever receives the final cropped photo inside the single request
 * that renders a PDF (or sends an application), uses it in memory, and drops
 * it — see pdf_export/photo.py in the backend. localStorage is just a
 * convenience so the user doesn't have to pick and frame it again each time.
 */

const PHOTO_KEY = 'oosira_cv_photo';
// The downscaled original plus its framing, so the photo can be re-framed
// later rather than only zoomed further into an already-cropped result.
const SOURCE_KEY = 'oosira_cv_photo_source';

const OUTPUT_SIZE = 400;
const SOURCE_MAX_SIDE = 1200;
const JPEG_QUALITY = 0.85;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type PhotoErrorCode = 'type' | 'size' | 'read';

export class PhotoError extends Error {
  constructor(public code: PhotoErrorCode) {
    super(code);
  }
}

/** A downscaled, metadata-free copy of the user's original photo. */
export interface PhotoSource {
  url: string;
  width: number;
  height: number;
}

/**
 * Framing of the square crop: `zoom` 1 shows the largest square that fits,
 * `x`/`y` are the crop's centre as a fraction of the source width/height.
 */
export interface PhotoCrop {
  zoom: number;
  x: number;
  y: number;
}

// Storage can throw (private mode, blocked site data, quota), so every access
// is guarded; failing just means the photo isn't remembered.
export function loadStoredPhoto(): string | null {
  try {
    const value = localStorage.getItem(PHOTO_KEY);
    return value && value.startsWith('data:image/jpeg;base64,') ? value : null;
  } catch {
    return null;
  }
}

export function loadStoredSource(): { source: PhotoSource; crop: PhotoCrop } | null {
  try {
    const raw = localStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { source, crop } = parsed ?? {};
    if (typeof source?.url !== 'string' || !source.url.startsWith('data:image/jpeg;base64,')) return null;
    if (!(source.width > 0 && source.height > 0)) return null;
    return { source, crop: clampCrop(crop ?? defaultCrop(source), source) };
  } catch {
    return null;
  }
}

export function storePhoto(photo: string, source: PhotoSource, crop: PhotoCrop): void {
  try {
    localStorage.setItem(PHOTO_KEY, photo);
    localStorage.setItem(SOURCE_KEY, JSON.stringify({ source, crop }));
  } catch {
    // The original is the bulky part; keep at least the final photo if it fits.
    try {
      localStorage.removeItem(SOURCE_KEY);
      localStorage.setItem(PHOTO_KEY, photo);
    } catch {
      /* not remembered on this device; still usable for this download */
    }
  }
}

export function clearStoredPhoto(): void {
  try {
    localStorage.removeItem(PHOTO_KEY);
    localStorage.removeItem(SOURCE_KEY);
  } catch {
    /* nothing stored */
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PhotoError('read'));
    img.src = src;
  });
}

/** Dimensions of an existing data URL (e.g. a photo saved before framing existed). */
export async function sourceFromDataUrl(url: string): Promise<PhotoSource> {
  const img = await loadImage(url);
  return { url, width: img.naturalWidth, height: img.naturalHeight };
}

/**
 * Validate the picked file and keep a downscaled copy to frame from.
 * Re-drawing through a canvas drops EXIF metadata (GPS location included)
 * before the photo goes anywhere.
 */
export async function loadPhotoSource(file: File): Promise<PhotoSource> {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) throw new PhotoError('type');
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError('size');

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new PhotoError('read');

    const ratio = Math.min(1, SOURCE_MAX_SIDE / Math.max(w, h));
    const width = Math.round(w * ratio);
    const height = Math.round(h * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoError('read');
    // Transparent PNGs would otherwise turn black in the JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return { url: canvas.toDataURL('image/jpeg', 0.9), width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Starting frame: the largest centred square; portraits keep the upper part, where the face usually is. */
export function defaultCrop({ width, height }: PhotoSource): PhotoCrop {
  const side = Math.min(width, height);
  const top = height > width ? (height - side) * 0.2 : (height - side) / 2;
  return { zoom: 1, x: 0.5, y: (top + side / 2) / height };
}

/** Keep the zoom in range and the square fully inside the photo. */
export function clampCrop(crop: PhotoCrop, { width, height }: PhotoSource): PhotoCrop {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(crop.zoom) || 1));
  const side = Math.min(width, height) / zoom;
  const halfX = side / 2 / width;
  const halfY = side / 2 / height;
  const clamp = (v: number, half: number) => Math.min(1 - half, Math.max(half, Number(v) || 0.5));
  return { zoom, x: clamp(crop.x, halfX), y: clamp(crop.y, halfY) };
}

/** The final square photo for the CV, as a small JPEG. */
export async function renderCroppedPhoto(source: PhotoSource, crop: PhotoCrop): Promise<string> {
  const img = await loadImage(source.url);
  const { zoom, x, y } = clampCrop(crop, source);
  const side = Math.min(source.width, source.height) / zoom;
  const sx = x * source.width - side / 2;
  const sy = y * source.height - side / 2;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError('read');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
