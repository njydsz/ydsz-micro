/**
 * @YDSZ-core/form-ui 包 Vitest 配置
 *
 * v4.3.1 新增：此前本包测试（src/__tests__/use-form-context.test.ts）仅能通过
 * 根级 `vitest run` 触发，未纳入 `pnpm test`（turbo）流水线。
 * 现按「每包自持测试配置」原则补齐。
 *
 * 运行：pnpm -F @YDSZ-core/form-ui test
 *
 * @path comm/@core/ui-kit/form-ui/vitest.config.ts
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
