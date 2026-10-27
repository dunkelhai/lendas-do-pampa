import { defineConfig } from 'vite';

export default defineConfig({
  base: '/lendas-do-pampa/',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
