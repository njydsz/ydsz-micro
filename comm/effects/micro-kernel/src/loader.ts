/**
 * ESM Manifest 加载器
 *
 * 约定：子应用由统一 vite-config 构建，输出 manifest.json：
 *   { "name": "workflow-web", "entry": "...", "css": [...], "version": "..." }
 *
 * 加载流程：
 *   build 模式：fetch manifest → 注入 CSS → dynamic import ESM entry → 断言生命周期。
 *   dev 模式（M4 修复）：跳过 manifest，直接 dynamic import 子应用 dev server 入口。
 *
 * @path comm/effects/micro-kernel/src/loader.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { LifecycleExports, MicroAppConfig } from '@ydsz/micro-runtime';
import { createLogger } from '@YDSZ-core/shared/utils';
import { retryOperation } from './retry';
import { injectModulePreload, preloadAppAssets } from './link-hints';
import { KernelError, KernelErrorCode } from './error-boundary';

/** 模块级日志器（重试等运维信息走 debug，避免生产噪音） */
const logger = createLogger('MicroKernel');

/**
 * 子应用 manifest.json 中声明的路由级骨架屏配置。
 *
 * 子应用可按自身路由前缀声明骨架屏类型，主应用容器在加载阶段
 * 优先使用 manifest.routes 匹配当前子路径，无匹配时回退到
 * route.meta.skeletonType，再回退到 'default'。
 *
 * @since 3.3
 */
export interface ManifestRoute {
  /** 路由前缀或正则字符串（相对于子应用 basename 的子路径，如 '/users'、'/detail'） */
  path: string;
  /** 骨架屏类型（与主应用 SkeletonType 对齐：list/form/detail/dashboard/default） */
  skeletonType?: string;
}

/** 子应用构建产出的 manifest.json 结构：应用名、入口、样式表列表与版本号 */
export interface Manifest {
  name: string;
  entry: string;
  css: string[];
  version: string;
  /**
   * 路由级骨架屏配置（v3.3 新增，可选）。
   *
   * 子应用通过 vite-plugin-manifest 的 routes 选项声明，构建期写入 manifest.json，
   * 主应用容器加载 manifest 后据此匹配当前路由子路径，渲染对应骨架屏。
   */
  routes?: ManifestRoute[];
  /**
   * v4.2.1 L2: 子应用静态资源完整性校验（SRI）。
   *
   * 构建期计算并写入，形如 `{ "css": { "https://cdn/a.css": "sha256-..." } }`。
   * loader 注入样式表时附加 integrity + crossorigin="anonymous"，
   * 防止 CDN 被篡改导致子应用样式被恶意替换。
   *
   * v4.4.0: 新增 `js` 清单（entry + 全部 chunk 的 sha256）。浏览器
   * dynamic import 不支持 integrity 属性，js 清单供 strictIntegrity
   * 加载模式（先取文本验签再 import）与 Service Worker 校验使用。
   *
   * @since 4.2.1
   */
  integrity?: {
    /** css URL → SRI hash */
    css?: Record<string, string>;
    /** js URL → SRI hash（v4.4.0，供 strictIntegrity 模式） */
    js?: Record<string, string>;
  };
}

/** 加载配置 */
export interface LoadOptions {
  /** 加载超时（毫秒），默认 10_000 */
  timeout?: number;
  /** 失败重试次数，默认 2 次（总共 1+2=3 次尝试） */
  retries?: number;
  /** 重试延迟基数（毫秒），指数退避：delay = base * 2^(n-1) */
  retryBaseDelay?: number;
  /** 外部 AbortSignal（叠加于超时之上） */
  signal?: AbortSignal;
  /**
   * v4.4.0: JS 入口严格完整性校验（默认 false）。
   *
   * 开启后（且 manifest.integrity.js 存在）在 dynamic import 前
   * fetch 入口文本并校验 sha256，验签失败抛 LOAD_MANIFEST_INVALID。
   * 代价：入口多一次网络往返（命中 HTTP 缓存时可接受）。
   */
  strictIntegrity?: boolean;
}

/** 加载结果 */
export interface LoadResult {
  exports: LifecycleExports;
  manifest: null | Manifest;
  /** 加载耗时（毫秒） */
  duration: number;
  /** 是否来自缓存（dev 模式固定 false） */
  fromCache: boolean;
}

const manifestCache = new Map<string, Manifest>();

/** P2-3: manifestCache 最大条目数。超过时淘汰最旧条目（LRU）。 */
const MAX_MANIFEST_CACHE_SIZE = 50;

/**
 * P2-3: 设置 manifestCache 条目（带 LRU 淘汰）。
 *
 * Map 在 V8 中保留插入顺序，通过 delete + set 可将条目标记为最新。
 *
 * @since 4.0.1
 */
