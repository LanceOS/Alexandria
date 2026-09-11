import { createBackup, withMaintenanceLock } from '../db/backup.js';
import { openDatabase } from '../db/database.js';
import { applyMigrations, assertMigrationHistory, migrations } from '../db/migrations.js';
import { runCommand } from './run.js';

await runCommand('db:migrate', (config) => withMaintenanceLock(config, async () => {
  const database = openDatabase(config, { maintenance: true, allowPending: true });
  try {
    if (assertMigrationHistory(database, true) === migrations.length) return { message: 'Database is already up to date.', applied: 0 };
    const backupPath = await createBackup(config, database);
    const applied = applyMigrations(database);
    return { message: 'Database migrations applied.', applied, backupPath };
  } finally {
    database.close();
  }
}));
