import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test, { type TestContext } from 'node:test';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { SessionResponse } from '../../shared/auth.js';
import { buildApp } from '../app.js';
import { loadConfig } from '../config.js';
import { initializeDatabase, openDatabase } from '../db/database.js';
import { accountArguments } from './command-input.js';
import { PasswordHasher } from './password.js';
import { createAuthService, sessionCookieName } from './service.js';
import { LoginRateLimitError, LoginThrottle } from './throttle.js';

const password = 'correct horse battery staple';
const unsafeHeaders = { 'x-alexandria-request': '1' };

async function fixture(t: TestContext, https = false) {
  const directory = await mkdtemp(join(tmpdir(), 'alexandria-auth-test-'));
  const project = join(directory, 'project');
  await mkdir(project);
  const config = loadConfig({ DATA_DIR: join(directory, 'data'), BACKUP_DIR: join(directory, 'backups'), LOG_LEVEL: 'silent',
    APP_ORIGIN: https ? 'https://alexandria.example' : 'http://localhost:3000' }, project);
  initializeDatabase(config);
  const database = openDatabase(config, { writable: true });
  const auth = createAuthService(database, config);
  const apps: FastifyInstance[] = [];
  t.after(async () => {
    for (const app of apps) await app.close();
    database.close();
    await rm(directory, { recursive: true, force: true });
  });
  const app = await buildApp(config, { logger: false });
  apps.push(app);
  return {
    database, config, auth, app,
    account(username = 'admin', role: 'admin' | 'member' = 'admin') {
      return auth.createAccount({ username, role, displayName: username, password });
    },
    async login(username = 'admin', loginPassword = password) {
      const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: unsafeHeaders, payload: { username, password: loginPassword } });
      assert.equal(response.statusCode, 200, response.body);
      const cookie = String(response.headers['set-cookie']).split(';')[0]!;
      const session = response.json<Exclude<SessionResponse, { user: null }>>();
      return { response, cookie, session, headers: { ...unsafeHeaders, cookie, 'x-csrf-token': session.csrfToken } };
    },
    async reopenApp() {
      const reopened = await buildApp(config, { logger: false });
      apps.push(reopened);
      return reopened;
    },
  };
}

