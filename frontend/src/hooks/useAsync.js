import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(asyncFn, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);
  const fnRef = useRef(asyncFn);

  useEffect(() => {
    fnRef.current = asyncFn;
  }, [asyncFn]);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fnRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  }, [execute, immediate]);

  const updateData = useCallback((next) => {
    setData((current) => (typeof next === 'function' ? next(current) : next));
  }, []);

  return { data, loading, error, execute, setData: updateData };
}
