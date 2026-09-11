import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { CODE_RUNNER_LIMITS, type CodeRunInput, type CodeRunResult, type CodeRunnerStatus } from '../../shared/code-runner.js';
import { AppError } from '../http/errors.js';

export interface CodeRunner {
  status(): Promise<CodeRunnerStatus>;
  run(userId: string, input: CodeRunInput, signal?: AbortSignal): Promise<CodeRunResult>;
  close(): Promise<void>;
}

interface RunnerOptions { enabled?: boolean; image?: string }
type StopReason = 'timeout' | 'output' | 'abort';
interface CommandResult { code: number | null; stdout: Buffer; stderr: Buffer; stop?: StopReason; failed?: boolean }
interface CommandOptions { input?: string; signal?: AbortSignal; timeoutMs?: number; outputBytes?: number }

const defaultImage = 'localhost/alexandria-cpp-runner:1';
const probeOutput = 'alexandria-sandbox-v1\n';
const cooldownMs = 2_000;
const recentUsers = new Map<string, number>();
// Shared by every runner instance in this Node process, including app reloads.
let activeLease: object | undefined;
const cleanupPending = new Set<string>();

function unavailable(): AppError {
  return new AppError(503, 'CODE_RUNNER_UNAVAILABLE', 'Code execution is unavailable. Ask the library administrator to check the local runner.');
}

function cancelled(): AppError {
  return new AppError(499, 'CODE_RUN_CANCELLED', 'Code execution was cancelled.');
}

function podmanEnvironment(): NodeJS.ProcessEnv {
  // Podman needs the local user's storage/session locations. Application and
  // registry credentials, proxy variables and remote-container settings stay out.
  const environment: NodeJS.ProcessEnv = {};
  for (const key of ['PATH', 'HOME', 'XDG_RUNTIME_DIR', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'DBUS_SESSION_BUS_ADDRESS']) {
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  }
  return environment;
}

/** Bounded pipes; neither source nor stdin ever becomes command text. */
function command(args: string[], options: CommandOptions = {}): Promise<CommandResult> {
  if (options.signal?.aborted) return Promise.resolve({ code: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), stop: 'abort' });
  return new Promise((resolve) => {
    const child = spawn('podman', ['--remote=false', ...args], {
      shell: false, stdio: ['pipe', 'pipe', 'pipe'], env: podmanEnvironment(),
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let remaining = options.outputBytes ?? 16 * 1024;
    let stop: StopReason | undefined;
    let settled = false;
    const terminate = (reason: StopReason) => {
      stop ??= reason;
      child.kill('SIGKILL');
    };
    const abort = () => terminate('abort');
    const timer = setTimeout(() => terminate('timeout'), options.timeoutMs ?? 5_000);
    const finish = (code: number | null, failed = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
      resolve({ code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), ...(stop ? { stop } : {}), ...(failed ? { failed } : {}) });
    };
    const collect = (chunks: Buffer[], chunk: Buffer) => {
      if (stop) return;
      const kept = chunk.subarray(0, remaining);
      if (kept.length > 0) chunks.push(Buffer.from(kept));
      remaining -= kept.length;
      if (kept.length !== chunk.length) terminate('output');
    };
    child.stdout.on('data', (chunk: Buffer) => collect(stdout, chunk));
    child.stderr.on('data', (chunk: Buffer) => collect(stderr, chunk));
    child.stdin.on('error', () => { /* A child may reject input or exit early. */ });
    child.once('error', () => finish(null, true));
    child.once('close', (code) => finish(code));
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    child.stdin.end(options.input ?? '');
  });
}

function succeeded(result: CommandResult): boolean {
  return !result.failed && !result.stop && result.code === 0;
}

function text(buffer: Buffer): string {
  // Preserve valid text and cap replacement characters from arbitrary binary
  // output too. A partial UTF-8 character at the cap is simply omitted.
  const valid = Buffer.from(buffer.toString('utf8'));
  const bytes = valid.subarray(0, buffer.length);
  return new TextDecoder().decode(bytes, { stream: true });
}

