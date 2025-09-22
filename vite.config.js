import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['@capacitor-community/http'],
    },
  },
  optimizeDeps: {
    exclude: ['@capacitor-community/http'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Alias opcional para blindaje web, descomenta si creas el shim:
      // '@capacitor-community/http': path.resolve(__dirname, 'src/shims/http-empty.js'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    },
    host: 'localhost',
    port: 5174,
    strictPort: true
  },
});
