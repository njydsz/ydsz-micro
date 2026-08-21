/**
 * 参考 https://github.com/jspm/vite-plugin-jspm，调整为需要的功能
 *
 * v3.1 新增 selfHostBase 选项：当指定时，跳过 jspm generator 的公网 CDN 解析，
 * 改为生成指向同源 `/vendor/<pkg>@<version>/` 路径的 importmap，消除公网 CDN SPOF。
 * 配合 `bash/sync-shared-deps.mjs` 将 ESM 产物预下载到 public/vendor/ 即可自托管。
 *
 * 自托管 importmap 来源优先级：
 *   1. `public/vendor/importmap.json`（sync 脚本生成，含完整传递依赖与 scopes）
 *   2. 简易路径映射 `buildSelfHostedImportMap`（仅顶层依赖，适合快速验证）
 *
 * v3.2 新增 importmap 生成缓存：CDN 模式下，jspm Generator 的安装结果
 * 会被缓存到 `node_modules/.cache/importmap/<hash>.json`，依赖列表未变时
 * 直接复用，跳过公网 CDN 解析。TTL 默认 7 天，可通过环境变量
 * `IMPORTMAP_CACHE_TTL`（毫秒）调整，`IMPORTMAP_NO_CACHE=1` 可强制跳过。
 */
import type { GeneratorOptions } from '@jspm/generator';
import type { Plugin } from 'vite';

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { Generator } from '@jspm/generator';
import { minify } from 'html-minifier-terser';

import {
  buildSelfHostedImportMap,
  getShimsUrl,
  injectShimsToHtml,
} from './importmap-helpers';
import {
  DEFAULT_PROVIDER,
  getCacheKey,
  isCacheDisabled,
  readCachedImportMap,
  writeCachedImportMap,
} from './importmap-cache';

/** importmap 插件选项：在 jspm GeneratorOptions 基础上扩展依赖列表与供应商 */
export type pluginOptions = GeneratorOptions & {
  debug?: boolean;
  defaultProvider?: 'esm.sh' | 'jsdelivr' | 'jspm.io';
  importmap?: Array<{ name: string; range?: string }>;
  /**
   * 自托管基路径（如 `/vendor`）。指定后：
   * - 跳过 jspm generator 公网解析
   * - importmap 各项指向 `${selfHostBase}/<pkg>@<range>/index.js`
   * - 需配合 `bash/sync-shared-deps.mjs` 预下载 ESM 产物到 public/vendor/
   * - es-module-shims 也从同源 `/vendor/es-module-shims/` 加载
   */
  selfHostBase?: string;
};

let generator: Generator;
/** CDN 模式下安装后的 importmap（可能来自缓存或在线生成） */
let resolvedImportMap: unknown | null = null;

/**
 * 通过 CDN 以 importmap 方式加载指定依赖的 Vite 插件（参考 vite-plugin-jspm 改造）。
 *
 * 在构建阶段将声明的依赖通过 jspm generator 安装为 external，并在 HTML 注入
 * importmap 与 es-module-shims 垫片，使其走 CDN 加载；非构建或 SSR 下不生效。
 *
 * v3.2：CDN 模式下优先读取磁盘缓存，依赖列表未变且未过期时跳过公网解析。
 *
 * @param pluginOptions - 插件选项（CDN 供应商、依赖列表、调试开关）
 * @returns 由 external / install / html 三段组成的 Vite 插件数组
 */
