import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { AppError } from '../http/errors.js';

const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const prefix = 'scrypt$32768$8$3$';
const dummySalt = Buffer.alloc(16, 0x73);

export function validatePassword(password: string): void {
  if (typeof password !== 'string' || [...password].length < 12 || [...password].length > 256 || Buffer.byteLength(password, 'utf8') > 1024) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Password must contain 12 to 256 characters and at most 1024 UTF-8 bytes.');
  }
}

// Bound both active scrypt work (about 32 MiB each) and queued requests. The
// process never accumulates an unbounded hashing queue under a login flood.
export class PasswordHasher {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  private async derive(password: string, salt: Buffer): Promise<Buffer> {
    if (this.active >= 2) {
      if (this.queue.length >= 8) throw new AppError(429, 'AUTH_BUSY', 'Too many sign-in requests. Try again shortly.');
      await new Promise<void>((resolve) => { this.queue.push(resolve); });
    } else {
      this.active += 1;
    }
    try {
      return await new Promise<Buffer>((resolve, reject) => {
        scrypt(password, salt, 64, parameters, (error, result) => error ? reject(error) : resolve(result));
      });
    } finally {
      const next = this.queue.shift();
      if (next) next();
      else this.active -= 1;
    }
  }

  async hash(password: string): Promise<string> {
    validatePassword(password);
    const salt = randomBytes(16);
    const hash = await this.derive(password, salt);
    return `${prefix}${salt.toString('hex')}$${hash.toString('hex')}`;
  }

  async verify(password: string, encoded: string | undefined): Promise<boolean> {
    if (typeof password !== 'string' || [...password].length > 256 || Buffer.byteLength(password, 'utf8') > 1024) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Password exceeds the supported length.');
    }
    // Strictly accept our fixed cost parameters; corrupt stored parameters must
    // not be able to request arbitrary memory or CPU work.
    const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded ?? '');
    const salt = match ? Buffer.from(match[1]!, 'hex') : dummySalt;
    const expected = match ? Buffer.from(match[2]!, 'hex') : Buffer.alloc(64);
    const actual = await this.derive(password, salt);
    return timingSafeEqual(actual, expected) && match !== null;
  }
}
