import { loadNamedContent, readContentArgument } from '../content/content-catalog.js';
import { installContentBundle } from '../content/install-content.js';
import { createBackup, withMaintenanceLock } from '../db/backup.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('content:import', async (config) => {
  const name = readContentArgument(process.argv.slice(2), true)!;
  const bundle = loadNamedContent(name);
  return withMaintenanceLock(config, async () => {
    const database = openDatabase(config, { writable: true });
    try {
      const backupPath = await createBackup(config, database);
      const result = installContentBundle(database, bundle);
      return { message: result.created ? 'Curriculum content installed.' : 'Curriculum content already matches these files.', ...result, backupPath };
    } finally {
      database.close();
    }
  });
});
