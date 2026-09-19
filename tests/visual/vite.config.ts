/**
 * Vite 配置 — 视觉回归测试 fixture 服务器。
 *
 * <p>仅用于静态服务 tests/visual/fixtures/index.html，不引入 Vue 完整构建链。
 * HTML fixture 使用原生 HTML + CSS 模拟 ydsz-ui 组件的标准渲染视觉效果，
 * 供 Playwright toHaveScreenshot() 视觉基线对比。
 *
 * @path tests/visual/vite.config.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'fixtures'),
  server: {
    port: 4311,
    strictPort: true,
  },
  preview: {
    port: 4311,
    strictPort: true,
  },
});