function setManifestCacheEntry(key: string, manifest: Manifest): void {
  // 已存在时先 delete，重新 set 会移到末尾（最新）
  if (manifestCache.has(key)) {
    manifestCache.delete(key);
  }
  manifestCache.set(key, manifest);

  // LRU 淘汰：超出上限时从头部（最旧）开始删
  while (manifestCache.size > MAX_MANIFEST_CACHE_SIZE) {
    const oldestKey = manifestCache.keys().next().value;
    if (oldestKey === undefined) break;
    manifestCache.delete(oldestKey);
  }
}

/** 获取是否为开发模式 */
const isDev = typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, unknown> }).env?.DEV === true;

/**
 * 通过 fetch manifest.json 获取子应用入口信息。
 * Dev 模式下不调用（manifest.json 仅在 build 产物的 dist 中）。
 */
export async function fetchManifest(
  entry: string,
  signal?: AbortSignal,
): Promise<Manifest> {
  const manifestUrl = `${entry.replace(/\/$/, '')}/manifest.json`;

  if (manifestCache.has(manifestUrl)) {
    return manifestCache.get(manifestUrl)!;
  }

  let response: Response;
  try {
    // @infra-fetch 基础设施层直用，无统一客户端上下文（子应用 manifest 加载）
    response = await fetch(manifestUrl, { signal });
  } catch (err) {
    throw new KernelError(
      KernelErrorCode.LOAD_MANIFEST_FETCH,
      `[MicroKernel] Network error fetching manifest from ${manifestUrl}: ${String(err)}`,
      err,
    );
  }

  if (!response.ok) {
    throw new KernelError(
      KernelErrorCode.LOAD_MANIFEST_FETCH,
      `[MicroKernel] Failed to fetch manifest from ${manifestUrl}: ${response.status}`,
    );
  }

  let manifest: Manifest;
  try {
    manifest = await response.json();
  } catch (err) {
    throw new KernelError(
      KernelErrorCode.LOAD_MANIFEST_INVALID,
      `[MicroKernel] Invalid JSON in manifest from ${manifestUrl}`,
      err,
    );
  }

  // P2-3: LRU 淘汰写入
  setManifestCacheEntry(manifestUrl, manifest);
  return manifest;
}

/**
 * 加载子应用 ESM 入口。
 *
 * 相比 qiankun import-html-entry：无 HTML 解析、无 UMD、无 eval。
 *
 * @param config - 子应用注册配置
 * @param options - 加载选项（超时、重试）
 * @returns 标准 LifecycleExports + manifest + 耗时
 */
export async function loadApp(
  config: MicroAppConfig,
  options: LoadOptions = {},
): Promise<LoadResult> {
  const { timeout = 10_000, retries = 2, retryBaseDelay = 500, signal: extSignal } = options;
  const startTime = performance.now();

  // === M4 修复：Dev 模式直接 import 子应用 dev server 入口，跳过 manifest ===
  if (isDev) {
    const entryUrl = `${config.entry.replace(/\/$/, '')}/src/main.ts`;
    // C4: dev 模式也注入 modulepreload，提前建立与 dev server 的连接
    injectModulePreload(entryUrl);
    const mod = await importWithRetry(entryUrl, { timeout, retries, retryBaseDelay, extSignal });
    assertLifecycle(mod, config.name);
    return {
      // 动态 import 的模块对象收窄为生命周期契约（已通过 assertLifecycle 断言）
      exports: mod as unknown as LifecycleExports,
      manifest: null,
      duration: performance.now() - startTime,
      fromCache: false,
    };
  }

  // === Build 模式：fetch manifest → 注入 CSS → dynamic import ESM entry ===
  const manifest = await fetchWithRetry(
    () => fetchManifest(config.entry, extSignal),
    { timeout, retries, retryBaseDelay },
    `manifest for ${config.name}`,
  );

  // C4: 在 dynamic import 前注入 preconnect + modulepreload 提示，
  //     让浏览器提前建立连接并预取 ESM 模块及其静态依赖
  preloadAppAssets(config.entry, manifest);

  // 注入样式（标记 data-micro-kernel-app，卸载时一键移除）
  // v4.2.1 L2: 附加 SRI integrity + CSP nonce
  // v4.4.1 P1: 等待全部样式表加载完成后再进入 dynamic import / mount，
  //            消除"mount 渲染时 CSS 仍在途"导致的首帧无样式闪变（FOUC）。
  //            单表 3s 超时兜底（弱网/CDN 故障时降级为无样式挂载并告警，
  //            不阻塞子应用激活——JS 层错误仍由 error-boundary 兜底）。
  await injectStylesheets(manifest.css, manifest.name, manifest.integrity?.css);

  // v4.4.0: 严格完整性校验（可选）—— 在 dynamic import 前验签 JS 入口
  if (options.strictIntegrity) {
    await verifyEntryIntegrity(manifest, extSignal);
  }

  const mod = await importWithRetry(manifest.entry, { timeout, retries, retryBaseDelay, extSignal });
  assertLifecycle(mod, config.name);

  return {
    // 动态 import 的模块对象收窄为生命周期契约（已通过 assertLifecycle 断言）
    exports: mod as unknown as LifecycleExports,
    manifest,
    duration: performance.now() - startTime,
    fromCache: manifestCache.has(`${config.entry.replace(/\/$/, '')}/manifest.json`),
  };
}

