// Every error thrown in a route ends up here and is sent back as JSON.
// Express 5 forwards errors from async functions automatically.
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Friendly messages for common MySQL errors
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }
  if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'This record is in use and cannot be deleted' });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}
