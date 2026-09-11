import { AppError } from '../http/errors.js';

interface Bucket { count: number; expiresAt: number }

export class LoginRateLimitError extends AppError {
  constructor(readonly retryAfter: number) {
    super(429, 'LOGIN_RATE_LIMITED', 'Too many sign-in attempts. Try again later.');
  }
}

export class LoginThrottle {
  private readonly buckets = new Map<string, Bucket>();
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maximumBuckets = 10_000;

  consume(ip: string, username: string, now = Date.now()): void {
    const keys = [{ key: `ip:${ip}`, limit: 30 }, { key: `username:${username}`, limit: 10 }];
    if (this.buckets.size >= this.maximumBuckets - 2) {
      for (const [key, value] of this.buckets) if (value.expiresAt <= now) this.buckets.delete(key);
    }
    for (const { key, limit } of keys) {
      const bucket = this.buckets.get(key);
      if (bucket && bucket.expiresAt > now && bucket.count >= limit) {
        throw new LoginRateLimitError(Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000)));
      }
    }
    const additionalBuckets = keys.filter(({ key }) => !this.buckets.has(key)).length;
    if (this.buckets.size + additionalBuckets > this.maximumBuckets) throw new LoginRateLimitError(60);
    for (const { key } of keys) {
      const bucket = this.buckets.get(key);
      if (bucket && bucket.expiresAt > now) bucket.count += 1;
      else this.buckets.set(key, { count: 1, expiresAt: now + this.windowMs });
    }
  }
}
