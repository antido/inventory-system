import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../api/client';
import { Field, LoadState, Modal, PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { Privilege } from '../../types';

export function PrivilegesPage() {
  const { can } = useAuth();
  const { data: privileges, loading, error, reload } = useFetch<Privilege[]>('/privileges');
  const [editing, setEditing] = useState<Privilege | 'new' | null>(null);
  const canManage = can('privileges.manage');

  async function handleDelete(privilege: Privilege) {
    if (!confirm(`Delete "${privilege.name}"? It will be removed from every role.`)) return;
    try {
      await api.delete(`/privileges/${privilege.id}`);
      reload();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Privileges"
        description="Single permissions checked by the server, e.g. products.manage. Assign them to roles."
        actions={
          canManage && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Add privilege
            </button>
          )
        }
      />

      <div className="card">
        <LoadState loading={loading && !privileges} error={error} empty={privileges?.length === 0} />
        {privileges && privileges.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Privilege</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Used by</th>
                  {canManage && <th />}
                </tr>
              </thead>
              <tbody>
                {privileges.map((privilege) => (
                  <tr key={privilege.id}>
                    <td>
                      <code>{privilege.name}</code>
                    </td>
                    <td>{privilege.module}</td>
                    <td className="muted">{privilege.description}</td>
                    <td className="muted">
                      {privilege.roleCount} role{privilege.roleCount === 1 ? '' : 's'}
                    </td>
                    {canManage && (
                      <td className="row-actions">
                        <button className="icon-button" onClick={() => setEditing(privilege)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger" onClick={() => handleDelete(privilege)} title="Delete">
                          <Trash2 size={16} />
                        </button>
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
        <PrivilegeFormModal
          privilege={editing === 'new' ? null : editing}
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

function PrivilegeFormModal({
  privilege,
  onClose,
  onSaved,
}: {
  privilege: Privilege | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { values, setValue, saving, error, submit } = useForm({
    name: privilege?.name ?? '',
    module: privilege?.module ?? '',
    description: privilege?.description ?? '',
  });

  async function handleSubmit() {
    const ok = await submit(() =>
      privilege ? api.put(`/privileges/${privilege.id}`, values) : api.post('/privileges', values),
    );
    if (ok) onSaved();
  }

  return (
    <Modal title={privilege ? 'Edit privilege' : 'Add privilege'} onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error}>
      <div className="alert alert-info">
        Privileges are checked in the server code (<code>requirePrivilege('name')</code>). Renaming one that the code
        uses will lock people out of that feature.
      </div>
      <Field label="Name" hint="Format: module.action, e.g. suppliers.view">
        <input value={values.name} onChange={(e) => setValue('name', e.target.value)} required />
      </Field>
      <Field label="Module" hint="Used to group privileges in the role editor">
        <input value={values.module} onChange={(e) => setValue('module', e.target.value)} required />
      </Field>
      <Field label="Description">
        <input value={values.description} onChange={(e) => setValue('description', e.target.value)} />
      </Field>
    </Modal>
  );
}
