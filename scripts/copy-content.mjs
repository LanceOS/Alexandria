import { cpSync, rmSync } from 'node:fs';

// Resolve from this script so a compiled release is independent of the caller's cwd.
const source = new URL('../content/', import.meta.url);
const destination = new URL('../dist/content/', import.meta.url);
rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true, dereference: false });
