// Saves and deletes product photos.
//
// The browser shrinks a photo before uploading it (client/src/utils/image.ts):
// max 1200px on the longest side, converted to WebP. It is sent inside the
// normal JSON body as a "data URL" (data:image/webp;base64,....).
//
// The server never trusts the upload:
//  - it must be small (MAX_IMAGE_BYTES)
//  - its first bytes must really be a JPG, PNG or WebP image
//  - it gets a random file name; the original name is never used
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { badRequest } from '../utils/httpError';

/** server/uploads - served to the browser at /uploads (see app.ts). */
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

/** Largest photo accepted after the browser has optimized it. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const FOLDER = 'products';

type ImageType = 'webp' | 'jpg' | 'png';

/**
 * Looks at the "magic bytes" at the start of the file to find its real type.
 * A text file renamed to photo.jpg is caught here.
 */
function detectImageType(bytes: Buffer): ImageType | null {
  if (bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }
  return null;
}

/**
 * Checks and saves a photo sent as a data URL.
 * Returns the path to store in products.image_path, e.g. 'products/<uuid>.webp'.
 */
export async function saveProductImage(dataUrl: unknown): Promise<string> {
  const match = typeof dataUrl === 'string' ? /^data:image\/[a-z]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl) : null;
  if (!match) throw badRequest('The photo must be a JPG, PNG or WebP image');

  const bytes = Buffer.from(match[1], 'base64');
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw badRequest('The photo is too large. It must be 2 MB or smaller after optimizing');
  }

  const type = detectImageType(bytes);
  if (!type) throw badRequest('The photo must be a JPG, PNG or WebP image');

  const fileName = `${crypto.randomUUID()}.${type}`;
  await fs.mkdir(path.join(UPLOADS_DIR, FOLDER), { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, FOLDER, fileName), bytes);

  return `${FOLDER}/${fileName}`;
}

/** Deletes a saved photo. Missing files are ignored. */
export async function deleteProductImage(imagePath: string | null | undefined): Promise<void> {
  if (!imagePath) return;

  // Safety check: only ever delete files inside the uploads folder.
  const fullPath = path.resolve(UPLOADS_DIR, imagePath);
  if (!fullPath.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) return;

  await fs.rm(fullPath, { force: true });
}

/** The URL the browser uses to show a photo, or null when there is none. */
export function productImageUrl(imagePath: string | null): string | null {
  return imagePath ? `/uploads/${imagePath}` : null;
}
