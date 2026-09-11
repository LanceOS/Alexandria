import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { CODE_RUNNER_LIMITS, type CodeRunInput } from '../../shared/code-runner.js';
import { AppError } from '../http/errors.js';
import { createCodeRunner } from './code-runner.js';

const example: CodeRunInput = { language: 'cpp', source: 'int main() {}', stdin: '' };
const errorStatus = (status: number) => (error: unknown) => error instanceof AppError && error.statusCode === status;

test('disabled and closed runners fail safely without needing a container runtime', async () => {
  const disabled = createCodeRunner({ enabled: false });
  assert.equal((await disabled.status()).available, false);
  await assert.rejects(disabled.run(randomUUID(), example), errorStatus(503));
  await disabled.close();
  const closed = createCodeRunner();
  await closed.close();
  assert.equal((await closed.status()).available, false);
  await assert.rejects(closed.run(randomUUID(), example), errorStatus(503));
});

test('runner validates UTF-8 byte limits and cancellation before starting a sandbox', async () => {
  const runner = createCodeRunner();
  for (const input of [
    { ...example, source: '' }, { ...example, source: ' \n ' }, { ...example, language: 'python' },
    { ...example, source: 'é'.repeat(CODE_RUNNER_LIMITS.sourceBytes / 2 + 1) },
    { ...example, stdin: 'é'.repeat(CODE_RUNNER_LIMITS.stdinBytes / 2 + 1) },
    { ...example, source: 'int main() {}\0' }, { ...example, stdin: '\0' },
  ]) await assert.rejects(runner.run(randomUUID(), input as CodeRunInput), errorStatus(400));
  await assert.rejects(runner.run(randomUUID(), example, AbortSignal.abort()), errorStatus(499));
  await runner.close();
});
