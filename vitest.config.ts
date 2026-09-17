/**
 * Vitest 根配置 — 云顶编码规范 §16.10 测试框架统一入口
 *
 * <p>覆盖apps/*与comm/*下所有 *.test.ts 文件。子应用可拥有局部
 * vitest.config.ts 继承本配置并叠加别名与setup文件。
 *
 * @path vitest.config.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(rootDir, 'main/src'),
      '#': resolve(rootDir, 'apps/agent-web/src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: [
      'apps/**/*.test.{ts,tsx}',
      'comm/**/*.test.{ts,tsx}',
      'main/**/*.test.{ts,tsx}',
      'comm/**/src/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    // JUnit XML 供 CI 归档
    reporters: ['default', ['junit', { outputFolder: 'test-results', outputFile: 'junit.xml' }]],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['apps/**/src/**/*.ts', 'comm/**/src/**/*.ts', 'main/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/index.ts'],
      thresholds: {
        lines: 5,
        branches: 5,
        functions: 5,
        statements: 5,
      },
    },
  },
});
