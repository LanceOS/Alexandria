import type { DatabaseSync } from 'node:sqlite';
import type { User } from '../../shared/auth.js';

const userColumns = `u.id, u.username, u.display_name AS displayName, u.role,
  u.status, u.created_at AS createdAt, u.updated_at AS updatedAt`;

export interface Credentials { user: User; passwordHash: string }
export interface StoredSession { user: User; tokenHash: string; csrfToken: string }

export class AuthRepository {
  constructor(private readonly database: DatabaseSync) {}

  credentials(username: string): Credentials | undefined {
    const row = this.database.prepare(`SELECT ${userColumns}, c.password_hash AS passwordHash
      FROM users u JOIN user_credentials c ON c.user_id = u.id WHERE u.username = ?`).get(username) as (User & { passwordHash: string }) | undefined;
    if (!row) return undefined;
    const { passwordHash, ...user } = row;
    return { user, passwordHash };
  }

  userByUsername(username: string): User | undefined {
    return this.database.prepare(`SELECT ${userColumns} FROM users u WHERE u.username = ?`).get(username) as User | undefined;
  }

  insertUser(user: User, passwordHash: string): void {
    this.database.prepare(`INSERT INTO users (id, username, display_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(user.id, user.username, user.displayName, user.role, user.status, user.createdAt, user.updatedAt);
    this.database.prepare('INSERT INTO user_credentials (user_id, password_hash, updated_at) VALUES (?, ?, ?)')
      .run(user.id, passwordHash, user.updatedAt);
  }

  updatePassword(userId: string, passwordHash: string, updatedAt: string): void {
    this.database.prepare('UPDATE user_credentials SET password_hash = ?, updated_at = ? WHERE user_id = ?').run(passwordHash, updatedAt, userId);
    this.database.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(updatedAt, userId);
    this.database.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }

  session(tokenHash: string, now: number): StoredSession | undefined {
    const row = this.database.prepare(`SELECT ${userColumns}, s.token_hash AS tokenHash, s.csrf_token AS csrfToken
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.created_at <= ? AND s.expires_at > ? AND u.status = 'active'`)
      .get(tokenHash, now, now) as (User & { tokenHash: string; csrfToken: string }) | undefined;
    if (!row) return undefined;
    const { tokenHash: hash, csrfToken, ...user } = row;
    return { user, tokenHash: hash, csrfToken };
  }

  insertSession(userId: string, tokenHash: string, csrfToken: string, now: number, expiresAt: number): void {
    this.database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
    // Bound persistent sessions for each account, allowing ten simultaneous browsers.
    this.database.prepare(`DELETE FROM sessions WHERE user_id = ? AND token_hash NOT IN
      (SELECT token_hash FROM sessions WHERE user_id = ? ORDER BY created_at DESC, token_hash DESC LIMIT 9)`).run(userId, userId);
    this.database.prepare('INSERT INTO sessions (token_hash, user_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(tokenHash, userId, csrfToken, now, expiresAt);
  }

  deleteSession(tokenHash: string): void {
    this.database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }
}
