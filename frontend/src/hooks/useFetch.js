import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export default function useFetch(path, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!path) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.get(path);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refetch();
  }, [...dependencies, refetch]);

  return { data, loading, error, refetch };
}