/**
 * 带超时与指数退避重试的 dynamic import。
 *
 * 使用统一的重试策略（含 jitter），避免惊群效应。
 *
 * @param url - ESM 模块 URL
 * @param opts - 超时/重试配置
 * @returns 导入的模块对象
 */
async function importWithRetry(
  url: string,
  opts: { timeout: number; retries: number; retryBaseDelay: number; extSignal?: AbortSignal },
): Promise<Record<string, unknown>> {
  return retryOperation(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(`Load timeout: ${url}`), opts.timeout);

      // 外部 signal 如取消，也 abort 内部控制器
      const onExtAbort = (): void => controller.abort('Aborted externally');
      opts.extSignal?.addEventListener('abort', onExtAbort, { once: true });

      try {
        const mod = await import(/* @vite-ignore */ url);
        return mod;
      } catch (err) {
        // P1-8: 包装为 KernelErrorCode.LOAD_ESM_IMPORT
        throw new KernelError(
          KernelErrorCode.LOAD_ESM_IMPORT,
          `[MicroKernel] Failed to import ESM entry: ${url} — ${String(err)}`,
          err,
        );
      } finally {
        clearTimeout(timeoutId);
        opts.extSignal?.removeEventListener('abort', onExtAbort);
      }
    },
    {
      maxRetries: opts.retries,
      baseDelay: opts.retryBaseDelay,
      backoff: 'exponential',
      jitter: 0.25,
      onRetry: (_error, attempt, delay) => {
        logger.debug(
          `Import failed (attempt ${attempt + 1}/${opts.retries + 1}): ${url}. Retrying in ${delay}ms...`,
        );
      },
    },
  );
}

/**
 * 带重试的 fetch 包装。
 *
 * 使用统一的重试策略（含 jitter），避免惊群效应。
 */
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  opts: { timeout: number; retries: number; retryBaseDelay: number },
  label: string,
): Promise<T> {
  return retryOperation(fn, {
    maxRetries: opts.retries,
    baseDelay: opts.retryBaseDelay,
    backoff: 'exponential',
    jitter: 0.25,
    onRetry: (_error, attempt, delay) => {
      logger.debug(
        `Fetch failed (attempt ${attempt + 1}/${opts.retries + 1}): ${label}. Retrying in ${delay}ms...`,
      );
    },
  });
}

/** 注入样式表，并标记 data-micro-kernel-app="name" 以便卸载时移除 */
/**
 * v4.2.1 L2: 当前 CSP nonce（供注入 style/link 时附加）。
 *
 * 主应用在 CSP 环境中调用 setCspNonce() 注入页面 nonce，
 * 使 loader 动态创建的样式标签通过 `style-src 'nonce-xxx'` 策略。
 */
let cspNonce: string | undefined;

/**
 * v4.2.1 L2: 设置 CSP nonce。
 *
 * 主应用（如 security.ts / index.html 脚本）在 CSP 策略下调用：
 * ```ts
 * setCspNonce(globalThis.__csp_nonce__);
 * ```
 *
 * @param nonce - 页面 CSP nonce 值
 * @since 4.2.1
 */
export function setCspNonce(nonce?: string): void {
  cspNonce = nonce || undefined;
}

/** 获取当前 CSP nonce（内部使用） */
function getCspNonce(): string | undefined {
  return cspNonce;
}

/**
 * 等待单个样式表加载完成的超时兜底（毫秒）。
 *
 * v4.4.1 P1：超时后按"已加载"放行并告警，避免弱网下激活链路被单张
 * 样式表卡死；JS 层失败仍由 error-boundary 分级降级兜底。
 */
const CSS_LOAD_TIMEOUT_MS = 3_000;

/**
 * 注入子应用样式表，并等待全部样式表加载完成（v4.4.1 P1 FOUC 修复）。
 *
 * v4.2.1 L2: 附加 SRI integrity（manifest.integrity.css）+ crossorigin，
 * 以及 CSP nonce（style-src 策略兼容）。
 *
 * 返回时机：全部 link 触发 load、或触发 error（告警放行）、或超时兜底。
 */
