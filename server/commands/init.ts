import { initializeDatabase } from '../db/database.js';
import { runCommand } from './run.js';

await runCommand('db:init', (config) => {
  initializeDatabase(config);
  return { message: 'Database initialized. The library has three categories and no topics.' };
});
