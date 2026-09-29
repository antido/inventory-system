// Authentication = "who are you?"     -> requireAuth
// Authorization  = "are you allowed?" -> requirePrivilege
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser, getUserWithPrivileges } from '../services/permissions';
import { HttpError } from '../utils/httpError';

// Tell TypeScript that `req.user` exists after requireAuth runs.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Checks the "Authorization: Bearer <token>" header and loads the user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in first');

  let payload: { userId: number };
  try {
    payload = jwt.verify(token, env.jwtSecret) as { userId: number };
  } catch {
    throw new HttpError(401, 'Your session has expired, please log in again');
  }

  const user = await getUserWithPrivileges(payload.userId);
  if (!user || !user.isActive) throw new HttpError(401, 'Account not found or disabled');

  req.user = user;
  next();
}

/**
 * Only lets the request through if the user has at least one
 * of the given privileges. Example: requirePrivilege('products.manage')
 */
export function requirePrivilege(...privileges: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const allowed = privileges.some((p) => req.user?.privileges.includes(p));
    if (!allowed) throw new HttpError(403, 'You do not have permission to do this');
    next();
  };
}
