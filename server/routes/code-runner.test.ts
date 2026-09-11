import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import test, { type TestContext } from 'node:test';
import Fastify from 'fastify';
import { CODE_RUNNER_LIMITS, type CodeRunInput, type CodeRunResult, type CodeRunnerStatus } from '../../shared/code-runner.js';
import { createAuthService, sessionCookieName } from '../auth/service.js';
import { loadConfig } from '../config.js';
import { initializeSchema } from '../db/migrations.js';
import { AppError, registerErrors } from '../http/errors.js';
import { registerSecurity } from '../http/security.js';
import type { CodeRunner } from '../services/code-runner.js';
import { registerCodeRunnerRoutes } from './code-runner.js';

const input: CodeRunInput = { language: 'cpp', source: '#include <iostream>\nint main() { std::cout << "Hello"; }', stdin: '' };
const successful: CodeRunResult = { status: 'success', stdout: 'Hello', stderr: '', compileOutput: '', exitCode: 0, durationMs: 20 };

class FakeRunner implements CodeRunner {
  readonly calls: Array<{ userId: string; input: CodeRunInput; signal?: AbortSignal }> = [];
  statusCalls = 0;
  closeCalls = 0;
  availability: CodeRunnerStatus = {
    available: true, language: 'cpp', standard: 'C++20', message: 'Ready to run.', limits: CODE_RUNNER_LIMITS,
  };
  statusError: Error | undefined;
  execute: (signal?: AbortSignal) => Promise<CodeRunResult> = async () => successful;
  shutdown: () => Promise<void> = async () => {};

  async status() {
    this.statusCalls += 1;
    if (this.statusError) throw this.statusError;
    return this.availability;
  }

  async run(userId: string, value: CodeRunInput, signal?: AbortSignal) {
    this.calls.push({ userId, input: value, signal });
    return this.execute(signal);
  }

  async close() { this.closeCalls += 1; await this.shutdown(); }
}

function fixture(t: TestContext) {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON; PRAGMA recursive_triggers = ON;');
  initializeSchema(database);
  const config = loadConfig({ APP_ORIGIN: 'http://localhost:3000' });
  // Keep the app's smaller default: the code route must explicitly allow escaped source JSON.
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } } });
  registerErrors(app);
  registerSecurity(app, config);
  const runner = new FakeRunner();
  registerCodeRunnerRoutes(app, createAuthService(database, config), runner);
  t.after(async () => { await app.close(); database.close(); });

  function account(username: string, token: string, csrf: string) {
    const id = randomUUID();
    const cookieToken = token.repeat(64);
    const csrfToken = csrf.repeat(64);
    const now = new Date().toISOString();
    database.prepare(`INSERT INTO users(id, username, display_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, 'member', 'active', ?, ?)`).run(id, username, username, now, now);
    database.prepare(`INSERT INTO sessions(token_hash, user_id, csrf_token, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)`).run(createHash('sha256').update(cookieToken).digest('hex'), id, csrfToken, Date.now(), Date.now() + 60_000);
    return { id, headers: { cookie: `${sessionCookieName}=${cookieToken}`, 'x-csrf-token': csrfToken,
      'x-alexandria-request': '1' } };
  }
  const alice = account('alice', 'a', 'c');
  const bob = account('bob', 'b', 'd');
  const run = (payload: unknown = input, headers: Record<string, string> = alice.headers, url = '/api/code-runner/run') =>
    app.inject({ method: 'POST', url, headers: { 'content-type': 'application/json', ...headers }, payload: JSON.stringify(payload) });
  return { database, app, runner, alice, bob, run };
}

test('runner availability is public and never cached or treated as an execution', async (t) => {
  const f = fixture(t);
  for (const available of [true, false]) {
    f.runner.availability = { ...f.runner.availability, available };
    const response = await f.app.inject('/api/code-runner/status');
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.deepEqual(response.json(), f.runner.availability);
  }
  assert.equal(f.runner.calls.length, 0);
});

