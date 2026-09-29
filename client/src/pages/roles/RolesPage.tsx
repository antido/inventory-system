import { Lock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../api/client';
import { Badge, LoadState, PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Role } from '../../types';
import { RoleFormModal } from './RoleFormModal';

export function RolesPage() {
  const { can } = useAuth();
  const { data: roles, loading, error, reload } = useFetch<Role[]>('/roles');
  const [editing, setEditing] = useState<Role | 'new' | null>(null);
  const canManage = can('roles.manage');

  async function handleDelete(role: Role) {
    if (!confirm(`Delete the "${role.name}" role?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      reload();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Roles"
        description="A role is a named set of privileges. Every user has exactly one role."
        actions={
          canManage && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add role
            </button>
          )
        }
      />

      <LoadState loading={loading && !roles} error={error} />

      <div className="card-grid">
        {roles?.map((role) => (
          <div key={role.id} className="card role-card">
            <div className="role-card-top">
              <h3>{role.name}</h3>
              {role.isSystem && (
                <Badge color="blue">
                  <Lock size={12} /> System
                </Badge>
              )}
            </div>
            <p className="muted">{role.description || 'No description'}</p>
            <div className="role-meta">
              <span>
                <Users size={14} /> {role.userCount} user{role.userCount === 1 ? '' : 's'}
              </span>
              <span>{role.isSystem ? 'All privileges' : `${role.privilegeIds.length} privileges`}</span>
            </div>
            {canManage && (
              <div className="role-actions">
                <button className="btn btn-secondary btn-small" onClick={() => setEditing(role)}>
                  <Pencil size={14} /> Edit
                </button>
                {!role.isSystem && (
                  <button className="btn btn-ghost-danger btn-small" onClick={() => handleDelete(role)}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <RoleFormModal
          role={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}
