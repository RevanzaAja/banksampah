import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

// Global cache to store API responses and prevent loading flickers on page navigation
const fetchCache = {};

export default function useFetch(path, dependencies = []) {
  const [data, setData] = useState(fetchCache[path] || null);
  const [loading, setLoading] = useState(!fetchCache[path]);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!path) return;
    try {
      // Only show hard loading state if we don't have cached data
      if (!fetchCache[path]) {
        setLoading(true);
      }
      setError(null);
      const result = await api.get(path);
      fetchCache[path] = result;
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
