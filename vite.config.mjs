import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Importante para Capacitor: rutas relativas en assets
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Evita incluir sourcemaps en builds móviles para no inflar el APK
    // Activa VITE_MOBILE=1 en el script de build móvil
    sourcemap: (process.env.VITE_MOBILE === '1') ? false : true
  },
});
