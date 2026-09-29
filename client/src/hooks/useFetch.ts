// Loads data from the API when a component mounts (or when `path` changes).
// Usage:  const { data, loading, error, reload } = useFetch<Product[]>('/products');
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.get<T>(path));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