async function viteImportMapPlugin(
  pluginOptions?: pluginOptions,
): Promise<Plugin[]> {
  const { importmap, selfHostBase } = pluginOptions || {};

  let isSSR = false;
  let isBuild = false;
  let installed = false;
  let installError: Error | null = null;

  const options: pluginOptions = Object.assign(
    {},
    {
      debug: false,
      defaultProvider: 'jspm.io',
      env: ['production', 'browser', 'module'],
      importmap: [],
    },
    pluginOptions,
  );

  // 自托管模式：优先读取 sync 脚本预生成的 importmap.json（含完整传递依赖），
  // 不存在时回退到简易路径映射（仅顶层依赖，用于快速验证）
  let selfHostedImportMap: { imports: Record<string, string> } | null = null;
  if (selfHostBase) {
    const importmapFile = path.join(process.cwd(), 'public', 'vendor', 'importmap.json');
    if (existsSync(importmapFile)) {
      try {
        selfHostedImportMap = JSON.parse(readFileSync(importmapFile, 'utf-8'));
        console.debug(`[ImportMap] 使用预生成 importmap: ${importmapFile}`);
      } catch {
        selfHostedImportMap = buildSelfHostedImportMap(importmap || [], selfHostBase);
        console.warn(`[ImportMap] importmap.json 解析失败，回退到简易映射`);
      }
    } else {
      selfHostedImportMap = buildSelfHostedImportMap(importmap || [], selfHostBase);
      console.warn(
        `[ImportMap] 未找到 ${importmapFile}，使用简易映射。运行 \`pnpm sync:shared-deps\` 获取完整依赖图。`,
      );
    }
  }

  // CDN 模式：尝试从磁盘缓存读取已生成的 importmap
  // 缓存命中时跳过 generator.install()，避免重复公网请求
  let cacheKey: string | null = null;
  if (!selfHostBase && !isCacheDisabled() && importmap?.length) {
    cacheKey = getCacheKey(importmap, options);
    const cached = readCachedImportMap(cacheKey);
    if (cached) {
      resolvedImportMap = cached;
      installed = true; // 标记为已安装，跳过 install hook 的在线安装
      console.debug(`[ImportMap] Cache hit for key ${cacheKey}, skipping CDN install`);
    }
  }

  if (!selfHostBase && !resolvedImportMap) {
    generator = new Generator({
      ...options,
      baseUrl: process.cwd(),
    });

    if (options?.debug) {
      (async () => {
        for await (const { message, type } of generator.logStream()) {
          console.log(`${type}: ${message}`);
        }
      })();
    }
  }

  const imports = options.inputMap?.imports ?? {};
  const scopes = options.inputMap?.scopes ?? {};
  const firstLayerKeys = Object.keys(scopes);
  const inputMapScopes: string[] = [];
  firstLayerKeys.forEach((key) => {
    inputMapScopes.push(...Object.keys(scopes[key] || {}));
  });
  const inputMapImports = Object.keys(imports);

  const allDepNames: string[] = [
    ...(importmap?.map((item) => item.name) || []),
    ...inputMapImports,
    ...inputMapScopes,
  ];
  const depNames = new Set<string>(allDepNames);

  const installDeps = importmap?.map((item) => ({
    range: item.range,
    target: item.name,
  }));

  return [
    {
      async config(_, { command, isSsrBuild }) {
        isBuild = command === 'build';
        isSSR = !!isSsrBuild;
      },
      enforce: 'pre',
      name: 'importmap:external',
      resolveId(id) {
        if (isSSR || !isBuild) {
          return null;
        }

        if (!depNames.has(id)) {
          return null;
        }
        return { external: true, id };
      },
    },
    {
      enforce: 'post',
      name: 'importmap:install',
      async resolveId() {
        if (isSSR || !isBuild || installed) {
          return null;
        }
        // 自托管模式无需公网安装
        if (selfHostBase) {
          installed = true;
          console.debug(
            `[ImportMap] Self-hosted mode → ${selfHostBase} (${importmap?.length ?? 0} deps). Run \`pnpm sync:shared-deps\` to populate.`,
          );
          return null;
        }
        // 缓存命中：installed 已在初始化时置为 true，此处不会进入
        // 在线安装并写入缓存
        try {
          installed = true;
          await Promise.allSettled(
            (installDeps || []).map((dep) => generator.install(dep)),
          );
          // 安装完成后，获取 importmap 并写入缓存
          resolvedImportMap = generator.getMap();
          if (cacheKey && resolvedImportMap) {
            writeCachedImportMap(cacheKey, resolvedImportMap);
          }
        } catch (error: unknown) {
          installError = error instanceof Error ? error : new Error(String(error));
          installed = false;
        }
        return null;
      },
    },
    {
      buildEnd() {
        // 未生成importmap时，抛出错误，防止被turbo缓存
        if (!installed && !isSSR) {
          installError && console.error(installError);
          throw new Error('Importmap installation failed.');
        }
      },
      enforce: 'post',
      name: 'importmap:html',
      transformIndexHtml: {
        async handler(html) {
          if (isSSR || !isBuild) {
            return html;
          }

          // 优先使用缓存结果，其次 generator.getMap()
          const importmapJson = selfHostBase
            ? selfHostedImportMap
            : resolvedImportMap ?? generator.getMap();

          if (!importmapJson) {
            return html;
          }

          const esModuleShimsSrc = await getShimsUrl(
            options.defaultProvider || DEFAULT_PROVIDER,
            selfHostBase,
          );

          const resultHtml = await injectShimsToHtml(
            html,
            esModuleShimsSrc || '',
          );
          html = await minify(resultHtml || html, {
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: false,
          });

          return {
            html,
            tags: [
              {
                attrs: {
                  type: 'importmap',
                },
                injectTo: 'head-prepend',
                tag: 'script',
                children: `${JSON.stringify(importmapJson)}`,
              },
            ],
          };
        },
        order: 'post',
      },
    },
  ];
}

export { viteImportMapPlugin };
