import type { DatabaseSync } from 'node:sqlite';

const depth = new WeakMap<DatabaseSync, number>();

/** Keep all work synchronous so no other request can enter a transaction. */
export function transaction<T>(database: DatabaseSync, work: () => T): T {
  const level = depth.get(database) ?? 0;
  const savepoint = `alexandria_${level}`;
  database.exec(level === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${savepoint}`);
  depth.set(database, level + 1);
  try {
    const result = work();
    if (result && typeof (result as { then?: unknown }).then === 'function') {
      throw new Error('Database transaction callbacks must be synchronous.');
    }
    database.exec(level === 0 ? 'COMMIT' : `RELEASE SAVEPOINT ${savepoint}`);
    return result;
  } catch (error) {
    database.exec(level === 0 ? 'ROLLBACK' : `ROLLBACK TO SAVEPOINT ${savepoint}; RELEASE SAVEPOINT ${savepoint}`);
    throw error;
  } finally {
    depth.set(database, level);
  }
}
