/**
 * @file ESLint 配置包构建配置
 * @author YDSZ Team
 * @since 2026-08-23
 */

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['eslint', 'typescript-eslint', '@eslint/js'],
    },
    sourcemap: true,
    minify: false,
  },
});