function createArguments(name: string, image: string, seccompProfile: string): string[] {
  return ['create', '--pull=never', '--name', name, '--label=io.alexandria.runner=1',
    '--network=none', '--no-hosts', '--hostname=alexandria-runner', '--pid=private', '--ipc=private', '--uts=private', '--cgroupns=private',
    '--user=10001:10001', '--cap-drop=ALL', '--security-opt=no-new-privileges', `--security-opt=seccomp=${seccompProfile}`,
    '--read-only', '--read-only-tmpfs=false', '--image-volume=ignore', '--http-proxy=false', '--no-healthcheck', '--systemd=false',
    '--tmpfs=/work:rw,exec,nosuid,nodev,size=64m,mode=1777',
    '--tmpfs=/tmp:rw,noexec,nosuid,nodev,size=16m,mode=1777', '--shm-size=4m',
    '--memory=256m', '--memory-swap=256m', '--cpus=1', '--pids-limit=64',
    '--ulimit=nofile=64:64', '--ulimit=fsize=16777216:16777216', '--ulimit=core=0:0',
    '--env=PATH=/usr/local/bin:/usr/bin:/bin', '--env=HOME=/work', '--env=TMPDIR=/tmp', '--env=LANG=C.UTF-8',
    '--workdir=/work', '--log-driver=none', '--restart=no', '--timeout=35', '--stop-timeout=0', '--rm',
    '--entrypoint=/usr/bin/sleep', image, '35'];
}

async function removeContainer(name: string): Promise<void> {
  // rm --force kills the whole container/cgroup, including forked or detached
  // learner processes. Never rely on killing only the Podman exec client.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await command(['rm', '--force', '--ignore', '--time=0', name], { timeoutMs: 3_000 });
    if (succeeded(result)) { cleanupPending.delete(name); return; }
  }
  cleanupPending.add(name);
  throw unavailable();
}

class PodmanCodeRunner implements CodeRunner {
  private readonly enabled: boolean;
  private readonly image: string;
  private readonly lifetime = new AbortController();
  private closed = false;
  private cached?: { value: CodeRunnerStatus; until: number };
  private probing?: Promise<CodeRunnerStatus>;
  private running?: Promise<CodeRunResult>;
  private seccompProfile = '';
  private imageId = '';

  constructor(options: RunnerOptions) {
    this.enabled = options.enabled !== false;
    this.image = options.image ?? defaultImage;
  }

  private availability(available: boolean): CodeRunnerStatus {
    return { available, language: 'cpp', standard: 'C++20', limits: CODE_RUNNER_LIMITS,
      message: available ? 'C++20 code runs in a temporary isolated container.'
        : this.enabled ? 'Code execution is unavailable. Ask the library administrator to set up the local runner.'
          : 'Code execution is disabled for this library.' };
  }

  status(): Promise<CodeRunnerStatus> {
    if (!this.enabled || this.closed) return Promise.resolve(this.availability(false));
    if (this.probing) return this.probing;
    if (this.cached && this.cached.until > Date.now() && cleanupPending.size === 0) return Promise.resolve(this.cached.value);
    this.probing = this.probe().then((available) => {
      const value = this.availability(available && !this.closed);
      this.cached = { value, until: Date.now() + (value.available ? 30_000 : 10_000) };
      return value;
    }).finally(() => { this.probing = undefined; });
    return this.probing;
  }

  private async sandbox<T>(work: (name: string, signal: AbortSignal) => Promise<T>, signal: AbortSignal): Promise<T> {
    const name = `alexandria-cpp-${randomUUID()}`;
    try {
      const created = await command(createArguments(name, this.imageId, this.seccompProfile), { signal });
      if (!succeeded(created)) throw signal.aborted ? cancelled() : unavailable();
      const started = await command(['start', name], { signal });
      if (!succeeded(started)) throw signal.aborted ? cancelled() : unavailable();
      const checked = await command(['exec', name, '/usr/local/lib/alexandria/probe.sh'], { signal });
      if (!succeeded(checked) || checked.stdout.toString() !== probeOutput) throw signal.aborted ? cancelled() : unavailable();
      return await work(name, signal);
    } finally {
      // Always clean even if create/start was interrupted: creation may have
      // succeeded just before the client was killed. The container also has an
      // independent conmon deadline + automatic removal if the app crashes.
      await removeContainer(name);
    }
  }

