// Manages form values, the "saving" flag and error message for a modal form.
// Usage:
//   const { values, setValue, saving, error, submit } = useForm({ name: '' });
//   <input value={values.name} onChange={(e) => setValue('name', e.target.value)} />
//   submit(() => api.post('/things', values))
import { useState } from 'react';

export function useForm<T extends object>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setValue<K extends keyof T>(field: K, value: T[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** Runs `action`, showing any error message. Returns true on success. */
  async function submit(action: () => Promise<unknown>) {
    setSaving(true);
    setError('');
    try {
      await action();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { values, setValues, setValue, saving, error, submit };
}
