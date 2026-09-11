import { closeSync, existsSync, lstatSync, mkdirSync, openSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Config } from '../config.js';
import { validateStoragePaths } from '../config.js';
import { assertMigrationHistory, initializeSchema } from './migrations.js';

export function configureDatabase(database: DatabaseSync): void {
  database.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA synchronous = FULL;');
  const mode = database.prepare('PRAGMA journal_mode = WAL').get() as { journal_mode: string };
  const foreignKeys = database.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
  const synchronous = database.prepare('PRAGMA synchronous').get() as { synchronous: number };
  if (mode.journal_mode !== 'wal' || foreignKeys.foreign_keys !== 1 || synchronous.synchronous !== 2) {
    throw new Error('SQLite could not enable the required WAL, foreign-key, and FULL durability settings.');
  }
}

export function assertDatabaseIntegrity(database: DatabaseSync): void {
  const checks = database.prepare('PRAGMA quick_check').all() as Array<{ quick_check: string }>;
  if (checks.length !== 1 || checks[0]?.quick_check !== 'ok') throw new Error('SQLite integrity check failed. Restore a verified backup.');
  if (database.prepare('PRAGMA foreign_key_check').all().length !== 0) throw new Error('SQLite foreign-key integrity check failed.');
}

function assertSafeSidecars(databasePath: string, requireAbsent = false): void {
  for (const suffix of ['-wal', '-shm', '-journal']) {
    try {
      const sidecar = lstatSync(`${databasePath}${suffix}`);
      if (requireAbsent) throw new Error('SQLite sidecar files already exist. Restore the existing database or choose a fresh DATABASE_PATH.');
      if (!sidecar.isFile()) {
        throw new Error('SQLite sidecar files must be regular files, not symbolic links or directories.');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

export function openDatabase(config: Config, options: { maintenance?: boolean; allowPending?: boolean } = {}): DatabaseSync {
  validateStoragePaths(config);
  try {
    const stat = lstatSync(config.databasePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('DATABASE_PATH must name a regular file, not a symbolic link.');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('Configured database is missing. Check the data volume, or explicitly run db:init for a new instance.');
    }
    throw error;
  }
  assertSafeSidecars(config.databasePath);

  // Runtime connections cannot create a database or mutate the catalog. All
  // schema writes belong to the explicit local maintenance commands.
  const database = new DatabaseSync(config.databasePath, { readOnly: !options.maintenance });
  try {
    configureDatabase(database);
    assertMigrationHistory(database, options.allowPending ?? false);
    assertDatabaseIntegrity(database);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

export function initializeDatabase(config: Config): void {
  validateStoragePaths(config);
  if (existsSync(config.databasePath)) {
    throw new Error('Database already exists. Initialization never replaces existing data; use db:migrate for upgrades.');
  }
  mkdirSync(dirname(config.databasePath), { recursive: true, mode: 0o700 });
  validateStoragePaths(config);
  assertSafeSidecars(config.databasePath, true);
  let reservation: number;
  try {
    reservation = openSync(config.databasePath, 'wx', 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('Database already exists. Initialization never replaces existing data; use db:migrate for upgrades.');
    }
    throw error;
  }
  closeSync(reservation);
  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(config.databasePath);
    configureDatabase(database);
    initializeSchema(database);
    assertMigrationHistory(database);
    assertDatabaseIntegrity(database);
  } catch (error) {
    database?.close();
    database = undefined;
    // Only remove files created by this unsuccessful explicit initialization.
    for (const suffix of ['', '-wal', '-shm']) {
      try { unlinkSync(`${config.databasePath}${suffix}`); } catch (cleanupError) {
        if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') throw cleanupError;
      }
    }
    throw error;
  } finally {
    database?.close();
  }
}
