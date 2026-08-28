/**
 * comm/effects/shared-auth 单元测试配置
 *
 * 独立于根仓库 vitest.config.ts（根配置未注入 @ydsz/* 别名）。
 * sse-lifecycle 等模块仅依赖 ./sse（streamRequest），测试时对
 * streamRequest 打桩即可覆盖生命周期逻辑。
 *
 * 运行：pnpm -F @ydsz/shared-auth test
 *
 * @path comm/effects/shared-auth/vitest.config.ts
 * @author ydsz-team
 * @since 4.4.0
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
