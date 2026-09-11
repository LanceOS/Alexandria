import { accountArguments, accountPassword } from '../auth/command-input.js';
import { createAuthService } from '../auth/service.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('account:create', async (config) => {
  const input = accountArguments(true);
  const password = await accountPassword(input.passwordStdin);
  const database = openDatabase(config, { writable: true });
  try {
    const user = await createAuthService(database, config).createAccount({ ...input, password });
    return { message: 'Local account created.', user };
  } finally {
    database.close();
  }
});
