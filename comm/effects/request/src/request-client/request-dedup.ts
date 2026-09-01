/**
 * 请求去重器 (In-flight Request Deduplicator)。
 *
 * <p>基于「方法 + URL + 序列化参数」三元组作为缓存键，在短时间窗口内将对同一接口的
 * 并发调用合并为一次实际 HTTP 请求，所有调用方共享同一 Promise。
 *
 * <p>适用场景：
 * <ul>
 *   <li>同一页面多个组件各自请求同一接口（如用户菜单、权限码、配置项）</li>
 *   <li>路由切换时新页面与旧页面的重复请求</li>
 *   <li>搜索框防抖后触发的多个相同查询</li>
 * </ul>
 *
 * <p>不适用于写操作（POST/PUT/PATCH/DELETE）：写操作请求默认不进行去重，
 * 避免请求幂等性问题。调用方可通过 {@code config.dedup: true} 显式开启。
 *
 * <p>去重窗口（TTL）默认 5000ms，超时后无论是否完成都清除缓存，下一次调用重新发请求。
 *
 * @path comm/effects/request/src/request-client/request-dedup.ts
 * @author ydsz-team
 * @since 4.1.0 (P1-7)
 */

import type { RequestClientConfig } from './types';

import qs from 'qs';

/** 去重缓存条目 */
interface DedupEntry<T = unknown> {
  /** 共享 Promise */
  promise: Promise<T>;
  /** 创建时间戳 */
  createdAt: number;
}

/** 默认去重 TTL (ms) */
const DEFAULT_DEDUP_TTL_MS = 5000;

/** 默认启用去重的 HTTP 方法 */
const DEDUP_ENABLED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** 全局去重缓存 Map：cacheKey -> DedupEntry */
const dedupCache = new Map<string, DedupEntry>();

/** 用于生成去重键的序列化器（保持参数顺序一致） */
function stableStringify(obj: unknown): string {
  if (obj === undefined || obj === null) return '';
  if (typeof obj !== 'object') return String(obj);
  return qs.stringify(obj, { strictNullHandling: true, sort: (a, a2) => a.localeCompare(a2) });
}

/**
 * 生成去重缓存键。
 *
 * <p>由「大写方法名 + URL + 序列化查询参数 + 序列化请求体」拼接而成，
 * 确保语义等价请求命中同一缓存条目。
 *
 * @param method HTTP 方法
 * @param url 请求 URL
 * @param params 查询参数
 * @param data 请求体
 * @returns 去重缓存键
 */
function buildDedupKey(
  method: string,
  url: string,
  params?: unknown,
  data?: unknown,
): string {
  const parts = [
    method.toUpperCase(),
    url,
    params !== undefined ? `?${stableStringify(params)}` : '',
    data !== undefined ? `#${stableStringify(data)}` : '',
  ];
  return parts.join('');
}

/**
 * 判断请求是否启用去重。
 *
 * <p>判定逻辑：
 * <ul>
 *   <li>调用方显式配置 {@code dedup: false} 时强制关闭去重</li>
 *   <li>调用方显式配置 {@code dedup: true} 时强制开启去重（含写操作）</li>
 *   <li>默认：仅 GET/HEAD/OPTIONS 开启去重，写操作关闭</li>
 * </ul>
 *
 * @param method HTTP 方法
 * @param config 请求配置
 * @returns 是否启用去重
 */
function isDedupEnabled(method: string, config?: RequestClientConfig): boolean {
  if (config?.dedup === false) return false;
  if (config?.dedup === true) return true;
  return DEDUP_ENABLED_METHODS.has(method.toUpperCase());
}

/**
 * 清理过期缓存条目。
 *
 * <p>每次获取/写入缓存时惰性清理过期条目，避免长期运行后内存泄漏。
 */
function evictExpiredEntries(ttlMs: number): void {
  const now = Date.now();
  for (const [key, entry] of dedupCache) {
    if (now - entry.createdAt > ttlMs) {
      dedupCache.delete(key);
    }
  }
}

/**
 * 获取当前去重缓存大小（用于监控）。
 *
 * @returns 当前缓存条目数
 */
export function getDedupCacheSize(): number {
  return dedupCache.size;
}

/**
 * 手动清除全部去重缓存。
 *
 * <p>可在以下场景调用：
 * <ul>
 *   <li>用户切换租户后，旧租户缓存数据已失效</li>
 *   <li>强制刷新操作（如「重试」按钮）</li>
 * </ul>
 */
export function clearDedupCache(): void {
  dedupCache.clear();
}

/**
 * 执行带去重的请求。
 *
 * <p>核心逻辑：
 * <ol>
 *   <li>请求方法不启用去重时，直接转发原请求</li>
 *   <li>生成缓存键，查找是否有未过期的在途请求</li>
 *   <li>命中则返回共享 Promise</li>
 *   <li>未命中则执行实际请求，将 Promise 写入缓存，完成后清理</li>
 * </ol>
 *
 * @param method HTTP 方法
 * @param url 请求 URL
 * @param config 请求配置
 * @param executor 执行实际请求的函数
 * @param options 去重选项
 * @returns 请求结果的 Promise
 */
export async function dedupRequest<T>(
  method: string,
  url: string,
  config: RequestClientConfig | undefined,
  executor: (url: string, config?: RequestClientConfig) => Promise<T>,
  options: { ttlMs?: number } = {},
): Promise<T> {
  const ttl = options.ttlMs ?? DEFAULT_DEDUP_TTL_MS;

  // 1. 不启用去重的请求直接执行
  if (!isDedupEnabled(method, config)) {
    return executor(url, config);
  }

  // 2. 生成缓存键
  const cacheKey = buildDedupKey(method, url, config?.params, config?.data);

  // 3. 惰性清理过期缓存
  evictExpiredEntries(ttl);

  // 4. 命中则返回在途 Promise
  const existing = dedupCache.get(cacheKey);
  if (existing && Date.now() - existing.createdAt < ttl) {
    return existing.promise as Promise<T>;
  }

  // 5. 执行实际请求并缓存 Promise
  const promise = executor(url, config).finally(() => {
    // 请求完成后清理缓存（避免后续请求复用旧结果）
    const current = dedupCache.get(cacheKey);
    if (current?.promise === promise) {
      dedupCache.delete(cacheKey);
    }
  });

  dedupCache.set(cacheKey, { promise, createdAt: Date.now() });

  return promise;
}
