import { accountArguments, accountPassword } from '../auth/command-input.js';
import { createAuthService } from '../auth/service.js';
import { openDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('account:password', async (config) => {
  const input = accountArguments(false);
  const password = await accountPassword(input.passwordStdin);
  const database = openDatabase(config, { writable: true });
  try {
    const user = await createAuthService(database, config).resetPassword(input.username, password);
    return { message: 'Password reset. All existing sessions for this account were revoked.', user };
  } finally {
    database.close();
  }
});
