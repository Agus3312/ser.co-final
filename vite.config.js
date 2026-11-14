import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        v2: resolve(import.meta.dirname, 'index-v2.html'),
        presupuesto: resolve(import.meta.dirname, 'presupuesto.html'),
        qr: resolve(import.meta.dirname, 'qr.html')
      }
    }
  }
});
