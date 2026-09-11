import { useCallback, useEffect, useState } from 'react';

export interface Resource<T> {
  url: string | null;
  data: T | null;
  error: 'missing' | 'connection' | null;
  loading: boolean;
}

/** Shared request lifecycle; each feature owns its endpoint and response validation. */
export function useResource<T>(url: string | null, validate: (value: unknown) => boolean, timeoutMs = 10000) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState<Resource<T>>({ url: null, data: null, error: null, loading: false });

  useEffect(() => {
    if (!url) {
      setResource({ url, data: null, error: null, loading: false });
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    let active = true;
    setResource({ url, data: null, error: null, loading: true });

    async function load() {
      try {
        const response = await fetch(url!, { signal: controller.signal });
        if (response.status === 404) {
          if (active) setResource({ url, data: null, error: 'missing', loading: false });
          return;
        }
        if (!response.ok) throw new Error('Request failed');
        const value: unknown = await response.json();
        if (!validate(value)) throw new Error('Invalid response');
        if (active) setResource({ url, data: value as T, error: null, loading: false });
      } catch {
        if (active) setResource({ url, data: null, error: 'connection', loading: false });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [url, attempt, validate, timeoutMs]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    ...(resource.url === url ? resource : { url, data: null, error: null, loading: Boolean(url) }),
    retry,
  };
}
