/**
 * common 配置模块
 *
 * @path conf\vite-config\src\config\common.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { UserConfig } from 'vite';

import { defineConfig } from 'vite';

/**
 * 构造所有项目共用的基础 Vite 配置。
 *
 * 历史曾注入 buffer/process/stream/crypto 等 Node 内置模块的浏览器 polyfill，
 * 审计确认无源码消费（浏览器原生 Web Crypto API 足以替代 crypto-browserify），
 * 已于 v3.1 移除以削减产物体积与构建耗时。
 *
 * 保留 global→globalThis 映射，兼容少数第三方库对 Node global 的引用。
 *
 * @returns 共用基础 Vite 配置对象
 */
async function getCommonConfig(): Promise<UserConfig> {
  return defineConfig({
    define: {
      global: 'globalThis',
    },
    resolve: {
      // v4.0 P0-3: 优先命中内部包的 `development` 条件（指向 ./src/*.ts），
      // 使 @ydsz-core/* 与 @ydsz/* 直接从源码参与构建。
      //
      // 必要性：内部包的 dist 由 mkdist 逐文件转译产出，其 `.vue` 产物在
      // node_modules 中被 Rollup 当作原生模块解析时会跳过 vue 插件（模板内的
      // TS 语法导致解析失败）。源码直连同时带来更快构建与热更新。
      //
      // 发布产物（default 条件）不受影响：仅在应用构建链路中追加该条件。
      conditions: ['development', 'module', 'browser', 'import', 'default'],
    },
    build: {
      chunkSizeWarningLimit: 500,
      reportCompressedSize: false,
      // v4.0 P0-3: 生产环境启用 hidden sourcemap（用于 Sentry 符号化）
      // 'hidden' 表示生成 .map 文件但不附加 source map 注释（浏览器不加载）
      // CI 中通过 sentry-cli 上传 .map 到 Sentry 进行符号化
      sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : false,
    },
  });
}

export { getCommonConfig };
