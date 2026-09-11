import { installCppBasics } from '../content/cpp-basics.js';
import { createBackup, withMaintenanceLock } from '../db/backup.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('content:cpp-basics', (config) => withMaintenanceLock(config, async () => {
  const database = openDatabase(config, { writable: true });
  try {
    const backupPath = await createBackup(config, database);
    const result = installCppBasics(database);
    return { message: result.created ? 'C++ starter content installed.' : 'C++ starter content already matches this release.', ...result, backupPath };
  } finally {
    database.close();
  }
}));
