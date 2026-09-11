import { buildApp } from './app.js';
import { loadConfig } from './config.js';

try {
  const config = loadConfig();
  const app = await buildApp(config, { requireClient: process.env.NODE_ENV === 'production' || import.meta.url.endsWith('.js') });
  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Shutting down Alexandria');
    const deadline = setTimeout(() => {
      app.log.error('Graceful shutdown timed out');
      process.exit(1);
    }, 10_000);
    deadline.unref();
    try {
      await app.close();
    } catch (error) {
      app.log.error({ err: error }, 'Shutdown failed');
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  };
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  try {
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    await app.close();
    throw error;
  }
} catch (error) {
  console.error(JSON.stringify({ level: 'error', message: error instanceof Error ? error.message : 'Server startup failed.' }));
  process.exitCode = 1;
}
