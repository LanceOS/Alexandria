import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const apiPort = env.PORT || '3000';
  return {
    root: 'client',
    plugins: [react()],
    build: {
      outDir: '../dist/client',
      emptyOutDir: true,
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] },
      proxy: {
        '/api': `http://127.0.0.1:${apiPort}`,
        '/health': `http://127.0.0.1:${apiPort}`,
      },
    },
  };
});
