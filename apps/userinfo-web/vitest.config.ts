/**
 * userinfo-web 子应用 Vitest 配置
 *
 * 独立于 vite.config（避免引入完整构建配置），仅覆盖单元测试所需：
 * happy-dom 环境 + # 路径别名（对应 package.json 的 imports["#/*"]）。
 *
 * 运行：pnpm -F @ydsz/userinfo-web test
 *
 * @path apps/userinfo-web/vitest.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import Vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [Vue()],
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/api/**/*.ts', 'src/store/**/*.ts'],
    },
  },
});
