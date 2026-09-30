import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function apiTarget() {
  try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '../server/.env'), 'utf8');
    const match = envFile.match(/^PORT=(\d+)/m);
    if (match) return `http://127.0.0.1:${match[1]}`;
  } catch {
    // Fall back to the default API port when server/.env is absent.
  }
  return 'http://127.0.0.1:5000';
}

const target = apiTarget();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/uploads': { target, changeOrigin: true },
    },
  },
});
