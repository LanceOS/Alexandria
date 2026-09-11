export class ProgressRequestError extends Error {
  constructor(readonly status: number) { super('Progress request failed'); }
}

export async function progressRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort(init.signal?.reason);
  if (init.signal?.aborted) abort();
  else init.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers = new Headers(init.headers);
    headers.set('X-Alexandria-Request', '1');
    const response = await fetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new ProgressRequestError(response.status);
    return response.status === 204 ? null : await response.json();
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abort);
  }
}

export function progressUrl(path = '/api/progress') {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return `${path}?${new URLSearchParams({ timeZone })}`;
}
