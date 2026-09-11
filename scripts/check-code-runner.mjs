import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Opt-in tests compile adversarial examples only inside the configured sandbox.
const project = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'server/services/code-runner.integration.test.ts'], {
  cwd: project, stdio: 'inherit', env: { ...process.env, ALEXANDRIA_RUNNER_INTEGRATION: '1' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
