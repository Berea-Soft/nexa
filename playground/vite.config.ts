import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@bereasoftware/nexa': resolve(__dirname, '../src'),
    },
  },
});
