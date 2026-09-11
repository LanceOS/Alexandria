import { createHash, randomUUID } from 'node:crypto';
import { closeSync, createReadStream, mkdirSync, openSync, unlinkSync, writeFileSync } from 'node:fs';
import { chmod, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import type { Config } from '../config.js';
import { validateStoragePaths } from '../config.js';
import { assertDatabaseIntegrity } from './database.js';

export async function withMaintenanceLock<T>(config: Config, work: () => Promise<T>): Promise<T> {
  validateStoragePaths(config);
  const lockPath = join(config.dataDir, '.maintenance.lock');
  let descriptor: number;
  try {
    descriptor = openSync(lockPath, 'wx', 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error('A maintenance lock exists. Stop overlapping commands; remove a stale .maintenance.lock only after confirming no maintenance process is running.');
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('DATA_DIR is missing. Check the volume or explicitly run db:init.');
    throw error;
  }
  try {
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    return await work();
  } finally {
    closeSync(descriptor);
    unlinkSync(lockPath);
  }
}

export async function createBackup(config: Config, source: DatabaseSync): Promise<string> {
  validateStoragePaths(config);
  mkdirSync(config.backupDir, { recursive: true, mode: 0o700 });
  validateStoragePaths(config);
  const staging = await mkdtemp(join(config.backupDir, '.pending-'));
  const snapshotPath = join(staging, 'alexandria.sqlite');
  try {
    await backup(source, snapshotPath);
    await chmod(snapshotPath, 0o600);
    const snapshot = new DatabaseSync(snapshotPath);
    let migrationHistory: unknown;
    let instance: unknown;
    try {
      // Checkpoint the snapshot's own journal state. Closing this writable
      // verification connection removes sidecars while retaining WAL mode for
      // the server's read-only connection after a restore.
      snapshot.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      assertDatabaseIntegrity(snapshot);
      migrationHistory = snapshot.prepare('SELECT id, checksum, applied_at AS appliedAt FROM schema_migrations ORDER BY id').all();
      instance = snapshot.prepare('SELECT id, created_at AS createdAt FROM instance_metadata WHERE singleton = 1').get();
      if (!instance) throw new Error('Backup verification failed: instance metadata is missing.');
    } finally {
      snapshot.close();
    }
    const digest = createHash('sha256');
    for await (const chunk of createReadStream(snapshotPath)) digest.update(chunk);
    const bytes = (await stat(snapshotPath)).size;
    const createdAt = new Date().toISOString();
    const manifest = {
      formatVersion: 1,
      application: 'alexandria',
      applicationVersion: '0.1.0',
      createdAt,
      instance,
      migrations: migrationHistory,
      files: [{ name: 'alexandria.sqlite', bytes, sha256: digest.digest('hex') }],
    };
    writeFileSync(join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    const destination = join(config.backupDir, `alexandria-${createdAt.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`);
    await rename(staging, destination);
    return destination;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}
