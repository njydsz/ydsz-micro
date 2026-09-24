/**
 * main 基座应用的 Vite 构建配置。
 *
 * @remarks
 * 基于 {@code @ydsz/vite-config} 共享配置扩展：启用 CORS 供微前端子应用跨域访问。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from '@ydsz/vite-config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';

// Windows 统一使用正斜杠，Vite 别名兼容 Windows/Linux/macOS
const _toSlash = (p: string) => p.replace(/\\/g, '/');
const _appDir = dirname(fileURLToPath(import.meta.url));
const _ydszVueSrcDir = _toSlash(resolve(_appDir, 'comm/@core/ui-kit/ydsz-vue/src'));
const _mainSrcDir = _toSlash(fileURLToPath(new URL('./src', import.meta.url)));

/**
 * 自动扫描 ydzs-vue/src 下所有一级目录名，作为 @/ 前缀解析白名单。
 */
const _ydszVueRootDirs = new Set<string>();
try {
  const ydszVueDir = resolve(_appDir, 'comm/@core/ui-kit/ydsz-vue/src');
  readdirSync(ydszVueDir, { withFileTypes: true }).forEach(ent => {
    if (ent.isDirectory()) _ydszVueRootDirs.add(ent.name);
  });
} catch {
  // 扫描失败时后续 resolveId 全部返回 null（兜底安全）
}

/**
 * ydzs-vue 内部 @/ 别名解析插件。
 *
 * ydzs-vue 源码内部使用 @/shared、@/Popper 等裸路径别名，
 * 当导入源位于 ydzs-vue 包内时，将 @/xxx[/yyy] 解析到其自身 src 目录。
 *
 * 背景：ydsz-vue 直接以源码形式被消费（package.json#main → ./src/index.ts），
 * 其源码中的 @/ 引用不会自动解析到自身包内，需要在本插件中显式映射。
 */
function _ydzsVueAliasPlugin(): Plugin {
  const marker = '/comm/@core/ui-kit/ydsz-vue/src/';
  return {
    name: 'ydsz-vue-internal-alias',
    enforce: 'pre',

    resolveId(source, importer) {
      if (!source.startsWith('@/')) return null;
      if (!importer) return null;
      const normImporter = importer.replace(/\\/g, '/');
      if (!normImporter.includes(marker)) return null;

      const tail = source.slice(2); // 去掉 '@/'
      const rootName = tail.split('/')[0];
      if (!_ydszVueRootDirs.has(rootName)) return null;

      const resolved = `${_ydszVueSrcDir}/${tail}`;
      if (
        existsSync(resolved) ||
        existsSync(`${resolved}.ts`) ||
        existsSync(`${resolved}.vue`) ||
        existsSync(`${resolved}/index.ts`)
      ) {
        return resolved;
      }
      return null;
    },
  };
}

/**
 * 微前端基座（main-web）的 Vite 构建配置（默认导出）。
 *
 * 启用 CORS、PWA（Service Worker + manifest）；
 * 开发端口 5600。
 *
 * @default —— Vite defineConfig 产物
 */
export default defineConfig(async () => {
  return {
    application: {
      // 启用 PWA 支持（Service Worker 离线缓存）
      pwa: true,
      pwaOptions: {
        // 自定义 Workbox 配置（已在 vite-config 中配置默认值）
        workbox: {
          // 预缓存 HTML 入口
          globPatterns: ['**/*.{html,js,css}'],
          // vendor.js 通常 2-3MB（YDSZ Vue UI + VxeTable），默认 2 MiB 限制不够
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        },
        manifest: {
          name: 'YDSZ',
          short_name: 'YDSZ',
          description: 'YDSZ 项目管理系统',
          theme_color: '#409eff',
          background_color: '#ffffff',
        },
      },
    },
    vite: {
      resolve: {
        alias: {
          '@': _mainSrcDir,
        },
      },
      plugins: [_ydzsVueAliasPlugin()],
      server: {
        port: 5600,
        // 允许跨域，微前端子应用需要
        cors: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 开发环境通过 Gateway 9000 端口统一路由到各后端服务
            target: 'http://localhost:9000',
            ws: true,
          },
        },
      },
    },
  };
});