test('identity schema has no seeded users and enforces identity, credential, session and settings constraints', async (t) => {
  const f = await fixture(t);
  for (const table of ['users', 'user_credentials', 'sessions', 'user_settings']) {
    assert.equal(f.database.prepare(`SELECT count(*) AS count FROM ${table}`).get()?.count, 0);
  }
  const user = await f.account('Admin');
  assert.equal(user.username, 'admin');
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_settings').get()?.count, 0);
  const changes = [
    ['username', 'ADMIN'], ['username', 'a space'], ['username', 'åuser'], ['username', 'ab'],
    ['display_name', ''], ['role', 'superuser'], ['status', 'deleted'], ['created_at', 'not-a-timestamp'],
  ];
  for (const [column, value] of changes) assert.throws(() => f.database.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(value!, user.id));
  assert.throws(() => f.database.prepare('DELETE FROM users WHERE id = ?').run(user.id), /FOREIGN KEY/);
  assert.throws(() => f.database.prepare('INSERT INTO user_credentials (user_id, password_hash, updated_at) VALUES (?, ?, ?)')
    .run('missing', 'x'.repeat(100), user.createdAt), /FOREIGN KEY/);
  assert.throws(() => f.database.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)').run('a'.repeat(64), user.id, 'b'.repeat(64), 1, 604800002));
  assert.throws(() => f.database.prepare('INSERT INTO user_settings VALUES (?, ?, ?, ?, ?, ?)').run(user.id, 'light', 'medium', 'system', 0, user.createdAt));
  await assert.rejects(f.account('ADMIN'), (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 409);
});

test('scrypt hashes have random salts, validate bounds, and bound expensive concurrency', async () => {
  const hasher = new PasswordHasher();
  const first = await hasher.hash(password);
  const second = await hasher.hash(password);
  assert.match(first, /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.notEqual(first, second);
  assert.equal(await hasher.verify(password, first), true);
  assert.equal(await hasher.verify('incorrect password', first), false);
  assert.equal(await hasher.verify(password, undefined), false);
  assert.equal(await hasher.verify(password, 'scrypt$1073741824$8$3$invalid'), false);
  await assert.rejects(hasher.hash('too short'));
  await assert.rejects(hasher.hash('a'.repeat(257)));
  const results = await Promise.allSettled(Array.from({ length: 11 }, () => hasher.verify(password, first)));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 10);
  const rejection = results.find((result) => result.status === 'rejected');
  assert.equal(rejection?.reason.statusCode, 429);
});

test('login stores only a session token hash and returns safe identity with secure cookie attributes', async (t) => {
  const f = await fixture(t, true);
  const user = await f.account();
  const { response, cookie, session } = await f.login('AdMiN');
  assert.equal(session.user.id, user.id);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.match(String(response.headers['set-cookie']), /HttpOnly; SameSite=Strict; Path=\/; Max-Age=604800; Secure/);
  assert.doesNotMatch(response.body, /password|tokenHash|passwordHash|cookie/i);
  const token = cookie.slice(sessionCookieName.length + 1);
  const stored = f.database.prepare('SELECT * FROM sessions').get()!;
  assert.equal(stored.token_hash, createHash('sha256').update(token).digest('hex'));
  assert.notEqual(stored.token_hash, token);
  assert.equal(Number(stored.expires_at) - Number(stored.created_at), 604800000);
  const current = await f.app.inject({ url: '/api/auth/session', headers: { cookie } });
  assert.deepEqual(current.json(), session);
  const reopened = await f.reopenApp();
  assert.deepEqual((await reopened.inject({ url: '/api/auth/session', headers: { cookie } })).json(), session);
});

test('login errors do not reveal missing or disabled accounts, and username throttles survive IP changes', async (t) => {
  const f = await fixture(t);
  await f.account();
  const attempt = (username: string, remoteAddress = '127.0.0.1') => f.app.inject({ method: 'POST', url: '/api/auth/login', remoteAddress,
    headers: unsafeHeaders, payload: { username, password: 'incorrect password' } });
  const absent = await attempt('absent');
  const incorrect = await attempt('admin');
  assert.equal(absent.statusCode, 401);
  assert.deepEqual({ ...absent.json<Record<string, unknown>>(), requestId: null }, { ...incorrect.json<Record<string, unknown>>(), requestId: null });
  f.database.prepare("UPDATE users SET status = 'disabled'").run();
  const disabled = await f.app.inject({ method: 'POST', url: '/api/auth/login', headers: unsafeHeaders, payload: { username: 'admin', password } });
  assert.deepEqual({ ...disabled.json<Record<string, unknown>>(), requestId: null }, { ...absent.json<Record<string, unknown>>(), requestId: null });
  for (let index = 0; index < 8; index += 1) assert.equal((await attempt('ADMIN', `192.0.2.${index + 1}`)).statusCode, 401);
  const limited = await attempt('admin', '192.0.2.100');
  assert.equal(limited.statusCode, 429);
  assert.ok(Number(limited.headers['retry-after']) > 0);
});

test('session authorization rejects missing, ambiguous, expired and disabled sessions', async (t) => {
  const f = await fixture(t);
  const user = await f.account('member', 'member');
  const { cookie } = await f.login('member');
  assert.throws(() => f.auth.requireAdmin({ headers: { cookie } } as FastifyRequest), (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 403);
  assert.equal((await f.app.inject('/api/settings')).statusCode, 401);
  const ambiguous = await f.app.inject({ url: '/api/auth/session', headers: { cookie: `${cookie}; ${cookie}` } });
  assert.deepEqual(ambiguous.json(), { user: null });
  f.database.prepare("UPDATE users SET status = 'disabled' WHERE id = ?").run(user.id);
  assert.deepEqual((await f.app.inject({ url: '/api/auth/session', headers: { cookie } })).json(), { user: null });
  f.database.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(user.id);
  f.database.prepare('UPDATE sessions SET created_at = ?, expires_at = ?').run(Date.now() - 1000, Date.now() - 1);
  assert.deepEqual((await f.app.inject({ url: '/api/auth/session', headers: { cookie } })).json(), { user: null });
});

test('unsafe auth and settings endpoints require same-origin request and session CSRF protection', async (t) => {
  const f = await fixture(t);
  await f.account();
  const missingMarker = await f.app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password } });
  assert.equal(missingMarker.statusCode, 403);
  const foreign = await f.app.inject({ method: 'POST', url: '/api/auth/login', headers: { ...unsafeHeaders, origin: 'https://foreign.example' }, payload: { username: 'admin', password } });
  assert.equal(foreign.statusCode, 403);
  const { cookie, headers } = await f.login();
  const badLogout = await f.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { ...unsafeHeaders, cookie } });
  assert.equal(badLogout.statusCode, 403);
  const badSettings = await f.app.inject({ method: 'PATCH', url: '/api/settings', headers: { ...unsafeHeaders, cookie, 'x-csrf-token': '0'.repeat(64) }, payload: { theme: 'dark', revision: 0 } });
  assert.equal(badSettings.statusCode, 403);
  const loggedOut = await f.app.inject({ method: 'POST', url: '/api/auth/logout', headers });
  assert.equal(loggedOut.statusCode, 204);
  assert.match(String(loggedOut.headers['set-cookie']), /Max-Age=0/);
  assert.deepEqual((await f.app.inject({ url: '/api/auth/session', headers: { cookie } })).json(), { user: null });
});

