import { defineConfig } from 'vite';

export default defineConfig({
  // Repo chạy ở https://ducminhtran.github.io/PM/ nên base phải là '/PM/'.
  // Thiếu dòng này thì mọi file JS/CSS bị tìm sai đường dẫn -> 404 -> trắng trang.
  base: '/PM/',
  server: { port: 5173, open: true },
  build: { target: 'es2020', sourcemap: true, outDir: 'dist' },
});
