/**
 * page-cache-manager.ts — 子应用 Page Cache 状态记忆机制 (P3-4)
 *
 * 在 v4.2.1 N6（serialize/hydrate 基础设施）之上，补充：
 * 1. 滚动位置记忆与恢复（window + 可滚动容器）
 * 2. localStorage 持久化（崩溃恢复：页面刷新后可还原上次的列表页/表单状态）
 * 3. 缓存策略管理（每应用 opt-in / maxEntries / TTL / LRU 淘汰）
 * 4. 编程式 API（供业务子应用存取任意 UI 状态，如筛选条件、Tab 激活键）
 *
 * 为控制单文件行数，以下内容已拆分为独立模块：
 * - page-cache-types.ts：类型定义与常量（PageCachePolicy / PageCacheRecord / ScrollPosition 等）
 * - page-cache-scroll.ts：滚动位置工具（captureScrollPosition / restoreScrollPosition）
 * - page-cache-storage.ts：存储与 Registry 管理（persistPageCache / clearPageCacheForApp / saveAppState 等）
 *
 * 本文件保留核心 API 与策略管理，并重新导出类型以保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/page-cache-manager.ts
 * @author ydsz-team
 * @since 4.2.2
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import type { PageCachePolicy, PageCacheRecord, ScrollPosition } from "./page-cache-types";
import {
  CACHE_REGISTRY_KEY,
  DEFAULT_POLICY,
  NAMESPACE_PREFIX,
} from "./page-cache-types";
import { captureScrollPosition, restoreScrollPosition } from "./page-cache-scroll";

import {
  __setPageCachePolicy,
  persistPageCacheStorage,
  hasPersistedPageCacheStorage,
  clearPageCacheForAppStorage,
  clearAllPageCacheStorage,
  getCacheSummaryStorage,
  saveAppStateStorage,
  loadAppStateStorage,
  removeAppStateStorage,
} from "./page-cache-storage";

// 重新导出类型，保持向后兼容
export type {
  PageCachePolicy,
  PageCacheRecord,
  ScrollPosition,
} from "./page-cache-types";

const logger = createLogger("PageCacheManager");

// ==================== 全局配置 ====================

let _policy: PageCachePolicy = { ...DEFAULT_POLICY };

// 同步策略到存储模块
__setPageCachePolicy(_policy);

/**
 * 更新全局缓存策略。
 *
 * @param partial - 部分覆盖默认策略
 */
export function configurePageCache(partial: Partial<PageCachePolicy>): void {
  _policy = { ..._policy, ...partial };
  __setPageCachePolicy(_policy);
}

/**
 * 获取当前缓存策略副本。
 */
export function getPageCachePolicy(): PageCachePolicy {
  return { ..._policy };
}

/**
 * 重置策略为默认值（供测试使用）。
 */
export function resetPageCachePolicy(): void {
  _policy = { ...DEFAULT_POLICY };
  __setPageCachePolicy(_policy);
}

// ==================== 滚动位置捕获/恢复（委托给 page-cache-scroll.ts） ====================

/**
 * 捕获当前页面滚动位置（window + 可滚动容器）。
 *
 * @param container - 子应用根容器元素
 * @returns 滚动位置快照
 */
export function captureScroll(container: HTMLElement): ScrollPosition {
  return captureScrollPosition(container, _policy);
}

/**
 * 恢复页面滚动位置（window + 容器）。
 *
 * @param record - 缓存记录
 * @param container - 子应用根容器元素
 */
export function restoreScroll(
  record: PageCacheRecord,
  container: HTMLElement,
): void {
  restoreScrollPosition(
    record.scroll,
    record.routePath,
    container,
    _policy.restoreScrollDelayMs,
  );
}

// ==================== 缓存持久化（localStorage） ====================

/**
 * 持久化页面缓存记录到 localStorage。
 *
 * @param appName - 应用名
 * @param record - 缓存记录
 * @returns 被淘汰的 route 列表
 */
export function persistPageCache(appName: string, record: PageCacheRecord): string[] {
  return persistPageCacheStorage(appName, record, _policy);
}

/**
 * 读取上次持久化的页面缓存（一次性消费，读后清除防串扰）。
 *
 * @param appName - 应用名
 * @param routePath - 当前路由路径
 * @returns 缓存记录，不存在或已过期返回 null
 */
export function consumePersistedPageCache(
  appName: string,
  routePath: string,
): PageCacheRecord | null {
  try {
    const cacheKey = `${NAMESPACE_PREFIX}page-cache:${appName}:${routePath.replace(/[^a-zA-Z0-9-]/g, "_")}`;
    const record = getStorage<PageCacheRecord>(cacheKey);

    if (!record) return null;

    const age = Date.now() - record.createdAt;
    if (age > _policy.ttlMs) {
      removeStorage(cacheKey);
      import("./page-cache-storage").then(({ removeFromRegistry }) => {
        removeFromRegistry(appName, routePath);
      });
      return null;
    }

    removeStorage(cacheKey);
    import("./page-cache-storage").then(({ removeFromRegistry }) => {
      removeFromRegistry(appName, routePath);
    });

    return record;
  } catch (error) {
    logger.warn(`consumePersistedPageCache failed for ${appName}:`, error);
    return null;
  }
}

/**
 * 判断指定应用+路由是否存在未过期的持久化缓存（不消费）。
 *
 * @param appName - 应用名
 * @param routePath - 路由路径
 */
export function hasPersistedPageCache(appName: string, routePath: string): boolean {
  return hasPersistedPageCacheStorage(appName, routePath, _policy);
}

// ==================== 缓存清理 API ====================

/**
 * 清理指定应用的全部页面缓存。
 *
 * @param appName - 应用名
 * @returns 清理的条目数
 */
export function clearPageCacheForApp(appName: string): number {
  return clearPageCacheForAppStorage(appName);
}

/**
 * 清理全部应用的页面缓存（全量重置）。
 */
export function clearAllPageCache(): void {
  clearAllPageCacheStorage();
}

/**
 * 获取缓存状态摘要（供开发工具/调试面板展示）。
 */
export function getCacheSummary(): {
  totalApps: number;
  totalEntries: number;
  apps: Array<{ name: string; entries: number }>;
} {
  return getCacheSummaryStorage();
}

// ==================== 编程式状态存取 API ====================

/**
 * 供业务子应用保存状态到页面缓存。
 *
 * @param appName - 应用名
 * @param key - 状态键
 * @param value - 任意可序列化值
 */
export function saveAppState(appName: string, key: string, value: unknown): void {
  saveAppStateStorage(appName, key, value);
}

/**
 * 读取子应用保存的状态。
 *
 * @param appName - 应用名
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 已保存的值或 defaultValue
 */
export function loadAppState<T>(appName: string, key: string, defaultValue: T): T {
  return loadAppStateStorage(appName, key, defaultValue);
}

/**
 * 删除子应用保存的指定状态。
 */
export function removeAppState(appName: string, key: string): void {
  removeAppStateStorage(appName, key);
}