test('settings are sparse, isolated by authenticated identity, and reject stale or malformed writes', async (t) => {
  const f = await fixture(t);
  await f.account('alice');
  const bob = await f.account('bob', 'member');
  const aliceSession = await f.login('alice');
  const bobSession = await f.login('bob');
  const defaults = { theme: 'system', textSize: 'medium', motionPreference: 'system', revision: 0, updatedAt: null };
  assert.deepEqual((await f.app.inject({ url: '/api/settings', headers: aliceSession.headers })).json(), defaults);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_settings').get()?.count, 0);
  const save = (payload: Record<string, unknown>) => f.app.inject({ method: 'PATCH', url: '/api/settings', headers: aliceSession.headers, payload });
  const updated = await save({ theme: 'dark', revision: 0 });
  assert.equal(updated.statusCode, 200, updated.body);
  assert.equal(updated.json().revision, 1);
  assert.equal((await save({ theme: 'light', revision: 0 })).statusCode, 409);
  for (const payload of [
    { theme: 'light', revision: '1' }, { theme: false, revision: 1 }, { theme: 'green', revision: 1 },
    { theme: 'light', revision: 1, userId: bob.id }, { revision: 1 }, { theme: 'light' },
  ]) assert.equal((await save(payload)).statusCode, 400);
  assert.deepEqual((await f.app.inject({ url: '/api/settings', headers: bobSession.headers })).json(), defaults);
  assert.equal((await f.app.inject({ url: '/api/settings', headers: aliceSession.headers })).json().theme, 'dark');
  const second = await save({ textSize: 'large', motionPreference: 'reduced', revision: 1 });
  assert.equal(second.statusCode, 200);
  assert.equal(second.json().revision, 2);
  assert.equal(second.json().theme, 'dark');
});

