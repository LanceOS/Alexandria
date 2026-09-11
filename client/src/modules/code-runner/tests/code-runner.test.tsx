import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRef } from 'react';
import { CODE_RUNNER_LIMITS, type CodeRunResult, type CodeRunnerStatus } from '../../../../../shared/code-runner';
import { CodeBlock } from '../../curriculum/components/CodeBlock';
import { ModuleReaderPage } from '../../curriculum/pages/ModuleReaderPage';
import { readerFixture } from '../../curriculum/tests/fixtures';
import { CodeEditor } from '../components/CodeEditor';
import { CodeOutput } from '../components/CodeOutput';
import { CodePlayground } from '../components/CodePlayground';
import { CodeRunRequestError, runCode } from '../utils/api';
import { codeInputError, codeResultLabel, CPP_STARTER, isCodeRunResult, isCodeRunnerStatus } from '../utils/code';

const result: CodeRunResult = { status: 'success', stdout: 'Hello, Alexandria!\n', stderr: '', compileOutput: '', exitCode: 0, durationMs: 18 };
const status: CodeRunnerStatus = { available: true, language: 'cpp', standard: 'C++20', message: 'Ready.', limits: CODE_RUNNER_LIMITS };

test('code-runner response validation rejects malformed status and execution results', () => {
  assert.equal(isCodeRunnerStatus(status), true);
  assert.equal(isCodeRunResult(result), true);
  for (const value of [null, {}, { ...status, available: 'yes' }, { ...status, language: 'shell' }, { ...status, limits: {} }]) {
    assert.equal(isCodeRunnerStatus(value), false);
  }
  for (const value of [null, {}, { ...result, status: 'running' }, { ...result, stdout: {} }, { ...result, durationMs: NaN }, { ...result, durationMs: -1 }, { ...result, exitCode: '0' }]) {
    assert.equal(isCodeRunResult(value), false);
  }
});

test('program and input limits count UTF-8 bytes, including multibyte characters', () => {
  assert.equal(codeInputError(CPP_STARTER, ''), null);
  assert.match(codeInputError(' \n\t', '')!, /Add a C\+\+ program/);
  assert.match(codeInputError(`${CPP_STARTER}\0`, '')!, /Remove null characters/);
  assert.match(codeInputError(CPP_STARTER, '\0')!, /Remove null characters/);
  assert.equal(codeInputError('a'.repeat(CODE_RUNNER_LIMITS.sourceBytes), ''), null);
  assert.match(codeInputError('é'.repeat(CODE_RUNNER_LIMITS.sourceBytes / 2 + 1), '')!, /32 KiB/);
  assert.equal(codeInputError(CPP_STARTER, 'a'.repeat(CODE_RUNNER_LIMITS.stdinBytes)), null);
  assert.match(codeInputError(CPP_STARTER, 'é'.repeat(CODE_RUNNER_LIMITS.stdinBytes / 2 + 1))!, /8 KiB/);
});

test('each execution outcome has a useful status announcement', () => {
  assert.match(codeResultLabel(result), /successfully/);
  assert.match(codeResultLabel({ ...result, status: 'compile_error' }), /Compilation failed/);
  assert.match(codeResultLabel({ ...result, status: 'runtime_error', exitCode: 7 }), /exit code 7/);
  assert.match(codeResultLabel({ ...result, status: 'time_limit' }), /Time limit/);
  assert.match(codeResultLabel({ ...result, status: 'output_limit' }), /Output limit/);
});

test('C++ examples offer an editor lazily while terminal and output blocks remain examples', () => {
  const cpp = renderToStaticMarkup(<CodeBlock block={{ type: 'code', language: 'cpp', code: CPP_STARTER }} />);
  assert.match(cpp, /Edit and run/);
  assert.match(cpp, /aria-expanded="false" aria-controls=/);
  assert.match(cpp, /edits for this visit/);
  assert.doesNotMatch(cpp, /<textarea|Your program|Run code/);
  for (const language of ['shell', 'text'] as const) {
    const html = renderToStaticMarkup(<CodeBlock block={{ type: 'code', language, code: 'echo hello' }} />);
    assert.doesNotMatch(html, /Edit and run|<textarea/);
  }
  assert.match(renderToStaticMarkup(<CodePlayground initialSource={CPP_STARTER} scratchpad />), /Open C\+\+ scratchpad/);
});

