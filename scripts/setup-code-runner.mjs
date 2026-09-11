import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Setup is an explicit operator action. Application startup never downloads an
// image and never builds or executes learner source on the host.
const directory = fileURLToPath(new URL('../runner/', import.meta.url));
const image = process.env.CODE_RUNNER_IMAGE ?? 'localhost/alexandria-cpp-runner:1';
if (!/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]{0,255}$/.test(image)) throw new Error('CODE_RUNNER_IMAGE must be a container image reference.');
const result = spawnSync('podman', ['--remote=false', 'build', '--pull=missing', '--network=none',
  '--tag', image, '--file', `${directory}Containerfile`, directory], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