async function injectStylesheets(
  cssUrls: string[],
  appName: string,
  integrity?: Record<string, string>,
): Promise<void> {
  const nonce = getCspNonce();
  const pending: Array<Promise<void>> = [];
  for (const href of cssUrls) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-micro-kernel-app', appName);
    // L2: SRI 校验（manifest 提供 hash 时）
    const hash = integrity?.[href];
    if (hash) {
      link.integrity = hash;
      link.crossOrigin = 'anonymous';
    }
    // L2: CSP nonce 兼容
    if (nonce) {
      link.setAttribute('nonce', nonce);
    }
    document.head.appendChild(link);
    pending.push(awaitStylesheetLoad(link, href));
  }
  await Promise.all(pending);
}

/**
 * 等待单个样式表 load/error 事件，附超时兜底。
 *
 * v4.4.1 P1：加载失败或超时不抛错（不阻塞激活），仅记录告警日志，
 * 由调用方决定是否需要进一步处理。
 */
function awaitStylesheetLoad(link: HTMLLinkElement, href: string): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = (reason: 'error' | 'loaded' | 'timeout'): void => {
      if (settled) return;
      settled = true;
      if (reason !== 'loaded') {
        logger.warn(
          `[MicroKernel] Stylesheet "${href}" not loaded (${reason}), mounting without it`,
        );
      }
      resolve();
    };
    link.addEventListener('load', () => finish('loaded'), { once: true });
    link.addEventListener('error', () => finish('error'), { once: true });
    setTimeout(() => finish('timeout'), CSS_LOAD_TIMEOUT_MS);
  });
}

/** 移除指定应用注入的样式表 */
export function removeStylesheets(appName: string): void {
  const links = document.querySelectorAll(`link[data-micro-kernel-app="${appName}"]`);
  for (const link of links) {
    link.remove();
  }
}

/**
 * 清空 manifest 缓存。
 *
 * 供 kernel `_stop()` 在 HMR / 测试场景调用，
 * 确保新一轮内核启动时不会命中上一轮的 manifest 缓存（避免旧版本残留）。
 *
 * @since 3.6.1
 */
export function clearManifestCache(): void {
  manifestCache.clear();
}

/**
 * v4.4.0: JS 入口严格完整性校验。
 *
 * fetch 入口文本 → sha256 → 与 manifest.integrity.js[entry] 比对。
 * 仅在 strictIntegrity 开启且清单存在时执行；验签失败抛 LOAD_MANIFEST_INVALID。
 */
async function verifyEntryIntegrity(manifest: Manifest, signal?: AbortSignal): Promise<void> {
  const expected = manifest.integrity?.js?.[manifest.entry];
  if (!expected) return; // 清单未生成（旧构建产物）时静默放行，保持兼容

  // @infra-fetch 基础设施层直用：安全验签通道（复用 manifest URL 上下文），云顶规范 §6.1 例外条款。
  // v4.4.1 P2: force-cache 优先命中 HTTP 缓存，避免与随后的 dynamic import
  //            构成同一 URL 的双网络往返（仅缓存缺失时真正发起请求）。
  const response = await fetch(manifest.entry, { signal, cache: 'force-cache' });
  if (!response.ok) {
    throw new KernelError(
      KernelErrorCode.LOAD_MANIFEST_FETCH,
      `[MicroKernel] Strict integrity fetch failed for ${manifest.entry}: ${response.status}`,
    );
  }
  const body = await response.text();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  const actual = `sha256-${base64}`;
  if (actual !== expected) {
    throw new KernelError(
      KernelErrorCode.LOAD_MANIFEST_INVALID,
      `[MicroKernel] Strict integrity check failed for ${manifest.entry}: expected ${expected}, got ${actual}`,
    );
  }
  logger.debug(`Strict integrity verified for ${manifest.entry}`);
}

/** 断言模块导出 mount 方法（必需）和 unmount（必需） */
function assertLifecycle(module: Record<string, unknown>, appName: string): void {
  if (typeof module.mount !== 'function') {
    throw new KernelError(
      KernelErrorCode.LIFECYCLE_MISSING,
      `[MicroKernel] App "${appName}" must export "mount" function. Found: ${Object.keys(module).join(', ')}`,
    );
  }
  if (typeof module.unmount !== 'function') {
    throw new KernelError(
      KernelErrorCode.LIFECYCLE_MISSING,
      `[MicroKernel] App "${appName}" must export "unmount" function. Found: ${Object.keys(module).join(', ')}`,
    );
  }
}
