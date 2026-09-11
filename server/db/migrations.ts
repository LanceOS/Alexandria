import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export interface Migration {
  id: string;
  sql: string;
  checksum: string;
}

export function defineMigration(id: string, sql: string): Migration {
  return { id, sql, checksum: createHash('sha256').update(sql).digest('hex') };
}

export const migrations: readonly Migration[] = [
  defineMigration('0001_library_foundation', `
    CREATE TABLE instance_metadata (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    ) STRICT;

    INSERT INTO instance_metadata (singleton, id, created_at)
    VALUES (1, lower(hex(randomblob(16))), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ) STRICT;

    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ) STRICT;

    CREATE TABLE topic_categories (
      topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
      PRIMARY KEY (topic_id, category_id)
    ) STRICT;

    CREATE INDEX category_order ON categories (status, position, id);
    CREATE INDEX topic_category_order ON topic_categories (category_id, position, topic_id);

    INSERT INTO categories (id, slug, name, description, position) VALUES
      ('category_software', 'software', 'Software & Computing', 'The ideas and systems behind the software we build.', 0),
      ('category_mathematics', 'mathematics', 'Mathematics', 'Patterns, structures, and the language of understanding.', 1),
      ('category_ai', 'artificial-intelligence', 'Artificial Intelligence', 'Learning, reasoning, and the possibilities of intelligent systems.', 2);
  `),
];

interface AppliedMigration {
  id: string;
  checksum: string;
}

export function assertMigrationHistory(database: DatabaseSync, allowPending = false, plan = migrations): number {
  const hasHistory = database.prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'schema_migrations'").get();
  if (!hasHistory) throw new Error('Database is not initialized by Alexandria. Run the explicit db:init command with a fresh database path.');
  const applied = database.prepare('SELECT id, checksum FROM schema_migrations ORDER BY id').all() as unknown as AppliedMigration[];
  for (let index = 0; index < applied.length; index += 1) {
    const actual = applied[index]!;
    const expected = plan[index];
    if (!expected || actual.id !== expected.id) {
      throw new Error('Database schema is incompatible with this release. Use the matching release or a verified backup.');
    }
    if (actual.checksum !== expected.checksum) {
      throw new Error(`Migration checksum mismatch for ${expected.id}. Applied migrations must not be edited.`);
    }
  }
  if (!allowPending && applied.length !== plan.length) {
    throw new Error('Database has pending migrations. Stop the server and run db:migrate before starting this release.');
  }
  return applied.length;
}

export function initializeSchema(database: DatabaseSync): void {
  database.exec('BEGIN IMMEDIATE');
  try {
    database.exec(`CREATE TABLE schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    ) STRICT`);
    for (const migration of migrations) {
      database.exec(migration.sql);
      database.prepare('INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)')
        .run(migration.id, migration.checksum, new Date().toISOString());
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function applyMigrations(database: DatabaseSync, plan = migrations): number {
  let count = 0;
  // The maintenance command holds a file lock around backup + migration. Each
  // migration also takes SQLite's write lock and rechecks the recorded history.
  for (;;) {
    database.exec('BEGIN IMMEDIATE');
    try {
      const applied = assertMigrationHistory(database, true, plan);
      const migration = plan[applied];
      if (!migration) {
        database.exec('COMMIT');
        return count;
      }
      database.exec(migration.sql);
      database.prepare('INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)')
        .run(migration.id, migration.checksum, new Date().toISOString());
      database.exec('COMMIT');
      count += 1;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }
}
