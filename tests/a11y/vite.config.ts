/**
 * Vite 配置 — 无障碍冒烟测试 fixture 服务器。
 *
 * <p>仅用于静态服务 tests/a11y/fixtures/index.html，不引入 Vue/ydsz-ui 构建。
 * HTML fixture 使用原生 HTML + CSS 模拟 ydsz-ui 组件，供 Playwright + axe 扫描。
 *
 * @path tests/a11y/vite.config.ts
 * @author ydsz-team
 * @since 27.01.04
 */

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'fixtures'),
  server: {
    port: 4310,
    strictPort: true,
  },
  preview: {
    port: 4310,
    strictPort: true,
  },
});
