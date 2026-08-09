/**
 * @ydsz/micro-kernel 独立测试配置
 *
 * 包内自包含的 vitest 配置，不依赖根工作区配置。
 * 适用于：包级独立跑测试（pnpm --filter @ydsz/micro-kernel test）、
 * 以及根配置文件缺失或被外部清理时的兜底。
 *
 * @path comm/effects/micro-kernel/vitest.config.ts
 * @author ydsz-team
 * @since 4.2.1
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.spec.ts'],
    // happy-dom 由 workspace 根 node_modules 提供（pnpm hoisting）
    environment: 'happy-dom',
    coverage: {
      enabled: false,
    },
  },
});
