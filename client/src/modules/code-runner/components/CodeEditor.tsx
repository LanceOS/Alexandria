import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { CodeRunResult, CodeRunnerStatus } from '../../../../../shared/code-runner';
import { Button, Icon } from '../../../components/ui';
import { useResource } from '../../../hooks/useResource';
import { useLearningProgress } from '../../progress';
import { CodeRunRequestError, runCode } from '../utils/api';
import { codeInputError, codeResultLabel, CPP_STARTER, isCodeRunnerStatus } from '../utils/code';
import { CodeOutput } from './CodeOutput';
import type { CodeEditorProps } from './CodePlayground';

export function CodeEditor({ initialSource }: CodeEditorProps) {
  const id = useId();
  const account = useLearningProgress();
  const status = useResource<CodeRunnerStatus>('/api/code-runner/status', isCodeRunnerStatus);
  const [source, setSource] = useState(initialSource);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<CodeRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('Edit the program, then run it to see what happens.');
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const identity = useRef<string | null | undefined>(account.loading ? undefined : account.user?.id ?? null);
  const previousToken = useRef(account.csrfToken);
  const editor = useRef<HTMLTextAreaElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current && editor.current) { editor.current.focus(); focused.current = true; }
  }, [account.loading]);
  useEffect(() => () => { revision.current += 1; pending.current?.abort(); }, []);
  useEffect(() => {
    if (previousToken.current !== account.csrfToken) {
      previousToken.current = account.csrfToken;
      revision.current += 1;
      if (pending.current) setMessage('Your session changed. Run the program again when your account is ready.');
      pending.current?.abort(); pending.current = null;
      setRunning(false);
    }
    if (account.loading) return;
    const nextIdentity = account.user?.id ?? null;
    // Signing in to run an anonymous draft keeps that draft. Leaving a signed-in
    // account clears its work before another learner can use this editor.
    if (identity.current != null && identity.current !== nextIdentity) {
      setSource(initialSource); setStdin(''); setResult(null); setError(null);
      setMessage('The editor was reset for the current account.');
    }
    identity.current = nextIdentity;
  }, [account.user?.id, account.csrfToken, account.loading, initialSource]);

  function stop() {
    revision.current += 1;
    pending.current?.abort(); pending.current = null;
    setRunning(false); setMessage('Run stopped. Your edits are still here.');
  }

  function reset(nextSource: string) {
    setSource(nextSource); setStdin(''); setResult(null); setError(null);
    setMessage('Editor reset. Edit the program, then run it.');
    editor.current?.focus();
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    if (pending.current || account.loading) return;
    if (!account.user || !account.csrfToken) { account.openAccount(); return; }
    const invalid = codeInputError(source, stdin);
    if (invalid) { setError(invalid); return; }
    if (!status.data?.available) return;
    const controller = new AbortController();
    pending.current = controller;
    const stamp = ++revision.current;
    setRunning(true); setError(null); setResult(null); setMessage('Compiling and running your program…');
    try {
      const value = await runCode({ language: 'cpp', source, stdin }, account.csrfToken, controller.signal);
      if (stamp !== revision.current) return;
      setResult(value); setMessage(codeResultLabel(value));
    } catch (failure) {
      if (stamp !== revision.current) return;
      const problem = failure instanceof CodeRunRequestError
        ? [401, 403].includes(failure.status) ? 'Your session has changed. Sign in again to run code.'
          : failure.status === 429 ? 'The runner is busy. Wait a moment and try again.'
            : failure.status === 413 ? 'This program or its input is too large.'
              : failure.status === 503 ? 'Code execution is unavailable. Try refreshing the runner status.'
                : 'The code runner couldn’t accept this program. Try again.'
        : failure instanceof Error && failure.name === 'TimeoutError'
          ? 'The runner took too long to respond. Your edits are still here; try again.'
          : 'We couldn’t reach the code runner. Your edits are still here; check the connection and try again.';
      setError(problem); setMessage('Run could not finish.');
      if (failure instanceof CodeRunRequestError && [401, 403].includes(failure.status)) account.retry();
    } finally {
      if (stamp === revision.current) { pending.current = null; setRunning(false); }
    }
  }

  if (account.loading && !account.user) return <div className="code-editor" role="status">Checking your account…</div>;
  const invalid = codeInputError(source, stdin);
  const signedIn = Boolean(account.user && account.csrfToken);
  return <section className="code-editor" aria-labelledby={`${id}-heading`}>
    <div className="code-editor-heading"><h3 id={`${id}-heading`}>Try it in C++</h3><span>C++20</span></div>
    <p className="code-editor-note" id={`${id}-note`}>Edits and results stay in this visit. Leaving this section or switching accounts resets the editor. Running code does not award XP.</p>
    <form onSubmit={(event) => void run(event)}>
      <label htmlFor={`${id}-source`}>Your program</label>
      <textarea ref={editor} id={`${id}-source`} className="code-editor-source" value={source} onChange={(event) => { setSource(event.target.value); if (result) setMessage('Program edited. Run again to update the results below.'); }}
        rows={Math.min(20, Math.max(9, initialSource.split('\n').length))} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-describedby={`${id}-note`} readOnly={running} />
      {!/\bmain\s*\(/.test(source) && <p className="code-editor-note">This example is a fragment. Add the headers and a main() function it needs, or use the starter program below.</p>}
      <label htmlFor={`${id}-stdin`}>Program input <span>(optional, supplied to standard input)</span></label>
      <textarea id={`${id}-stdin`} className="code-editor-input" value={stdin} onChange={(event) => { setStdin(event.target.value); if (result) setMessage('Input edited. Run again to update the results below.'); }} rows={3} spellCheck={false} readOnly={running} />
      <p className="code-editor-note">Enter all input before running. The program cannot ask for more input while it runs.</p>
      {invalid && <p className="code-runner-error">{invalid}</p>}
      <div className="code-editor-actions">
        {running ? <Button variant="secondary" onClick={(event) => {
          // React reuses this button as the submit control after stopping. Keep
          // the current click from submitting a fresh run as its default action.
          event.preventDefault();
          stop();
        }}>Stop run</Button>
          : signedIn ? <Button type="submit" disabled={Boolean(invalid) || !status.data?.available || account.loading}><Icon name="code" size={16} />Run code</Button>
            : <Button onClick={account.openAccount}>Sign in to run</Button>}
        <Button variant="ghost" onClick={() => reset(initialSource)} disabled={running}>Reset example</Button>
        <Button variant="ghost" onClick={() => reset(CPP_STARTER)} disabled={running}>Use starter</Button>
      </div>
    </form>
    <div className="code-runner-availability">
      {status.loading ? <p role="status">Checking code runner availability…</p> : status.error
        ? <p>We couldn’t check the code runner. <Button variant="ghost" onClick={status.retry}>Retry status</Button></p>
        : status.data && <p>{status.data.available ? `Programs can run for ${status.data.limits.runSeconds} seconds and print up to 32 KiB.` : status.data.message}
          {!status.data.available && <Button variant="ghost" onClick={status.retry}>Refresh status</Button>}</p>}
    </div>
    <p className="code-runner-announcement" role="status" aria-atomic="true">{message}</p>
    {error && <p className="code-runner-error" role="alert">{error}<Button variant="ghost" onClick={status.retry}>Refresh runner status</Button></p>}
    {result && <CodeOutput result={result} />}
  </section>;
}
