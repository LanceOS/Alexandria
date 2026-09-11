import { createBackup, withMaintenanceLock } from '../db/backup.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('db:backup', (config) => withMaintenanceLock(config, async () => {
  const database = openDatabase(config);
  try {
    const backupPath = await createBackup(config, database);
    return { message: 'Verified database backup completed.', backupPath };
  } finally {
    database.close();
  }
}));
