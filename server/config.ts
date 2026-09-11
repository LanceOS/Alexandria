import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Config {
  host: string;
  port: number;
  appOrigin?: string;
  dataDir: string;
  databasePath: string;
  backupDir: string;
  clientDir: string;
  projectRoot: string;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
}

const sourceParent = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultProjectRoot = basename(sourceParent) === 'dist' ? dirname(sourceParent) : sourceParent;

export function isWithin(parent: string, candidate: string): boolean {
  const rel = relative(parent, candidate);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

// Resolve existing ancestors as well as the leaf, so a symlink cannot hide an
// escape even when the configured database or backup directory does not exist.
export function canonicalPath(path: string): string {
  const resolved = resolve(path);
  if (existsSync(resolved)) return realpathSync(resolved);
  // existsSync follows symlinks; reject broken symlinks instead of treating
  // them as ordinary directories that can safely be created.
  try {
    if (lstatSync(resolved).isSymbolicLink()) throw new Error('A configured storage path contains a broken symbolic link.');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const parent = dirname(resolved);
  if (parent === resolved) throw new Error('Unable to resolve the configured storage path.');
  return join(canonicalPath(parent), basename(resolved));
}

function absolutePath(value: string, variable: string): string {
  if (!isAbsolute(value)) throw new Error(`${variable} must be an absolute path.`);
  return resolve(value);
}

export function validateStoragePaths(config: Pick<Config, 'dataDir' | 'databasePath' | 'backupDir' | 'projectRoot'>): void {
  const project = canonicalPath(config.projectRoot);
  const data = canonicalPath(config.dataDir);
  const database = canonicalPath(config.databasePath);
  const backups = canonicalPath(config.backupDir);

  if (isWithin(config.projectRoot, config.dataDir) || isWithin(project, data)) {
    throw new Error('DATA_DIR must be outside the application checkout.');
  }
  if (config.databasePath === config.dataDir || !isWithin(config.dataDir, config.databasePath)
      || database === data || !isWithin(data, database)) {
    throw new Error('DATABASE_PATH must remain inside DATA_DIR, including through symbolic links.');
  }
  if (isWithin(config.dataDir, config.backupDir) || isWithin(data, backups)
      || isWithin(config.backupDir, config.dataDir) || isWithin(backups, data)) {
    throw new Error('BACKUP_DIR and DATA_DIR must be separate, non-nested directories.');
  }
  if (isWithin(config.projectRoot, config.backupDir) || isWithin(project, backups)) {
    throw new Error('BACKUP_DIR must be outside the application checkout.');
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, projectRoot = defaultProjectRoot): Config {
  const dataDir = absolutePath(env.DATA_DIR ?? join(homedir(), '.local', 'share', 'alexandria'), 'DATA_DIR');
  const databasePath = absolutePath(env.DATABASE_PATH ?? join(dataDir, 'database', 'alexandria.sqlite'), 'DATABASE_PATH');
  const backupDir = absolutePath(env.BACKUP_DIR ?? join(dirname(dataDir), `${basename(dataDir)}-backups`), 'BACKUP_DIR');
  const portValue = env.PORT ?? '3000';
  if (!/^\d+$/.test(portValue) || Number(portValue) < 1 || Number(portValue) > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const host = env.HOST ?? '127.0.0.1';
  if (!host.trim() || host !== host.trim() || /[\s/]/.test(host)) throw new Error('HOST must be a hostname or IP address.');
  const logLevel = env.LOG_LEVEL ?? 'info';
  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(logLevel)) {
    throw new Error('LOG_LEVEL must be fatal, error, warn, info, debug, trace, or silent.');
  }

  let appOrigin: string | undefined;
  if (env.APP_ORIGIN) {
    try {
      const url = new URL(env.APP_ORIGIN);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
          || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid origin');
      appOrigin = url.origin;
    } catch {
      throw new Error('APP_ORIGIN must contain only an http(s) origin, such as http://localhost:3000.');
    }
  }
  const config: Config = {
    host,
    port: Number(portValue),
    ...(appOrigin ? { appOrigin } : {}),
    dataDir,
    databasePath,
    backupDir,
    clientDir: join(projectRoot, 'dist', 'client'),
    projectRoot: resolve(projectRoot),
    logLevel: logLevel as Config['logLevel'],
  };
  validateStoragePaths(config);
  return config;
}
