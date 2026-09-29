import { api } from '../../api/client';
import { Field, Modal } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { Role, User } from '../../types';

interface Props {
  user: User | null; // null = create a new user
  onClose: () => void;
  onSaved: () => void;
}

export function UserFormModal({ user, onClose, onSaved }: Props) {
  const { data: roles } = useFetch<Role[]>('/roles');
  const { values, setValue, saving, error, submit } = useForm({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: user?.roleId ?? '',
    isActive: user ? Boolean(user.isActive) : true,
  });

  async function handleSubmit() {
    const ok = await submit(() => (user ? api.put(`/users/${user.id}`, values) : api.post('/users', values)));
    if (ok) onSaved();
  }

  return (
    <Modal title={user ? 'Edit user' : 'Add user'} onClose={onClose} onSubmit={handleSubmit} saving={saving} error={error}>
      <Field label="Full name">
        <input value={values.name} onChange={(e) => setValue('name', e.target.value)} required />
      </Field>
      <Field label="Email">
        <input type="email" value={values.email} onChange={(e) => setValue('email', e.target.value)} required />
      </Field>
      <Field label="Password" hint={user ? 'Leave empty to keep the current password' : 'At least 6 characters'}>
        <input
          type="password"
          value={values.password}
          onChange={(e) => setValue('password', e.target.value)}
          required={!user}
          minLength={6}
        />
      </Field>
      <Field label="Role">
        <select value={values.roleId} onChange={(e) => setValue('roleId', Number(e.target.value))} required>
          <option value="">Select a role…</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </Field>
      <label className="checkbox">
        <input type="checkbox" checked={values.isActive} onChange={(e) => setValue('isActive', e.target.checked)} />
        Account is active (can sign in)
      </label>
    </Modal>
  );
}
