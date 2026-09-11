import { loadContentCatalog, readImportContentNames } from '../content/content-catalog.js';
import { installContentBundle, installContentCatalog } from '../content/install-content.js';
import { createBackup, withMaintenanceLock } from '../db/backup.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('content:import', async (config) => {
  const bundles = loadContentCatalog(readImportContentNames(process.argv.slice(2)));
  return withMaintenanceLock(config, async () => {
    const database = openDatabase(config, { writable: true });
    try {
      const backupPath = await createBackup(config, database);
      const result = bundles.length === 1 ? installContentBundle(database, bundles[0]!) : installContentCatalog(database, bundles);
      return { message: result.created ? 'Curriculum content installed.' : 'Curriculum content already matches these files.', ...result, backupPath };
    } finally {
      database.close();
    }
  });
});
