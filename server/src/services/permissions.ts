// Loads a user together with the list of privilege names they have.
// Used by the auth middleware on every request, so role changes
// take effect immediately without logging out.
import { query } from '../config/db';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: { id: number; name: string; isSystem: boolean };
  privileges: string[];
}

export async function getUserWithPrivileges(userId: number): Promise<AuthUser | null> {
  const [user] = await query(
    `SELECT u.id, u.name, u.email, u.is_active, r.id AS role_id, r.name AS role_name, r.is_system
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?`,
    [userId],
  );
  if (!user) return null;

  // System roles (Admin) automatically get every privilege.
  const privilegeRows = user.is_system
    ? await query<{ name: string }>('SELECT name FROM privileges')
    : await query<{ name: string }>(
        `SELECT p.name
           FROM role_privileges rp
           JOIN privileges p ON p.id = rp.privilege_id
          WHERE rp.role_id = ?`,
        [user.role_id],
      );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: Boolean(user.is_active),
    role: { id: user.role_id, name: user.role_name, isSystem: Boolean(user.is_system) },
    privileges: privilegeRows.map((row) => row.name),
  };
}
