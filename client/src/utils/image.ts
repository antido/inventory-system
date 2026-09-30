// Shrinks a photo in the browser before it is uploaded.
//
// A phone photo is often 3-5 MB and 4000px wide - far bigger than needed.
// We draw it on a <canvas> at most MAX_DIMENSION pixels wide/high and save it
// as WebP, which usually gives a 100-400 KB file. Smaller uploads are faster
// and use less disk space on the server.

/** Largest photo a user may pick (before optimizing). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Longest side, in pixels, of the optimized photo. */
const MAX_DIMENSION = 1200;

/** WebP quality from 0 to 1. 0.8 looks good and keeps files small. */
const QUALITY = 0.8;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface OptimizedImage {
  dataUrl: string; // "data:image/webp;base64,...." - sent to the API inside the JSON body
  originalSize: number; // bytes
  optimizedSize: number; // bytes
}

/** "3.2 MB" / "240 KB" */
export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the photo'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Checks the file, then resizes and compresses it.
 * Throws an Error with a friendly message if the file can't be used.
 */
export async function optimizeImage(file: File): Promise<OptimizedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`This photo is ${formatBytes(file.size)}. Choose one of up to ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }

  // "from-image" applies the camera's rotation, so phone photos stay upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => {
    throw new Error('This file could not be read as an image.');
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, 'image/webp');

  // Very old browsers can't write WebP: use JPEG on a white background instead.
  if (!blob || blob.type !== 'image/webp') {
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, 'image/jpeg');
  }
  if (!blob) throw new Error('This file could not be read as an image.');

  return { dataUrl: await blobToDataUrl(blob), originalSize: file.size, optimizedSize: blob.size };
}
