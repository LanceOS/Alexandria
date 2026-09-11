import { parseArgs } from 'node:util';
import { emitKeypressEvents } from 'node:readline';

export interface AccountArguments {
  username: string;
  displayName: string;
  role: 'admin' | 'member';
  passwordStdin: boolean;
}

export function accountArguments(create: boolean, args = process.argv.slice(2)): AccountArguments {
  let values;
  try {
    ({ values } = parseArgs({
      args,
      strict: true,
      allowPositionals: false,
      options: {
        username: { type: 'string' },
        'password-stdin': { type: 'boolean', default: false },
        ...(create ? { 'display-name': { type: 'string' as const }, role: { type: 'string' as const } } : {}),
      },
    }));
  } catch {
    // parseArgs errors can include positional values. Never echo arbitrary
    // arguments because an operator may have accidentally put a secret there.
    throw new Error(`Invalid arguments. Use --username${create ? ', optional --display-name and --role' : ''}, and optional --password-stdin. Never pass passwords as arguments.`);
  }
  if (typeof values.username !== 'string') throw new Error('Supply --username. Passwords must use a hidden terminal prompt or --password-stdin.');
  const role = values.role ?? 'admin';
  if (role !== 'admin' && role !== 'member') throw new Error('--role must be admin or member.');
  return {
    username: values.username,
    displayName: typeof values['display-name'] === 'string' ? values['display-name'] : values.username,
    role,
    passwordStdin: values['password-stdin'] === true,
  };
}

async function readStdinPassword(): Promise<string> {
  if (process.stdin.isTTY) throw new Error('--password-stdin requires piped input. Omit it to use the hidden terminal prompt.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += buffer.length;
    if (size > 1026) throw new Error('Password input exceeds the supported length.');
    chunks.push(buffer);
  }
  const password = Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
  if (/[\r\n]/.test(password)) throw new Error('--password-stdin accepts exactly one password line.');
  return password;
}

function hiddenPrompt(label: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stderr.isTTY) throw new Error('Use --password-stdin with a pipe, or run this command in a terminal for a hidden password prompt.');
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const previousRaw = input.isRaw;
    const previouslyPaused = input.isPaused();
    let value = '';
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    process.stderr.write(label);
    const finish = (error?: Error) => {
      input.removeListener('keypress', onKey);
      input.removeListener('end', onEnd);
      input.removeListener('error', onError);
      input.setRawMode(previousRaw);
      if (previouslyPaused) input.pause();
      process.stderr.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onEnd = () => finish(new Error('Password input ended before confirmation.'));
    const onError = () => finish(new Error('Could not read password input.'));
    const onKey = (text: string | undefined, key: { name?: string; ctrl?: boolean; meta?: boolean }) => {
      if (key.ctrl && (key.name === 'c' || key.name === 'd')) return finish(new Error('Password entry cancelled.'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') { value = [...value].slice(0, -1).join(''); return; }
      if (!text || key.ctrl || key.meta || /[\x00-\x1f\x7f]/.test(text)) return;
      value += text;
      if (Buffer.byteLength(value, 'utf8') > 1024 || [...value].length > 256) finish(new Error('Password input exceeds the supported length.'));
    };
    input.on('keypress', onKey);
    input.once('end', onEnd);
    input.once('error', onError);
  });
}

export async function accountPassword(passwordStdin: boolean): Promise<string> {
  if (passwordStdin) return readStdinPassword();
  const password = await hiddenPrompt('New password (hidden): ');
  const confirmation = await hiddenPrompt('Confirm password (hidden): ');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  return password;
}
