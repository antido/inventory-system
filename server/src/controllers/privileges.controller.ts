import { Request, Response } from 'express';
import { execute, query } from '../config/db';
import { notFound } from '../utils/httpError';
import { idParam, optionalString, requireString } from '../utils/validate';

/** GET /api/privileges */
export async function listPrivileges(_req: Request, res: Response) {
  const privileges = await query(
    `SELECT p.id, p.name, p.module, p.description,
            (SELECT COUNT(*) FROM role_privileges rp WHERE rp.privilege_id = p.id) AS roleCount
       FROM privileges p
      ORDER BY p.module, p.name`,
  );
  res.json(privileges);
}

/**
 * POST /api/privileges  { name, module, description }
 * Note: a new privilege only does something once the code checks for it
 * with requirePrivilege('your.privilege').
 */
export async function createPrivilege(req: Request, res: Response) {
  const name = requireString(req.body.name, 'Name').toLowerCase();
  const module = requireString(req.body.module, 'Module');
  const description = optionalString(req.body.description);

  const result = await execute('INSERT INTO privileges (name, module, description) VALUES (?, ?, ?)', [
    name,
    module,
    description,
  ]);
  res.status(201).json({ id: result.insertId });
}

/** PUT /api/privileges/:id  { name, module, description } */
export async function updatePrivilege(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const name = requireString(req.body.name, 'Name').toLowerCase();
  const module = requireString(req.body.module, 'Module');
  const description = optionalString(req.body.description);

  const result = await execute('UPDATE privileges SET name = ?, module = ?, description = ? WHERE id = ?', [
    name,
    module,
    description,
    id,
  ]);
  if (result.affectedRows === 0) throw notFound('Privilege not found');
  res.json({ message: 'Privilege updated' });
}

/** DELETE /api/privileges/:id */
export async function deletePrivilege(req: Request, res: Response) {
  const id = idParam(req.params.id);
  const result = await execute('DELETE FROM privileges WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw notFound('Privilege not found');
  res.json({ message: 'Privilege deleted' });
}
