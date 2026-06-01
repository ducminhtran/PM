import { defineConfig } from 'vite';

export default defineConfig({
  base: '/PM/',
  server: { port: 5173, open: true },
  build: { target: 'es2020', sourcemap: true },
  // History-API routing needs index.html served for unknown paths.
  // Vite dev server does this by default for SPAs.
});
