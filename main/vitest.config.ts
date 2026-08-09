/**
 * main 基座应用 Vitest 配置
 *
 * 独立于 vite.config.mts（避免引入完整构建配置），仅覆盖单元测试所需：
 * happy-dom 环境 + @/# 路径别名。
 *
 * 运行：pnpm -F @ydsz/main-web test
 *
 * @path main/vitest.config.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/hooks/use-dashboard-data.ts',
        'src/store/notification.ts',
        'src/views/_core/subapp/composables/*.ts',
      ],
    },
  },
});
