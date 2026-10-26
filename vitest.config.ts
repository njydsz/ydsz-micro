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
    // 不定义 '@' / '#'：`#/*` 由各包 package.json 的 imports 映射（Node/Vite subpath imports）
    // 解析到本包 src，全局别名会把 apps/* 的 '#/xxx' 误指向 main/src，导致按目录收集用例时解析漂移。
    alias: {
      '@ydsz/request': resolve(rootDir, 'comm/effects/request/src/index.ts'),
      '@ydsz-core/design-tokens/composables': resolve(rootDir, 'comm/@core/ui-kit/design-tokens/src/composables/index.ts'),
      '@ydsz-core/design-tokens/density': resolve(rootDir, 'comm/@core/ui-kit/design-tokens/src/tokens/density.ts'),
      '@ydsz-core/design-tokens': resolve(rootDir, 'comm/@core/ui-kit/design-tokens/src/index.ts'),
    },
  },
  test: {
    globals: true,
    // 全局注册 vitest-axe 的 toHaveNoViolations 匹配器（comm/** 与 apps/** 共用）
    setupFiles: ['vitest.setup.ts'],
    resolve: {
      dedupe: ['../src/i18n'],
    },
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
      include: ['apps/**/src/**/*.{ts,vue}', 'comm/**/src/**/*.{ts,vue}', 'main/src/**/*.{ts,vue}'],
      exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/index.ts'],
      thresholds: {
        lines: 25,
        branches: 15,
        functions: 20,
        statements: 25,
      },
    },
  },
});
