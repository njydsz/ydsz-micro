/**
 * Vite 插件：构建时生成 manifest.json 供 micro-kernel 加载。
 *
 * 约定：子应用必须输出 manifest.json（含 entry、css、版本号），
 * micro-kernel 通过 fetch manifest.json 获取入口信息，免去 HTML entry 解析。
 *
 * 路径处理：使用 Vite 配置的 base 前缀拼接，确保在子路径部署
 * （如 /YDSZ-workflow-web/）下 entry/css 路径正确，不再硬编码 `/` 根路径。
 *
 * 在共享 vite-config 中作为可选插件引入。
 *
 * @path comm/effects/micro-kernel/src/vite-plugin-manifest.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { Plugin } from 'vite';
import { createHash } from 'node:crypto';

import { createLogger } from '@YDSZ-core/shared/utils';

const logger = createLogger('MicroKernel:ManifestPlugin');

/**
 * 计算构建产物内容的 sha256（SRI 格式前缀）。
 *
 * CSS 哈希写入 manifest.integrity.css，loader 注入样式表时附加
 * integrity + crossorigin 完成浏览器级 SRI 校验；
 * JS 哈希写入 manifest.integrity.js——浏览器 dynamic import 不支持
 * integrity 属性，该清单供 strictIntegrity 加载模式（loader 先取文本
 * 验签再 import）与未来 Service Worker 校验使用。
 */
function sha256Sri(content: string | Uint8Array): string {
  return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

/** 子应用 manifest.json 中声明的路由级骨架屏配置（与 loader.ts ManifestRoute 对齐） */
export interface ManifestPluginRoute {
  /** 路由前缀（相对于子应用 basename 的子路径，如 '/users'、'/detail'） */
  path: string;
  /** 骨架屏类型（list/form/detail/dashboard/default） */
  skeletonType?: string;
}

/** Vite Manifest 插件配置项：子应用名称与可选版本号 */
export interface ManifestPluginOptions {
  /** 子应用名称 */
  name: string;
  /** 子应用版本（建议取 package.json version + build hash） */
  version?: string;
  /**
   * v4.4.1 F3: mount props 契约指纹（可选）。
   *
   * 子应用对宿主注入 props 的消费面声明（如生命周期钩子集合的规范化
   * 签名串）。构建期写入 manifest.propsContract，kernel 在激活前比对
   * 宿主侧契约与子应用声明——灰度（canary）场景下运行时可能加载旧版本
   * 子应用，props 契约与宿主新代码不匹配时提前降级，替代事后 semver 断言。
   *
   * 推荐取值：子应用消费的 props 键集合排序拼接后哈希，
   * 如 `sha256(container|basename|globalState|messageBus)`。
   *
   * @example
   *   propsContract: 'sha256-aW5zdGFuY2U='
   */
  propsContract?: string;
  /**
   * 路由级骨架屏配置（v3.3 新增，可选）。
   *
   * 子应用按自身路由前缀声明骨架屏类型，构建期写入 manifest.json，
   * 主应用容器加载 manifest 后据此匹配当前路由子路径，渲染对应骨架屏。
   *
   * @example
   *   routes: [
   *     { path: '/users', skeletonType: 'list' },
   *     { path: '/dashboard', skeletonType: 'dashboard' },
   *     { path: '/form', skeletonType: 'form' },
   *   ]
   */
  routes?: ManifestPluginRoute[];
}

/** 创建构建期生成 manifest.json 的 Vite 插件，供 micro-kernel 加载子应用入口与样式 */
export function viteManifestPlugin(options: ManifestPluginOptions): Plugin {
  const appName = options.name;
  const appVersion = options.version ?? '0.0.0';
  let base = '/';

  return {
    name: 'YDSZ:micro-manifest',

    // 仅在 build 阶段启用
    apply: 'build',

    /** 捕获 Vite 解析后的 base 配置（如 /YDSZ-workflow-web/），供路径拼接使用 */
    configResolved(config) {
      base = config.base;
    },

    generateBundle(_options, bundle) {
      // 找到入口 chunk
      const entryChunk = Object.values(bundle).find(
        (chunk) => chunk.type === 'chunk' && chunk.isEntry,
      );

      if (!entryChunk || entryChunk.type !== 'chunk') {
        logger.warn(`No entry chunk found for ${appName}`);
        return;
      }

      // 收集 CSS 文件，使用 base 前缀确保子路径部署正确。
      // 注：以宽松结构类型收窄，规避各 Vite/rollup 版本间 OutputBundle
      // 谓词兼容性差异（source/code 在部分版本类型声明中为可选）。
      type LooseBundleItem = {
        type: string;
        fileName: string;
        source?: string | Uint8Array;
        code?: string;
      };
      const bundleItems = Object.values(bundle) as unknown as LooseBundleItem[];

      const cssAssets = bundleItems.filter(
        (asset) => asset.type === 'asset' && asset.fileName.endsWith('.css'),
      );
      const cssFiles = cssAssets.map((asset) => `${base}${asset.fileName}`);

      // v4.4.0: 收集 JS chunk 并计算 sha256（entry + 全部分包）
      const jsChunks = bundleItems.filter((chunk) => chunk.type === 'chunk');

      const manifest: Record<string, unknown> = {
        name: appName,
        entry: `${base}${entryChunk.fileName}`,
        css: cssFiles,
        version: appVersion,
      };

      // v4.4.0: 产物完整性清单（CSS 浏览器级 SRI；JS 供 strictIntegrity/SW 校验）
      if (cssAssets.length > 0 || jsChunks.length > 0) {
        const integrity: Record<string, Record<string, string>> = {};
        const cssIntegrity: Record<string, string> = {};
        for (const asset of cssAssets) {
          cssIntegrity[`${base}${asset.fileName}`] = sha256Sri(asset.source ?? '');
        }
        const jsIntegrity: Record<string, string> = {};
        for (const chunk of jsChunks) {
          jsIntegrity[`${base}${chunk.fileName}`] = sha256Sri(chunk.code ?? '');
        }
        if (Object.keys(cssIntegrity).length > 0) integrity.css = cssIntegrity;
        if (Object.keys(jsIntegrity).length > 0) integrity.js = jsIntegrity;
        if (Object.keys(integrity).length > 0) manifest.integrity = integrity;
      }

      // v3.3: 透传路由级骨架屏配置（可选）
      if (Array.isArray(options.routes) && options.routes.length > 0) {
        manifest.routes = options.routes;
      }

      // v4.4.1 F3: 透传 mount props 契约指纹（可选，供 kernel 激活前灰度校验）
      if (options.propsContract) {
        manifest.propsContract = options.propsContract;
      }

      // 追加 manifest.json 到产物（loader.ts 对应 fetch manifest.json）
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest),
      });

      logger.info(`Generated manifest for ${appName}`, { manifest });
    },
  };
}
