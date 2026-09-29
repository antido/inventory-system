import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { query } from '../config/db';
import { env } from '../config/env';
import { getUserWithPrivileges } from '../services/permissions';
import { HttpError } from '../utils/httpError';
import { requireString } from '../utils/validate';

/** POST /api/auth/login  { email, password } */
export async function login(req: Request, res: Response) {
  const email = requireString(req.body.email, 'Email').toLowerCase();
  const password = requireString(req.body.password, 'Password');

  const [row] = await query('SELECT id, password_hash FROM users WHERE email = ?', [email]);

  // Use the same message for "no user" and "wrong password"
  // so attackers can't find out which emails exist.
  const passwordOk = row && (await bcrypt.compare(password, row.password_hash));
  if (!passwordOk) throw new HttpError(401, 'Invalid email or password');

  const user = await getUserWithPrivileges(row.id);
  if (!user?.isActive) throw new HttpError(403, 'This account has been disabled');

  const token = jwt.sign({ userId: user.id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });

  res.json({ token, user });
}

/** GET /api/auth/me  - returns the logged in user and their privileges */
export async function me(req: Request, res: Response) {
  res.json(req.user);
}
