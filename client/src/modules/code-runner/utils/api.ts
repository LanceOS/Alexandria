import type { CodeRunInput, CodeRunResult } from '../../../../../shared/code-runner';
import { isCodeRunResult } from './code';

export class CodeRunRequestError extends Error {
  constructor(readonly status: number) { super('Code run request failed'); }
}

export async function runCode(input: CodeRunInput, csrfToken: string, signal: AbortSignal): Promise<CodeRunResult> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal.aborted) abort();
  else signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException('The code runner took too long to respond.', 'TimeoutError')), 40000);
  try {
    const response = await fetch('/api/code-runner/run', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-Alexandria-Request': '1', 'x-csrf-token': csrfToken },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new CodeRunRequestError(response.status);
    const value: unknown = await response.json();
    if (!isCodeRunResult(value)) throw new Error('Invalid code runner response');
    return value;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
