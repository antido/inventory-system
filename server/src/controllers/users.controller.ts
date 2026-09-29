import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { execute, query } from '../config/db';
import { badRequest, notFound } from '../utils/httpError';
import { idParam, requireInteger, requireString, toBoolean } from '../utils/validate';

const USER_COLUMNS = `
  u.id, u.name, u.email, u.is_active AS isActive, u.created_at AS createdAt,
  u.role_id AS roleId, r.name AS roleName`;

/** GET /api/users */
export async function listUsers(_req: Request, res: Response) {
  const users = await query(
    `SELECT ${USER_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.name`,
  );
  res.json(users);
}

/** POST /api/users  { name, email, password, roleId, isActive } */
export async function createUser(req: Request, res: Response) {
  const name = requireString(req.body.name, 'Name');
  const email = requireString(req.body.email, 'Email').toLowerCase();
  const password = requireString(req.body.password, 'Password');
  const roleId = requireInteger(req.body.roleId, 'Role', 1);
  const isActive = toBoolean(req.body.isActive);

  if (password.length < 6) throw badRequest('Password must be at least 6 characters');

  // Never store plain passwords - store a one-way hash instead.
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await execute(
    'INSERT INTO users (name, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, roleId, isActive],
  );
  res.status(201).json({ id: result.insertId });
}

/** PUT /api/users/:id  { name, email, roleId, isActive, password? } */
export async function updateUser(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const name = requireString(req.body.name, 'Name');
  const email = requireString(req.body.email, 'Email').toLowerCase();
  const roleId = requireInteger(req.body.roleId, 'Role', 1);
  const isActive = toBoolean(req.body.isActive);

  if (id === req.user!.id && !isActive) throw badRequest('You cannot disable your own account');

  const result = await execute(
    'UPDATE users SET name = ?, email = ?, role_id = ?, is_active = ? WHERE id = ?',
    [name, email, roleId, isActive, id],
  );
  if (result.affectedRows === 0) throw notFound('User not found');

  // Password is optional when editing - only change it if one was typed.
  if (req.body.password) {
    const password = requireString(req.body.password, 'Password');
    if (password.length < 6) throw badRequest('Password must be at least 6 characters');
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      await bcrypt.hash(password, 10),
      id,
    ]);
  }

  res.json({ message: 'User updated' });
}

/** DELETE /api/users/:id */
export async function deleteUser(req: Request, res: Response) {
  const id = idParam(req.params.id);
  if (id === req.user!.id) throw badRequest('You cannot delete your own account');

  const result = await execute('DELETE FROM users WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw notFound('User not found');
  res.json({ message: 'User deleted' });
}