test('local password reset atomically revokes sessions and never seeds replacement settings', async (t) => {
  const f = await fixture(t);
  await f.account();
  const first = await f.login();
  await f.login();
  const replacement = 'a different long password';
  await f.auth.resetPassword('ADMIN', replacement);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM sessions').get()?.count, 0);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM user_settings').get()?.count, 0);
  assert.deepEqual((await f.app.inject({ url: '/api/auth/session', headers: { cookie: first.cookie } })).json(), { user: null });
  const old = await f.app.inject({ method: 'POST', url: '/api/auth/login', headers: unsafeHeaders, payload: { username: 'admin', password } });
  assert.equal(old.statusCode, 401);
  await f.login('admin', replacement);
});

test('login throttling bounds address floods and releases expired windows', () => {
  const throttle = new LoginThrottle();
  for (let index = 0; index < 30; index += 1) throttle.consume('same-ip', `person${index}`, 1);
  assert.throws(() => throttle.consume('same-ip', 'next-person', 1), LoginRateLimitError);
  throttle.consume('same-ip', 'next-person', 900001);
  const flooded = new LoginThrottle();
  for (let index = 0; index < 5000; index += 1) flooded.consume(`ip${index}`, `person${index}`, 1);
  assert.throws(() => flooded.consume('one-more-ip', 'one-more-person', 1), LoginRateLimitError);
  flooded.consume('one-more-ip', 'one-more-person', 900001);
});

test('operator account options never accept passwords in argv or echo rejected input', () => {
  assert.deepEqual(accountArguments(true, ['--username', 'lance', '--display-name', 'Lance', '--role', 'member', '--password-stdin']),
    { username: 'lance', displayName: 'Lance', role: 'member', passwordStdin: true });
  assert.throws(() => accountArguments(true, ['--username', 'lance', 'do-not-echo-this-secret']), (error: unknown) =>
    error instanceof Error && !error.message.includes('do-not-echo-this-secret'));
  assert.throws(() => accountArguments(true, ['--username', 'lance', '--password', 'secret']));
  assert.throws(() => accountArguments(false, ['--username', 'lance', '--role', 'admin']));
});

test('operator account commands consume passwords from stdin and reset persisted credentials', async (t) => {
  const f = await fixture(t);
  const env = { ...process.env, DATA_DIR: f.config.dataDir, DATABASE_PATH: f.config.databasePath, BACKUP_DIR: f.config.backupDir };
  const create = spawnSync(process.execPath, ['--import', 'tsx', 'server/commands/account-create.ts', '--username', 'operator', '--display-name', 'Local Operator', '--password-stdin'],
    { cwd: process.cwd(), env, input: `${password}\n`, encoding: 'utf8' });
  assert.equal(create.status, 0, create.stderr);
  assert.doesNotMatch(create.stdout + create.stderr, /correct horse battery staple|passwordHash|password_hash/);
  assert.equal(JSON.parse(create.stdout).user.username, 'operator');
  const loggedIn = await f.login('operator');
  const replacement = 'operator replacement password';
  const reset = spawnSync(process.execPath, ['--import', 'tsx', 'server/commands/account-password.ts', '--username', 'operator', '--password-stdin'],
    { cwd: process.cwd(), env, input: `${replacement}\n`, encoding: 'utf8' });
  assert.equal(reset.status, 0, reset.stderr);
  assert.ok(!(reset.stdout + reset.stderr).includes(replacement));
  assert.deepEqual((await f.app.inject({ url: '/api/auth/session', headers: { cookie: loggedIn.cookie } })).json(), { user: null });
  await f.login('operator', replacement);
});

test('a disable during password verification cannot establish a new session', async (t) => {
  const f = await fixture(t);
  const user = await f.account();
  const pendingLogin = f.auth.login({ username: 'admin', password }, '127.0.0.1');
  f.database.prepare("UPDATE users SET status = 'disabled' WHERE id = ?").run(user.id);
  await assert.rejects(pendingLogin, (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 401);
  assert.equal(f.database.prepare('SELECT count(*) AS count FROM sessions').get()?.count, 0);
});
