import { api } from '../../api/client';
import { Field, Modal } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { Privilege, Role } from '../../types';

interface Props {
  role: Role | null; // null = create a new role
  onClose: () => void;
  onSaved: () => void;
}

/** Groups privileges by module: { Products: [...], Orders: [...] } */
function groupByModule(privileges: Privilege[]) {
  const groups: Record<string, Privilege[]> = {};
  for (const privilege of privileges) {
    groups[privilege.module] ??= [];
    groups[privilege.module].push(privilege);
  }
  return groups;
}

export function RoleFormModal({ role, onClose, onSaved }: Props) {
  const { data: privileges } = useFetch<Privilege[]>('/privileges');
  const { values, setValue, saving, error, submit } = useForm({
    name: role?.name ?? '',
    description: role?.description ?? '',
    privilegeIds: role?.privilegeIds ?? [],
  });
  const locked = Boolean(role?.isSystem); // system roles always have every privilege

  function togglePrivilege(id: number) {
    const selected = values.privilegeIds.includes(id);
    setValue('privilegeIds', selected ? values.privilegeIds.filter((p) => p !== id) : [...values.privilegeIds, id]);
  }

  function toggleModule(modulePrivileges: Privilege[], checked: boolean) {
    const ids = modulePrivileges.map((p) => p.id);
    const others = values.privilegeIds.filter((id) => !ids.includes(id));
    setValue('privilegeIds', checked ? [...others, ...ids] : others);
  }

  async function handleSubmit() {
    const ok = await submit(() => (role ? api.put(`/roles/${role.id}`, values) : api.post('/roles', values)));
    if (ok) onSaved();
  }

  return (
    <Modal title={role ? 'Edit role' : 'Add role'} onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error} wide>
      <div className="form-row">
        <Field label="Role name">
          <input value={values.name} onChange={(e) => setValue('name', e.target.value)} required disabled={locked} />
        </Field>
        <Field label="Description">
          <input value={values.description} onChange={(e) => setValue('description', e.target.value)} />
        </Field>
      </div>

      <p className="field-label">Privileges</p>
      {locked && <div className="alert alert-info">This is a system role. It always has every privilege.</div>}

      <div className="privilege-groups">
        {privileges &&
          Object.entries(groupByModule(privileges)).map(([module, modulePrivileges]) => {
            const allChecked = modulePrivileges.every((p) => values.privilegeIds.includes(p.id));
            return (
              <fieldset key={module} className="privilege-group" disabled={locked}>
                <label className="checkbox privilege-module">
                  <input type="checkbox" checked={allChecked} onChange={(e) => toggleModule(modulePrivileges, e.target.checked)} />
                  {module}
                </label>
                {modulePrivileges.map((privilege) => (
                  <label key={privilege.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={values.privilegeIds.includes(privilege.id)}
                      onChange={() => togglePrivilege(privilege.id)}
                    />
                    <span>
                      {privilege.description || privilege.name}
                      <code>{privilege.name}</code>
                    </span>
                  </label>
                ))}
              </fieldset>
            );
          })}
      </div>
    </Modal>
  );
}
