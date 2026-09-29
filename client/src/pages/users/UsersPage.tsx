import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../api/client';
import { Badge, LoadState, PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { User } from '../../types';
import { formatDate } from '../../utils/format';
import { UserFormModal } from './UserFormModal';

export function UsersPage() {
  const { can, user: currentUser } = useAuth();
  const { data: users, loading, error, reload } = useFetch<User[]>('/users');

  // `editing` is: null = modal closed, 'new' = adding, a User = editing that user
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const canManage = can('users.manage');

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      reload();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in to the system."
        actions={
          canManage && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add user
            </button>
          )
        }
      />

      <div className="card">
        <LoadState loading={loading && !users} error={error} empty={users?.length === 0} />
        {users && users.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  {canManage && <th />}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-with-avatar">
                        <div className="avatar avatar-small">{user.name.charAt(0)}</div>
                        <div>
                          <p className="strong">{user.name}</p>
                          <p className="muted small">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge color="blue">{user.roleName}</Badge>
                    </td>
                    <td>{user.isActive ? <Badge color="green">Active</Badge> : <Badge color="gray">Disabled</Badge>}</td>
                    <td className="muted">{formatDate(user.createdAt)}</td>
                    {canManage && (
                      <td className="row-actions">
                        <button className="icon-button" onClick={() => setEditing(user)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button className="icon-button danger" onClick={() => handleDelete(user)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <UserFormModal
          user={editing === 'new' ? null : editing}
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
