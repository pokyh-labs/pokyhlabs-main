import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const backend = env.BACKEND_URL || 'http://localhost:3001';

  return {
    root: 'admin-src',
    plugins: [react()],
    build: {
      outDir: path.resolve(__dirname, 'public/admin'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    server: {
      port: parseInt(env.VITE_DEV_PORT || '5173'),
      proxy: {
        '/api': backend,
        '/uploads': backend,
      },
    },
    base: '/admin/',
  };
});
