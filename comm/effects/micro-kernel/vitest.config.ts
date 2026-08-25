/**
 * micro-kernel 内核包 Vitest 配置
 *
 * 独立于根 vitest.config.ts（根配置开启 coverage.enabled 且缺少 provider 依赖，
 * 无法直接运行），仅覆盖内核单测所需：
 * - happy-dom 环境（沙箱/调度器依赖 DOM 与定时器）
 * - @YDSZ-core/composables 别名（use-locale-sync 引用；未声明为依赖时仍可解析）
 *
 * 运行：pnpm -F @ydsz/micro-kernel test
 *
 * @path comm/effects/micro-kernel/vitest.config.ts
 * @author ydsz-team
 * @since 4.3.0
 */
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // 与根 vitest.config.ts 对齐；依赖声明后（@YDSZ-core/composables）仍保留
      // 以兼容未执行 pnpm install 的增量场景
      '@YDSZ-core/composables': fileURLToPath(
        new URL('../../@core/composables/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
    coverage: {
      // 注意：@vitest/coverage-v8 未安装，勿开启 enabled，仅 --coverage 时生效
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/**/*.d.ts'],
    },
  },
});
