/**
 * main 基座应用的 Vite 构建配置。
 *
 * @remarks
 * 基于 {@code @ydsz/vite-config} 共享配置扩展：启用 CORS 供微前端子应用跨域访问。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { readdirSync } from 'node:fs';
import { defineConfig } from '@ydsz/vite-config';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';

/**
 * 微前端基座（main-web）的 Vite 构建配置（默认导出）。
 *
 * 启用 CORS、PWA（Service Worker + manifest）；
 * 开发端口 5600。
 *
 * @default —— Vite defineConfig 产物
 */
export default defineConfig(async () => {
  // Windows 统一使用正斜杠，Vite 别名兼容 Windows/Linux/macOS
  const toSlash = (p: string) => p.replace(/\\/g, '/');
  const mainSrcDir = toSlash(fileURLToPath(new URL('./src', import.meta.url)));
  const appDir = dirname(fileURLToPath(import.meta.url));
  const ydszVueSrcDir = toSlash(resolve(appDir, 'comm/@core/ui-kit/ydsz-vue/src'));

  /**
   * 自动扫描 ydsz-vue/src 下所有一级目录名，作为 @/ 前缀解析白名单。
   */
  const ydszVueRootDirs = (() => {
    const dirs = new Set<string>();
    try {
      const ydszVueDir = resolve(appDir, 'comm/@core/ui-kit/ydsz-vue/src');
      readdirSync(ydszVueDir, { withFileTypes: true }).forEach(ent => {
        if (ent.isDirectory()) dirs.add(ent.name);
      });
    } catch {
      // 扫描失败时的 fallback
    }
    return dirs;
  })();

  /**
   * 自定义路径解析插件：ydszz-vue 源码内部使用 @/shared、@/Popper 等裸路径别名。
   * 当导入源位于 ydsz-vue 包内时，将 @/xxx[/yyy] 解析到其自身 src 目录；
   * 否则回退到 main/src。
   */
  function ydzsVueAliasPlugin(): Plugin {
    return {
      name: 'ydsz-vue-internal-alias',
      enforce: 'pre',

      resolveId(source, importer) {
        if (!source.startsWith('@/')) return null;
        if (!importer) return null;
        const normImporter = importer.replace(/\\/g, '/');
        if (!normImporter.includes('/comm/@core/ui-kit/ydsz-vue/src/')) return null;

        const tail = source.slice(2);
        const rootName = tail.split('/')[0];
        if (!ydszVueRootDirs.has(rootName)) return null;

        const resolved = `${ydszVueSrcDir}/${tail}`;
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

  return {
    application: {
      pwa: true,
      pwaOptions: {
        workbox: {
          globPatterns: ['**/*.{html,js,css}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
          '@': mainSrcDir,
        },
      },
      plugins: [ydzsVueAliasPlugin()],
      server: {
        port: 5600,
        cors: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:9000',
            ws: true,
          },
        },
      },
    },
  };
});
