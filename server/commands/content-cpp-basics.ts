import { loadNamedContent } from '../content/content-catalog.js';
import { installContentBundle } from '../content/install-content.js';
import { createBackup, withMaintenanceLock } from '../db/backup.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('content:cpp-basics', (config) => {
  const bundle = loadNamedContent('cpp');
  return withMaintenanceLock(config, async () => {
    const database = openDatabase(config, { writable: true });
    try {
      const backupPath = await createBackup(config, database);
      const result = installContentBundle(database, bundle);
      return { message: result.created ? 'C++ curriculum content installed.' : 'C++ curriculum content already matches these files.', ...result, backupPath };
    } finally {
      database.close();
    }
  });
});
