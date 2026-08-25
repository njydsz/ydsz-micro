/**
 * @ydsz/shared-business 包 Vitest 配置
 *
 * v4.3.1 新增：此前本包测试（src/realtime/__tests__/realtime-client.test.ts）
 * 仅能通过根级 `vitest run` 触发，未纳入 `pnpm test`（turbo）流水线。
 * 现按「每包自持测试配置」原则补齐。
 *
 * 运行：pnpm -F @ydsz/shared-business test
 *
 * @path comm/effects/shared-business/vitest.config.ts
 * @author ydsz-team
 * @since 4.3.1
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts'],
    },
  },
});
