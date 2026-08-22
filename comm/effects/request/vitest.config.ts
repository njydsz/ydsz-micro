/**
 * comm/effects/request 单元测试配置
 *
 * 独立于根仓库 vitest.config.ts（根配置未注入 @ydsz/* 别名、且 type-aware 全量扫描较慢）。
 * 此处补齐 @ydsz/locales / @ydsz/utils 别名映射（来自 tsconfig.paths.json），
 * 并对含副作用的 locales 做轻量 mock，使拦截器等核心逻辑可独立测试。
 *
 * 运行：pnpm -F @ydsz/request test
 *
 * @path comm/effects/request/vitest.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ydsz/locales': fileURLToPath(
        new URL('../../locales/src/index.ts', import.meta.url),
      ),
      '@ydsz/utils': fileURLToPath(
        new URL('../../utils/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
  },
});
