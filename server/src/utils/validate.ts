// Tiny validation helpers for request bodies.
// Each one returns a clean value or throws a 400 Bad Request.
import { badRequest } from './httpError';

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value.trim();
}

export function requireNumber(value: unknown, field: string, min = 0): number {
  const num = Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(num)) {
    throw badRequest(`${field} must be a number`);
  }
  if (num < min) throw badRequest(`${field} must be at least ${min}`);
  return num;
}

export function requireInteger(value: unknown, field: string, min = 0): number {
  const num = requireNumber(value, field, min);
  if (!Number.isInteger(num)) throw badRequest(`${field} must be a whole number`);
  return num;
}

/** Accepts an id or an empty value (returns null). */
export function optionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  return requireInteger(value, 'id', 1);
}

export function toBoolean(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 1 || value === '1' || value === 'true';
}

/** Reads a numeric :id from the URL, e.g. /products/5 */
export function idParam(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw badRequest('Invalid id');
  return id;
}