test('anonymous users can edit labeled source and stdin fields before signing in to run', () => {
  const html = renderToStaticMarkup(<CodeEditor initialSource={CPP_STARTER} />);
  assert.match(html, /Your program<\/label><textarea/);
  assert.match(html, /spellCheck="false"/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /Program input/);
  assert.match(html, /Sign in to run/);
  assert.match(html, /Reset example/);
  assert.match(html, /Use starter/);
  assert.match(html, /role="status" aria-atomic="true"/);
  assert.match(html, /switching accounts resets the editor/);
  assert.match(html, /Running code does not award XP/);
  assert.doesNotMatch(html, /<textarea[^>]*(?:disabled|tabindex="-1")/);
});

test('C++ lesson sections without code get a scratchpad while other subjects do not', () => {
  const { outline, detail } = readerFixture();
  const props = { outline, detail, topicSlug: 'cpp', moduleId: detail.module.id, part: detail.parts[0]!, partIndex: 0,
    onNavigate() {}, headingRef: createRef<HTMLHeadingElement>() };
  assert.match(renderToStaticMarkup(<ModuleReaderPage {...props} />), /Open C\+\+ scratchpad/);
  const codedPart = { ...props.part, blocks: [{ type: 'code' as const, language: 'cpp' as const, code: CPP_STARTER }] };
  const coded = renderToStaticMarkup(<ModuleReaderPage {...props} part={codedPart} />);
  assert.match(coded, /Edit and run/);
  assert.doesNotMatch(coded, /Open C\+\+ scratchpad/);
  assert.doesNotMatch(renderToStaticMarkup(<ModuleReaderPage {...props} topicSlug="mathematics" />), /Open C\+\+ scratchpad|Edit and run/);
});

test('compiler output and program streams render as text, with an explicit compilation-failure state', () => {
  const html = renderToStaticMarkup(<CodeOutput result={{ ...result, status: 'compile_error', stdout: '', compileOutput: '<script>alert(1)</script>', stderr: '<img src=x>' }} />);
  assert.match(html, /Compiler messages/);
  assert.match(html, /Program errors/);
  assert.match(html, /The program did not run/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<script>|<img/);
});

test('code runs use the protected endpoint and validate returned output', async () => {
  const originalFetch = globalThis.fetch;
  let destination: string | URL | Request | undefined;
  let sent: RequestInit | undefined;
  globalThis.fetch = async (url, init) => { destination = url; sent = init; return new Response(JSON.stringify(result)); };
  const controller = new AbortController();
  try {
    const input = { language: 'cpp' as const, source: CPP_STARTER, stdin: '5\n' };
    assert.deepEqual(await runCode(input, 'session-csrf', controller.signal), result);
    assert.equal(destination, '/api/code-runner/run');
    assert.equal(sent?.method, 'POST');
    assert.equal(sent?.credentials, 'same-origin');
    assert.equal(sent?.cache, 'no-store');
    assert.equal(new Headers(sent?.headers).get('x-csrf-token'), 'session-csrf');
    assert.equal(new Headers(sent?.headers).get('X-Alexandria-Request'), '1');
    assert.deepEqual(JSON.parse(String(sent?.body)), input);
    globalThis.fetch = async () => new Response(null, { status: 403 });
    await assert.rejects(runCode(input, 'session-csrf', controller.signal), (failure: unknown) => failure instanceof CodeRunRequestError && failure.status === 403);
    globalThis.fetch = async () => new Response(JSON.stringify({ status: 'success' }));
    await assert.rejects(runCode(input, 'session-csrf', controller.signal), /Invalid code runner response/);
  } finally { globalThis.fetch = originalFetch; }
});

test('stopping or navigating away cancels runs, and a stalled run times out after 40 seconds', async (t) => {
  const originalFetch = globalThis.fetch;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.fetch = async (_url, init) => await new Promise<Response>((_resolve, reject) => {
    const abort = () => reject(init?.signal?.reason);
    if (init?.signal?.aborted) abort();
    else init?.signal?.addEventListener('abort', abort, { once: true });
  });
  const input = { language: 'cpp' as const, source: CPP_STARTER, stdin: '' };
  try {
    const controller = new AbortController();
    const cancelled = runCode(input, 'session-csrf', controller.signal);
    controller.abort();
    await assert.rejects(cancelled, { name: 'AbortError' });
    await assert.rejects(runCode(input, 'session-csrf', controller.signal), { name: 'AbortError' });
    const timedOut = runCode(input, 'session-csrf', new AbortController().signal);
    t.mock.timers.tick(40000);
    await assert.rejects(timedOut, { name: 'TimeoutError' });
  } finally {
    globalThis.fetch = originalFetch;
    t.mock.timers.reset();
  }
});