test('execution requires authentication, matching CSRF, same origin and the application request marker', async (t) => {
  const f = fixture(t);
  const { cookie: _cookie, ...anonymous } = f.alice.headers;
  const { 'x-csrf-token': _csrf, ...withoutCsrf } = f.alice.headers;
  const { 'x-alexandria-request': _marker, ...withoutMarker } = f.alice.headers;
  const rejected: Array<{ headers: Record<string, string>; status: number }> = [
    { headers: anonymous, status: 401 },
    { headers: withoutCsrf, status: 403 },
    { headers: withoutMarker, status: 403 },
    { headers: { ...f.alice.headers, 'x-csrf-token': '0'.repeat(64) }, status: 403 },
    { headers: { ...f.alice.headers, cookie: f.bob.headers.cookie }, status: 403 },
    { headers: { ...f.alice.headers, origin: 'https://foreign.example' }, status: 403 },
    { headers: { ...f.alice.headers, 'sec-fetch-site': 'cross-site' }, status: 403 },
  ];
  for (const { headers, status } of rejected) {
    const response = await f.run(input, headers);
    assert.equal(response.statusCode, status, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
  const encoded = await f.run(input, withoutMarker, '/%61pi/code-runner/run');
  assert.equal(encoded.statusCode, 403, encoded.body);
  assert.equal(encoded.json().code, 'REQUEST_HEADER_REQUIRED');
  for (const payload of ['{"language":', ' '.repeat(256 * 1024 + 1)]) {
    const response = await f.app.inject({ method: 'POST', url: '/api/code-runner/run',
      headers: { ...anonymous, 'content-type': 'application/json' }, payload });
    assert.equal(response.statusCode, 401, 'Authentication is required before parsing or accepting a large request body');
  }
  f.database.prepare("UPDATE users SET status = 'disabled' WHERE id = ?").run(f.alice.id);
  assert.equal((await f.run()).statusCode, 401);
  assert.equal(f.runner.calls.length, 0, 'No rejected request may invoke the runner');
});

test('only the strict C++ request shape reaches execution', async (t) => {
  const f = fixture(t);
  const invalid = [null, [], {}, { source: input.source, stdin: '' }, { ...input, language: 'python' },
    { ...input, source: 42 }, { ...input, source: '' }, { ...input, source: ' \n\t ' },
    { ...input, stdin: null }, { language: 'cpp', source: input.source },
    { ...input, userId: f.bob.id }, { ...input, compilerFlags: ['-fplugin=unsafe.so'] },
    { ...input, source: 'int main() {}\u0000' }, { ...input, stdin: '\u0000' }];
  for (const payload of invalid) {
    const response = await f.run(payload);
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
  const malformed = await f.app.inject({ method: 'POST', url: '/api/code-runner/run',
    headers: { ...f.alice.headers, 'content-type': 'application/json' }, payload: '{"language":' });
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.headers['cache-control'], 'no-store');
  const unsupported = await f.app.inject({ method: 'POST', url: '/api/code-runner/run',
    headers: { ...f.alice.headers, 'content-type': 'text/plain' }, payload: input.source });
  assert.ok([400, 415].includes(unsupported.statusCode), unsupported.body);
  assert.equal(f.runner.calls.length, 0);
});

test('UTF-8 byte limits apply independently to source and stdin at their exact boundaries', async (t) => {
  const f = fixture(t);
  const accepted = [
    { ...input, source: 'a'.repeat(CODE_RUNNER_LIMITS.sourceBytes), stdin: 'b'.repeat(CODE_RUNNER_LIMITS.stdinBytes) },
    { ...input, source: 'é'.repeat(CODE_RUNNER_LIMITS.sourceBytes / 2), stdin: 'é'.repeat(CODE_RUNNER_LIMITS.stdinBytes / 2) },
    { ...input, source: '😀'.repeat(CODE_RUNNER_LIMITS.sourceBytes / 4), stdin: '😀'.repeat(CODE_RUNNER_LIMITS.stdinBytes / 4) },
  ];
  for (const payload of accepted) {
    const response = await f.run(payload);
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(f.runner.calls.at(-1)?.input, payload);
  }
  const before = f.runner.calls.length;
  for (const payload of accepted.flatMap((value) => [{ ...value, source: value.source + 'a' }, { ...value, stdin: value.stdin + 'a' }])) {
    const response = await f.run(payload);
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
  assert.equal(f.runner.calls.length, before);
});

test('escaped JSON can carry the allowed text limits while the transport body remains bounded', async (t) => {
  const f = fixture(t);
  const payload = { ...input, source: '//' + '\u0001'.repeat(CODE_RUNNER_LIMITS.sourceBytes - 2), stdin: '\u0001'.repeat(CODE_RUNNER_LIMITS.stdinBytes) };
  const encoded = JSON.stringify(payload);
  assert.ok(Buffer.byteLength(encoded) > 240 * 1024);
  assert.ok(Buffer.byteLength(encoded) < 256 * 1024);
  const response = await f.run(payload);
  assert.equal(response.statusCode, 200, response.body);
  assert.deepEqual(f.runner.calls[0]?.input, payload);
  const excessive = await f.app.inject({ method: 'POST', url: '/api/code-runner/run',
    headers: { ...f.alice.headers, 'content-type': 'application/json' }, payload: ' '.repeat(256 * 1024) + JSON.stringify(input) });
  assert.equal(excessive.statusCode, 413, excessive.body);
  assert.equal(excessive.headers['cache-control'], 'no-store');
  assert.equal(f.runner.calls.length, 1);
});

test('execution receives only authenticated identity and returns all runner outcomes without adding learner evidence', async (t) => {
  const f = fixture(t);
  for (const status of ['success', 'compile_error', 'runtime_error', 'time_limit', 'output_limit'] as const) {
    const result = { ...successful, status, stdout: 'learner output', stderr: 'learner stderr', compileOutput: 'compiler output',
      exitCode: status === 'success' ? 0 : status === 'time_limit' ? null : 1 };
    f.runner.execute = async () => result;
    const response = await f.run(input, f.bob.headers);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.deepEqual(response.json(), result);
    const call = f.runner.calls.at(-1)!;
    assert.equal(call.userId, f.bob.id);
    assert.deepEqual(call.input, input);
    assert.ok(call.signal instanceof AbortSignal);
    assert.equal(call.signal.aborted, false, 'Normal request completion must not cancel a finished run');
  }
  for (const table of ['user_module_progress', 'user_lesson_part_progress', 'exercise_attempts']) {
    assert.equal(f.database.prepare(`SELECT count(*) AS count FROM ${table}`).get()?.count, 0);
  }
});

test('runner infrastructure errors are not cached and unexpected details are redacted', async (t) => {
  const f = fixture(t);
  for (const error of [new AppError(503, 'CODE_RUNNER_UNAVAILABLE', 'The runner is unavailable.'),
    new AppError(429, 'CODE_RUNNER_BUSY', 'Please try again.'), new Error('private host path and source details')]) {
    f.runner.execute = async () => { throw error; };
    const response = await f.run();
    assert.equal(response.statusCode, error instanceof AppError ? error.statusCode : 500, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
    if (response.statusCode === 429) assert.equal(response.headers['retry-after'], '2');
    assert.doesNotMatch(response.body, /private host path/);
  }
  f.runner.statusError = new Error('private runner configuration');
  const failedStatus = await f.app.inject('/api/code-runner/status');
  assert.equal(failedStatus.statusCode, 500);
  assert.equal(failedStatus.headers['cache-control'], 'no-store');
  assert.doesNotMatch(failedStatus.body, /private runner configuration/);
});

test('disconnecting a response cancels its active execution', { timeout: 5_000 }, async (t) => {
  const f = fixture(t);
  let responseRaw: ServerResponse | undefined;
  f.app.addHook('onRequest', async (_request, reply) => { responseRaw = reply.raw; });
  let begin!: () => void;
  const started = new Promise<void>((resolve) => { begin = resolve; });
  let observeAbort!: () => void;
  const aborted = new Promise<void>((resolve) => { observeAbort = resolve; });
  f.runner.execute = (signal) => new Promise((_resolve, reject) => {
    assert.ok(signal);
    signal.addEventListener('abort', () => { observeAbort(); reject(new AppError(499, 'CODE_RUN_CANCELLED', 'Cancelled.')); }, { once: true });
    begin();
  });
  // Attach rejection handling before destroying the injected HTTP response.
  const pending = f.run().then(() => undefined, () => undefined);
  await started;
  responseRaw!.destroy();
  await aborted;
  assert.equal(f.runner.calls[0]?.signal?.aborted, true);
  await pending;
});

test('application shutdown closes the runner exactly once', async (t) => {
  const f = fixture(t);
  await f.app.ready();
  assert.equal(f.runner.closeCalls, 0);
  await f.app.close();
  await f.app.close();
  assert.equal(f.runner.closeCalls, 1);
});

test('shutdown stops active execution before waiting for its HTTP request to finish', { timeout: 5_000 }, async (t) => {
  const f = fixture(t);
  let begin!: () => void;
  const started = new Promise<void>((resolve) => { begin = resolve; });
  let cancel!: (error: Error) => void;
  f.runner.execute = () => new Promise((_resolve, reject) => { cancel = reject; begin(); });
  f.runner.shutdown = async () => { cancel(new AppError(499, 'CODE_RUN_CANCELLED', 'The execution was stopped.')); };
  const pending = f.run().then((response) => response);
  await started;
  const closing = f.app.close();
  const response = await pending;
  assert.equal(response.statusCode, 499, response.body);
  await closing;
  assert.equal(f.runner.closeCalls, 1);
});