  private async probe(): Promise<boolean> {
    try {
      if (process.platform !== 'linux' || !/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,255}$/.test(this.image)) return false;
      for (const name of cleanupPending) await removeContainer(name);
      const signal = this.lifetime.signal;
      const info = await command(['info', '--format=json'], { signal, outputBytes: 64 * 1024 });
      if (!succeeded(info)) return false;
      const host = JSON.parse(info.stdout.toString()).host;
      if (host?.security?.rootless !== true || host.security.seccompEnabled !== true || host.cgroupVersion !== 'v2'
        || !['cpu', 'memory', 'pids'].every((name) => host.cgroupControllers?.includes(name))
        || typeof host.security.seccompProfilePath !== 'string' || !host.security.seccompProfilePath.startsWith('/')) return false;
      this.seccompProfile = host.security.seccompProfilePath;
      const inspected = await command(['image', 'inspect', this.image], { signal, outputBytes: 64 * 1024 });
      if (!succeeded(inspected)) return false;
      const image = JSON.parse(inspected.stdout.toString())[0];
      if (image?.Labels?.['io.alexandria.runner.version'] !== '1' || !/^[a-f0-9]{64}$/.test(image.Id)) return false;
      // Resolve a mutable operator tag to its local immutable image ID. No
      // create/run command can pull or change toolchain during a cached probe.
      this.imageId = image.Id;
      return await this.sandbox(async () => true, signal);
    } catch {
      return false;
    }
  }

  run(userId: string, input: CodeRunInput, externalSignal?: AbortSignal): Promise<CodeRunResult> {
    if (this.closed || !this.enabled) return Promise.reject(unavailable());
    if (externalSignal?.aborted) return Promise.reject(cancelled());
    if (input.language !== 'cpp' || typeof input.source !== 'string' || input.source.trim().length === 0
      || typeof input.stdin !== 'string' || input.source.includes('\0') || input.stdin.includes('\0')
      || Buffer.byteLength(input.source) > CODE_RUNNER_LIMITS.sourceBytes
      || Buffer.byteLength(input.stdin) > CODE_RUNNER_LIMITS.stdinBytes) {
      return Promise.reject(new AppError(400, 'INVALID_CODE_RUN', 'Supply C++ source and input within the displayed limits.'));
    }
    const now = Date.now();
    for (const [user, until] of recentUsers) if (until <= now) recentUsers.delete(user);
    if (activeLease || (recentUsers.get(userId) ?? 0) > now) {
      return Promise.reject(new AppError(429, 'CODE_RUNNER_BUSY', 'The runner is busy. Wait a moment, then try again.'));
    }
    const lease = {};
    activeLease = lease;
    const signal = externalSignal ? AbortSignal.any([externalSignal, this.lifetime.signal]) : this.lifetime.signal;
    let attempted = false;
    this.running = (async () => {
      if (!(await this.status()).available) throw unavailable();
      if (signal.aborted) throw cancelled();
      attempted = true;
      const started = performance.now();
      return this.sandbox<CodeRunResult>(async (name) => {
        const compilation = await command(['exec', '--interactive', name, '/usr/local/lib/alexandria/compile.sh'], {
          input: input.source, signal, timeoutMs: CODE_RUNNER_LIMITS.compileSeconds * 1_000, outputBytes: CODE_RUNNER_LIMITS.outputBytes,
        });
        if (compilation.stop === 'abort' || signal.aborted) throw cancelled();
        if (compilation.failed || compilation.code === 125 || compilation.code === 126 || compilation.code === 127) throw unavailable();
        const compileOutput = text(Buffer.concat([compilation.stdout, compilation.stderr]));
        const base = { stdout: '', stderr: '', compileOutput, exitCode: null };
        if (compilation.stop) return { ...base, status: compilation.stop === 'output' ? 'output_limit' : 'time_limit', durationMs: Math.round(performance.now() - started) };
        if (compilation.code !== 0) return { ...base, status: 'compile_error', exitCode: compilation.code, durationMs: Math.round(performance.now() - started) };
        const remaining = CODE_RUNNER_LIMITS.outputBytes - compilation.stdout.length - compilation.stderr.length;
        const execution = await command(['exec', '--interactive', name, '/work/program'], {
          input: input.stdin, signal, timeoutMs: CODE_RUNNER_LIMITS.runSeconds * 1_000, outputBytes: remaining,
        });
        if (execution.stop === 'abort' || signal.aborted) throw cancelled();
        if (execution.failed) throw unavailable();
        return { stdout: text(execution.stdout), stderr: text(execution.stderr), compileOutput,
          status: execution.stop === 'output' ? 'output_limit' : execution.stop === 'timeout' ? 'time_limit'
            : execution.code === 0 ? 'success' : 'runtime_error',
          exitCode: execution.stop ? null : execution.code, durationMs: Math.round(performance.now() - started) };
      }, signal);
    })().catch((error: unknown) => {
      if (error instanceof AppError && error.statusCode === 503) this.cached = { value: this.availability(false), until: Date.now() + 10_000 };
      throw error instanceof AppError ? error : unavailable();
    }).finally(() => {
      if (activeLease === lease) activeLease = undefined;
      if (attempted) recentUsers.set(userId, Date.now() + cooldownMs);
      this.running = undefined;
    });
    return this.running;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.lifetime.abort();
    await Promise.allSettled([this.running, this.probing].filter((promise) => promise !== undefined));
  }
}

export function createCodeRunner(options: RunnerOptions = {}): CodeRunner {
  return new PodmanCodeRunner(options);
}
