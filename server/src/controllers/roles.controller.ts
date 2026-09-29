import { Request, Response } from 'express';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { execute, query, withTransaction } from '../config/db';
import { badRequest, notFound } from '../utils/httpError';
import { idParam, optionalString, requireString } from '../utils/validate';

/** GET /api/roles  - every role with its privilege ids and number of users */
export async function listRoles(_req: Request, res: Response) {
  const roles = await query(
    `SELECT r.id, r.name, r.description, r.is_system AS isSystem,
            (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS userCount
       FROM roles r
      ORDER BY r.id`,
  );
  const links = await query<{ role_id: number; privilege_id: number }>(
    'SELECT role_id, privilege_id FROM role_privileges',
  );
  const allPrivilegeIds = (await query<{ id: number }>('SELECT id FROM privileges')).map((p) => p.id);

  const result = roles.map((role) => ({
    ...role,
    isSystem: Boolean(role.isSystem),
    // System roles always have every privilege
    privilegeIds: role.isSystem
      ? allPrivilegeIds
      : links.filter((link) => link.role_id === role.id).map((link) => link.privilege_id),
  }));
  res.json(result);
}

/** Replaces all privileges of a role with the given list. */
async function savePrivileges(conn: PoolConnection, roleId: number, privilegeIds: unknown) {
  if (!Array.isArray(privilegeIds)) throw badRequest('privilegeIds must be a list');

  await conn.query('DELETE FROM role_privileges WHERE role_id = ?', [roleId]);
  if (privilegeIds.length > 0) {
    const rows = privilegeIds.map((privilegeId) => [roleId, Number(privilegeId)]);
    await conn.query('INSERT INTO role_privileges (role_id, privilege_id) VALUES ?', [rows]);
  }
}

/** POST /api/roles  { name, description, privilegeIds: number[] } */
export async function createRole(req: Request, res: Response) {
  const name = requireString(req.body.name, 'Name');
  const description = optionalString(req.body.description);

  const id = await withTransaction(async (conn) => {
    const [result] = await conn.query<ResultSetHeader>('INSERT INTO roles (name, description) VALUES (?, ?)', [
      name,
      description,
    ]);
    await savePrivileges(conn, result.insertId, req.body.privilegeIds ?? []);
    return result.insertId;
  });

  res.status(201).json({ id });
}

/** PUT /api/roles/:id  { name, description, privilegeIds: number[] } */
export async function updateRole(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const name = requireString(req.body.name, 'Name');
  const description = optionalString(req.body.description);

  const [role] = await query('SELECT * FROM roles WHERE id = ?', [id]);
  if (!role) throw notFound('Role not found');

  await withTransaction(async (conn) => {
    if (role.is_system) {
      // System roles keep their name and always have every privilege.
      await conn.query('UPDATE roles SET description = ? WHERE id = ?', [description, id]);
      return;
    }
    await conn.query('UPDATE roles SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    await savePrivileges(conn, id, req.body.privilegeIds ?? []);
  });

  res.json({ message: 'Role updated' });
}

/** DELETE /api/roles/:id */
export async function deleteRole(req: Request, res: Response) {
  const id = idParam(req.params.id);

  const [role] = await query('SELECT is_system FROM roles WHERE id = ?', [id]);
  if (!role) throw notFound('Role not found');
  if (role.is_system) throw badRequest('System roles cannot be deleted');

  const [{ count }] = await query('SELECT COUNT(*) AS count FROM users WHERE role_id = ?', [id]);
  if (count > 0) throw badRequest('Move the users in this role to another role first');

  await execute('DELETE FROM roles WHERE id = ?', [id]);
  res.json({ message: 'Role deleted' });
}
