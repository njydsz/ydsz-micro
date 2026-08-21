/**
 * importmap 辅助函数
 *
 * 包含 Shims URL 生成、自托管 importmap 构建、HTML 垫片注入等功能。
 */
import { load } from 'cheerio';

import { DEFAULT_PROVIDER } from './importmap-cache';

/**
 * 根据 CDN 供应商返回 es-module-shims 垫片的 URL。
 *
 * 版本固定为 1.10.0（升级需人工验证兼容性），未知供应商回退到默认 jspm.io。
 * 当 selfHostBase 指定时，回退到同源 `${selfHostBase}/es-module-shims@<version>/dist/es-module-shims.js`，
 * 消除垫片脚本的公网 CDN 依赖。
 *
 * @param provide - CDN 供应商名（esm.sh / jsdelivr / jspm.io）
 * @param selfHostBase - 自托管基路径，指定时覆盖 CDN 解析
 * @returns 对应供应商的 es-module-shims CDN 地址
 */
export async function getShimsUrl(provide: string, selfHostBase?: string) {
  // 版本固定锁定，避免 CDN 升级引入破坏性变更
  const version = '1.10.0';
  const shimsSubpath = `dist/es-module-shims.js`;

  // 自托管模式：垫片也从同源加载
  if (selfHostBase) {
    return `${selfHostBase}/es-module-shims@${version}/${shimsSubpath}`;
  }

  const providerShimsMap: Record<string, string> = {
    'esm.sh': `https://esm.sh/es-module-shims@${version}/${shimsSubpath}`,
    jsdelivr: `https://cdn.jsdelivr.net/npm/es-module-shims@${version}/${shimsSubpath}`,
    'jspm.io': `https://ga.jspm.io/npm:es-module-shims@${version}/${shimsSubpath}`,
  };

  return providerShimsMap[provide] || providerShimsMap[DEFAULT_PROVIDER];
}

/**
 * 生成自托管 importmap JSON。
 *
 * 将每个依赖映射到 `${selfHostBase}/<pkg>@<range>/index.js`，
 * range 中的 `^` 等前缀符号会被剥离（目录名不可含特殊字符）。
 * 实际文件由 `bash/sync-shared-deps.mjs` 从 esm.sh 下载并写入 public/vendor/。
 *
 * @param deps - 共享依赖列表
 * @param selfHostBase - 自托管基路径
 * @returns importmap JSON 对象（{ imports: { ... } }）
 */
export function buildSelfHostedImportMap(
  deps: Array<{ name: string; range?: string }>,
  selfHostBase: string,
): { imports: Record<string, string> } {
  const imports: Record<string, string> = {};
  for (const dep of deps) {
    const cleanRange = (dep.range || '').replace(/[\^~>=<]/g, '');
    imports[dep.name] = `${selfHostBase}/${dep.name}@${cleanRange}/index.js`;
  }
  return { imports };
}

/**
 * 将入口模块改写为经 es-module-shims 垫片加载，兼容不支持 importmap 的浏览器。
 *
 * 通过 cheerio 解析 HTML，移除原生 module 脚本属性后以 importShim 代理方式
 * 加载入口，保证老旧浏览器也能使用 importmap。
 *
 * @param html - 原始 HTML 字符串
 * @param esModuleShimUrl - es-module-shims 垫片脚本地址
 * @returns 注入垫片加载逻辑后的 HTML 字符串
 */
export async function injectShimsToHtml(html: string, esModuleShimUrl: string) {
  const $ = load(html);

  const $script = $(`script[type='module']`);

  if (!$script) {
    return;
  }

  const entry = $script.attr('src');

  $script.removeAttr('type');
  $script.removeAttr('crossorigin');
  $script.removeAttr('src');
  $script.html(`
if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('importmap')) {
  self.importShim = function () {
      const promise = new Promise((resolve, reject) => {
          document.head.appendChild(
              Object.assign(document.createElement('script'), {
                  src: '${esModuleShimUrl}',
                  crossorigin: 'anonymous',
                  async: true,
                  onload() {
                      if (!importShim.$proxy) {
                          resolve(importShim);
                      } else {
                          reject(new Error('No globalThis.importShim found:' + esModuleShimUrl));
                      }
                  },
                  onerror(error) {
                      reject(error);
                  },
              }),
          );
      });
      importShim.$proxy = true;
      return promise.then((importShim) => importShim(...arguments));
  };
}

var modules = ['${entry}'];
typeof importShim === 'function'
  ? modules.forEach((moduleName) => importShim(moduleName))
  : modules.forEach((moduleName) => import(moduleName));
 `);
  $('body').after($script);
  $('head').remove(`script[type='module']`);
  return $.html();
}

