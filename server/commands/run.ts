import { loadConfig, type Config } from '../config.js';

export async function runCommand(command: string, work: (config: Config) => unknown | Promise<unknown>): Promise<void> {
  try {
    const result = await work(loadConfig());
    console.log(JSON.stringify({ level: 'info', command, ...result as Record<string, unknown> }));
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', command, message: error instanceof Error ? error.message : 'Command failed.' }));
    process.exitCode = 1;
  }
}
