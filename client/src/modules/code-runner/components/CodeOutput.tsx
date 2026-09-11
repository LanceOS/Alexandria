import type { CodeRunResult } from '../../../../../shared/code-runner';

export function CodeOutput({ result }: { result: CodeRunResult }) {
  return <div className="code-runner-results">
    {result.compileOutput && <section><h4>Compiler messages</h4><pre tabIndex={0} aria-label="Compiler messages">{result.compileOutput}</pre></section>}
    <section><h4>Program output</h4><pre tabIndex={0} aria-label="Program output">{result.stdout || (result.status === 'compile_error' ? 'The program did not run.' : 'No output was printed.')}</pre></section>
    {result.stderr && <section><h4>Program errors</h4><pre tabIndex={0} aria-label="Program errors">{result.stderr}</pre></section>}
  </div>;
}
