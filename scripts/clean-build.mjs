import { rmSync } from 'node:fs';

// Remove obsolete compiled files when source content or server modules move.
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
