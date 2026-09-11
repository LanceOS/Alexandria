import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { FastifyRequest } from 'fastify';
import type { LoginInput, SessionResponse, User } from '../../shared/auth.js';
import type { Config } from '../config.js';
import { transaction } from '../db/transaction.js';
import { AppError } from '../http/errors.js';
import { PasswordHasher, validatePassword } from './password.js';
import { AuthRepository, type StoredSession } from './repository.js';
import { LoginThrottle } from './throttle.js';

export const sessionCookieName = 'alexandria_session';
export const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

interface AccountInput { username: string; displayName: string; role: User['role']; password: string }

export function normalizeUsername(username: string): string {
  if (typeof username !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{2,39}$/.test(username)) {
    throw new AppError(400, 'INVALID_USERNAME', 'Username must contain 3 to 40 ASCII letters, numbers, dots, underscores, or hyphens and start with a letter or number.');
  }
  return username.toLowerCase();
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function cookieToken(request: FastifyRequest): string | undefined {
  const raw = request.headers.cookie;
  if (!raw) return undefined;
  const matches = raw.split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${sessionCookieName}=`));
  // Reject duplicate cookies rather than selecting an ambiguous identity.
  if (matches.length !== 1) return undefined;
  const token = matches[0]!.slice(sessionCookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly hasher = new PasswordHasher();
  private readonly throttle = new LoginThrottle();

  constructor(private readonly database: DatabaseSync, private readonly config: Pick<Config, 'appOrigin'>) {
    this.repository = new AuthRepository(database);
  }

  private cookie(token: string, expires = false): string {
    return `${sessionCookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${expires ? 0 : sessionLifetimeMs / 1000}${this.config.appOrigin?.startsWith('https:') ? '; Secure' : ''}`;
  }

  private authenticatedSession(request: FastifyRequest): StoredSession | undefined {
    const token = cookieToken(request);
    return token ? this.repository.session(tokenHash(token), Date.now()) : undefined;
  }

  session(request: FastifyRequest): SessionResponse {
    const session = this.authenticatedSession(request);
    return session ? { user: session.user, csrfToken: session.csrfToken } : { user: null };
  }

  requireUser(request: FastifyRequest): User {
    const session = this.authenticatedSession(request);
    if (!session) throw new AppError(401, 'AUTH_REQUIRED', 'Sign in to continue.');
    return session.user;
  }

  requireAdmin(request: FastifyRequest): User {
    const user = this.requireUser(request);
    if (user.role !== 'admin') throw new AppError(403, 'ADMIN_REQUIRED', 'Administrator access is required.');
    return user;
  }

  verifyCsrf(request: FastifyRequest): void {
    const session = this.authenticatedSession(request);
    if (!session) throw new AppError(401, 'AUTH_REQUIRED', 'Sign in to continue.');
    const supplied = request.headers['x-csrf-token'];
    if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied)
        || !timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(session.csrfToken, 'hex'))) {
      throw new AppError(403, 'CSRF_INVALID', 'A valid session CSRF token is required.');
    }
  }

  async login(input: LoginInput, ip: string): Promise<{ user: User; csrfToken: string; cookie: string }> {
    const username = normalizeUsername(input.username);
    this.throttle.consume(ip, username);
    const credentials = this.repository.credentials(username);
    const verified = await this.hasher.verify(input.password, credentials?.passwordHash);
    if (!verified || credentials?.user.status !== 'active') {
      throw new AppError(401, 'LOGIN_FAILED', 'Username or password is incorrect.');
    }
    const token = randomBytes(32).toString('hex');
    const csrfToken = randomBytes(32).toString('hex');
    const user = transaction(this.database, () => {
      // A password reset or disable while scrypt runs must not create a session
      // from credentials that are no longer valid.
      const current = this.repository.credentials(username);
      if (!current || current.user.status !== 'active' || current.passwordHash !== credentials.passwordHash) {
        throw new AppError(401, 'LOGIN_FAILED', 'Username or password is incorrect.');
      }
      const now = Date.now();
      this.repository.insertSession(current.user.id, tokenHash(token), csrfToken, now, now + sessionLifetimeMs);
      return current.user;
    });
    return { user, csrfToken, cookie: this.cookie(token) };
  }

  logout(request: FastifyRequest): string {
    this.verifyCsrf(request);
    this.repository.deleteSession(tokenHash(cookieToken(request)!));
    return this.cookie('', true);
  }

  async createAccount(input: AccountInput): Promise<User> {
    const username = normalizeUsername(input.username);
    const displayName = input.displayName.trim();
    if (!displayName || [...displayName].length > 100 || /[\x00-\x1f\x7f]/.test(displayName)) {
      throw new AppError(400, 'INVALID_DISPLAY_NAME', 'Display name must contain 1 to 100 characters without control characters.');
    }
    if (input.role !== 'admin' && input.role !== 'member') throw new AppError(400, 'INVALID_ROLE', 'Role must be admin or member.');
    validatePassword(input.password);
    const passwordHash = await this.hasher.hash(input.password);
    return transaction(this.database, () => {
      if (this.repository.userByUsername(username)) throw new AppError(409, 'USERNAME_EXISTS', 'Username is already in use.');
      const now = new Date().toISOString();
      const user: User = { id: randomUUID(), username, displayName, role: input.role, status: 'active', createdAt: now, updatedAt: now };
      this.repository.insertUser(user, passwordHash);
      return user;
    });
  }

  async resetPassword(usernameInput: string, password: string): Promise<User> {
    const username = normalizeUsername(usernameInput);
    if (!this.repository.credentials(username)) throw new AppError(404, 'USER_NOT_FOUND', 'The account does not exist.');
    const passwordHash = await this.hasher.hash(password);
    return transaction(this.database, () => {
      const current = this.repository.credentials(username);
      if (!current) throw new AppError(404, 'USER_NOT_FOUND', 'The account does not exist.');
      const updatedAt = new Date(Math.max(Date.now(), Date.parse(current.user.updatedAt))).toISOString();
      this.repository.updatePassword(current.user.id, passwordHash, updatedAt);
      return { ...current.user, updatedAt };
    });
  }
}

export function createAuthService(database: DatabaseSync, config: Pick<Config, 'appOrigin'>): AuthService {
  return new AuthService(database, config);
}
