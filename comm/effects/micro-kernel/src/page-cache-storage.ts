/**
 * page-cache-storage.ts — Page Cache 存储与 Registry 管理
 *
 * 从 page-cache-manager.ts 提取的存储逻辑，包含：
 * - Registry 管理（readRegistry / removeFromRegistry）
 * - 缓存清理 API（clearPageCacheForApp / clearAllPageCache）
 * - 缓存摘要（getCacheSummary）
 * - 编程式状态存取（saveAppState / loadAppState / removeAppState）
 *
 * @path comm/effects/micro-kernel/src/page-cache-storage.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { getStorage, setStorage, removeStorage } from "./storage-utils";
import type { PageCachePolicy, PageCacheRecord } from "./page-cache-types";
import {
  CACHE_REGISTRY_KEY,
  NAMESPACE_PREFIX,
} from "./page-cache-types";

const logger = createLogger("PageCacheStorage");

/**
 * Cache Registry 接口
 */
export interface CacheRegistry {
  [appName: string]: Array<{ routePath: string; createdAt: number }>;
}

/**
 * 全局策略引用（由 page-cache-manager.ts 设置）
 */
let _policy: PageCachePolicy | null = null;

/**
 * 设置全局策略引用
 */
export function __setPageCachePolicy(policy: PageCachePolicy): void {
  _policy = policy;
}

/**
 * 生成单条缓存的存储 key（按路由 path 区分）
 */
function buildCacheKey(appName: string, routePath: string): string {
  const safePath = routePath.replace(/[^a-zA-Z0-9-]/g, "_");
  return `${NAMESPACE_PREFIX}page-cache:${appName}:${safePath}`;
}

/**
 * 读取 Registry
 */
export function readRegistry(): CacheRegistry {
  try {
    return getStorage<CacheRegistry>(CACHE_REGISTRY_KEY) || {};
  } catch {
    return {};
  }
}

/**
 * 从 Registry 中移除指定条目
 *
 * @param appName - 应用名
 * @param routePath - 路由路径
 */
export function removeFromRegistry(appName: string, routePath: string): void {
  try {
    const registry = readRegistry();
    if (registry[appName]) {
      registry[appName] = registry[appName].filter(
        (e) => e.routePath !== routePath,
      );
      if (registry[appName].length === 0) {
        delete registry[appName];
      }
      setStorage(CACHE_REGISTRY_KEY, registry);
    }
  } catch (error) {
    logger.warn(`removeFromRegistry failed for ${appName}:`, error);
  }
}

/**
 * 持久化页面缓存记录到 localStorage。
 *
 * @param appName - 应用名
 * @param record - 缓存记录
 * @param policy - 缓存策略
 * @returns 被淘汰的 route 列表
 */
export function persistPageCacheStorage(
  appName: string,
  record: PageCacheRecord,
  policy: PageCachePolicy,
): string[] {
  const evicted: string[] = [];

  try {
    const registry = readRegistry();
    let entries = registry[appName] || [];

    // 移除同 path 的旧条目
    entries = entries.filter((e) => e.routePath !== record.routePath);

    // LRU 淘汰
    while (entries.length >= policy.maxEntriesPerApp) {
      const victim = entries.shift();
      if (victim) {
        removeStorage(buildCacheKey(appName, victim.routePath));
        evicted.push(victim.routePath);
      }
    }

    entries.push({
      routePath: record.routePath,
      createdAt: record.createdAt,
    });
    registry[appName] = entries;

    setStorage(buildCacheKey(appName, record.routePath), record);
    setStorage(CACHE_REGISTRY_KEY, registry);
  } catch (error) {
    logger.warn(`persistPageCache failed for ${appName}:`, error);
  }

  return evicted;
}

/**
 * 判断指定应用+路由是否存在未过期的持久化缓存（不消费）。
 *
 * @param appName - 应用名
 * @param routePath - 路由路径
 * @param policy - 缓存策略
 */
export function hasPersistedPageCacheStorage(
  appName: string,
  routePath: string,
  policy: PageCachePolicy,
): boolean {
  try {
    const cacheKey = buildCacheKey(appName, routePath);
    const record = getStorage<PageCacheRecord>(cacheKey);
    if (!record) return false;
    const age = Date.now() - record.createdAt;
    if (age > policy.ttlMs) {
      removeStorage(cacheKey);
      removeFromRegistry(appName, routePath);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理指定应用的全部页面缓存。
 *
 * @param appName - 应用名
 * @returns 清理的条目数
 */
export function clearPageCacheForAppStorage(appName: string): number {
  try {
    const registry = readRegistry();
    const entries = registry[appName] || [];
    for (const entry of entries) {
      removeStorage(buildCacheKey(appName, entry.routePath));
    }
    delete registry[appName];
    setStorage(CACHE_REGISTRY_KEY, registry);
    return entries.length;
  } catch (error) {
    logger.warn(`clearPageCacheForApp failed for ${appName}:`, error);
    return 0;
  }
}

/**
 * 清理全部应用的页面缓存（全量重置）。
 */
export function clearAllPageCacheStorage(): void {
  try {
    const registry = readRegistry();
    for (const [appName, entries] of Object.entries(registry)) {
      for (const entry of entries) {
        removeStorage(buildCacheKey(appName, entry.routePath));
      }
    }
    removeStorage(CACHE_REGISTRY_KEY);
  } catch (error) {
    logger.warn("clearAllPageCache failed:", error);
  }
}

/**
 * 获取缓存状态摘要（供开发工具/调试面板展示）。
 */
export function getCacheSummaryStorage(): {
  totalApps: number;
  totalEntries: number;
  apps: Array<{ name: string; entries: number }>;
} {
  try {
    const registry = readRegistry();
    const apps = Object.entries(registry).map(([name, entries]) => ({
      name,
      entries: entries.length,
    }));
    return {
      totalApps: apps.length,
      totalEntries: apps.reduce((sum, a) => sum + a.entries, 0),
      apps,
    };
  } catch {
    return { totalApps: 0, totalEntries: 0, apps: [] };
  }
}

// ==================== 编程式状态存取 API ====================

/**
 * 供业务子应用保存状态到页面缓存。
 *
 * @param appName - 应用名
 * @param key - 状态键
 * @param value - 任意可序列化值
 */
export function saveAppStateStorage(appName: string, key: string, value: unknown): void {
  try {
    const stateKey = `${NAMESPACE_PREFIX}app-state:${appName}:${key}`;
    setStorage(stateKey, { value, savedAt: Date.now() });
  } catch (error) {
    logger.warn(`saveAppState failed for ${appName}/${key}:`, error);
  }
}

/**
 * 读取子应用保存的状态。
 *
 * @param appName - 应用名
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 已保存的值或 defaultValue
 */
export function loadAppStateStorage<T>(appName: string, key: string, defaultValue: T): T {
  try {
    const stateKey = `${NAMESPACE_PREFIX}app-state:${appName}:${key}`;
    const record = getStorage<{ value: T; savedAt: number }>(stateKey);
    if (record && record.value !== undefined) {
      return record.value;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 删除子应用保存的指定状态。
 *
 * @param appName - 应用名
 * @param key - 状态键
 */
export function removeAppStateStorage(appName: string, key: string): void {
  try {
    const stateKey = `${NAMESPACE_PREFIX}app-state:${appName}:${key}`;
    removeStorage(stateKey);
  } catch (error) {
    logger.warn(`removeAppState failed for ${appName}/${key}:`, error);
  }
}
