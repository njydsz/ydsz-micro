/**
 * page-cache-manager.ts — 子应用 Page Cache 状态记忆机制 (P3-4)
 *
 * 在 v4.2.1 N6（serialize/hydrate 基础设施）之上，补充：
 * 1. 滚动位置记忆与恢复（window + 可滚动容器）
 * 2. localStorage 持久化（崩溃恢复：页面刷新后可还原上次的列表页/表单状态）
 * 3. 缓存策略管理（每应用 opt-in / maxEntries / TTL / LRU 淘汰）
 * 4. 编程式 API（供业务子应用存取任意 UI 状态，如筛选条件、Tab 激活键）
 *
 * 与 v4.2.1 N6 的关系：
 * - N6 提供应用级 serialize()/hydate() 生命周期钩子 → 子应用自定义状态
 * - Page Cache Manager 提供框架级的滚动位置 + localStorage 兜底 → 零成本收益
 *
 * 设计选择：
 * - 滚动位置捕获在 deactivateApp 之前（DOM 还在，scrollTop 可读）
 * - 滚动位置恢复在 activateApp hydrate 之后（DOM 尺寸已就位）
 * - localStorage 写入在 serialize 之后（拿到最新状态一并持久化）
 * - localStorage 读取在下次应用加载时（一次性，读后清除防串扰）
 *
 * 类型定义已提取至 page-cache-types.ts，滚动工具提取至 page-cache-scroll.ts。
 *
 * @path comm/effects/micro-kernel/src/page-cache-manager.ts
 * @author ydsz-team
 * @since 4.2.2
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { getStorage, setStorage, removeStorage } from "./storage-utils";
import type { PageCachePolicy, PageCacheRecord, ScrollPosition } from "./page-cache-types";
import {
  CACHE_REGISTRY_KEY,
  DEFAULT_POLICY,
  NAMESPACE_PREFIX,
} from "./page-cache-types";
import { captureScrollPosition, restoreScrollPosition } from "./page-cache-scroll";

// 重新导出类型，保持向后兼容
export type {
  PageCachePolicy,
  PageCacheRecord,
  ScrollPosition,
} from "./page-cache-types";

const logger = createLogger("PageCacheManager");

// ==================== 全局配置 ====================

let _policy: PageCachePolicy = { ...DEFAULT_POLICY };

/**
 * 更新全局缓存策略。
 *
 * @param partial - 部分覆盖默认策略
 */
export function configurePageCache(partial: Partial<PageCachePolicy>): void {
  _policy = { ..._policy, ...partial };
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
}

// ==================== localStorage key 管理 ====================

/**
 * 生成单条缓存的存储 key（按路由 path 区分）
 */
function buildCacheKey(appName: string, routePath: string): string {
  // 将 path 中的 / 和特殊字符转换为安全 key
  const safePath = routePath.replace(/[^a-zA-Z0-9-]/g, "_");
  return `${NAMESPACE_PREFIX}page-cache:${appName}:${safePath}`;
}

// ==================== 滚动位置捕获/恢复（委托给 page-cache-scroll.ts） ====================

/**
 * 捕获当前页面滚动位置（window + 可滚动容器）。
 *
 * 应在 deactivateApp（keepAlive 摘除 DOM）之前调用，
 * 否则容器已脱离文档流，scrollTop/scrollLeft 可能读不到。
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
 * 应在 activateApp hydrate 之后调用，此时 DOM 尺寸已就位。
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
 * 流程：
 * 1. 读取 registry → 获取该应用已缓存的 route 列表
 * 2. 写入/更新当前 route 缓存
 * 3. LRU 淘汰（超 maxEntriesPerApp 时移除最旧条目）
 * 4. 更新 registry
 *
 * @param appName - 应用名
 * @param record - 缓存记录
 * @returns 被淘汰的 route 列表（供日志/分析使用）
 */
export function persistPageCache(appName: string, record: PageCacheRecord): string[] {
  const evicted: string[] = [];

  try {
    const registry = readRegistry();
    let entries = registry[appName] || [];

    // 移除同 path 的旧条目（更新为最新）
    entries = entries.filter((e) => e.routePath !== record.routePath);

    // LRU 淘汰
    while (entries.length >= _policy.maxEntriesPerApp) {
      const victim = entries.shift();
      if (victim) {
        removeStorage(buildCacheKey(appName, victim.routePath));
        evicted.push(victim.routePath);
      }
    }

    // 追加新条目
    entries.push({
      routePath: record.routePath,
      createdAt: record.createdAt,
    });
    registry[appName] = entries;

    // 写入 cache 记录
    setStorage(buildCacheKey(appName, record.routePath), record);
    // 更新 registry
    setStorage(CACHE_REGISTRY_KEY, registry);
  } catch (error) {
    logger.warn(`persistPageCache failed for ${appName}:`, error);
  }

  return evicted;
}

/**
 * 读取上次持久化的页面缓存（一次性消费，读后清除防串扰）。
 *
 * 在子应用首次挂载时调用（activateApp 早期），
 * 若存在缓存且未过期，返回记录供 hydrate 阶段使用。
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
    const cacheKey = buildCacheKey(appName, routePath);
    const record = getStorage<PageCacheRecord>(cacheKey);

    if (!record) return null;

    // TTL 检查
    const age = Date.now() - record.createdAt;
    if (age > _policy.ttlMs) {
      // 已过期：清除并返回 null
      removeStorage(cacheKey);
      removeFromRegistry(appName, routePath);
      return null;
    }

    // 一次性消费：读取后立即清除（避免下次导航误用旧状态）
    removeStorage(cacheKey);
    removeFromRegistry(appName, routePath);

    return record;
  } catch (error) {
    logger.warn(`consumePersistedPageCache failed for ${appName}:`, error);
    return null;
  }
}

/**
 * 判断指定应用+路由是否存在未过期的持久化缓存（不消费）。
 * 供开发工具/调试面板查询缓存状态使用。
 *
 * 发现已过期缓存时主动清理（避免僵尸条目占用存储）。
 *
 * @param appName - 应用名
 * @param routePath - 路由路径
 */
export function hasPersistedPageCache(appName: string, routePath: string): boolean {
  try {
    const cacheKey = buildCacheKey(appName, routePath);
    const record = getStorage<PageCacheRecord>(cacheKey);
    if (!record) return false;
    const age = Date.now() - record.createdAt;
    if (age > _policy.ttlMs) {
      // 过期：主动清理缓存和 registry 条目
      removeStorage(cacheKey);
      removeFromRegistry(appName, routePath);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ==================== Registry 管理 ====================

interface CacheRegistry {
  [appName: string]: Array<{ routePath: string; createdAt: number }>;
}

function readRegistry(): CacheRegistry {
  try {
    return getStorage<CacheRegistry>(CACHE_REGISTRY_KEY) || {};
  } catch {
    return {};
  }
}

function removeFromRegistry(appName: string, routePath: string): void {
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

// ==================== 缓存清理 API ====================

/**
 * 清理指定应用的全部页面缓存。
 *
 * @param appName - 应用名
 * @returns 清理的条目数
 */
export function clearPageCacheForApp(appName: string): number {
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
export function clearAllPageCache(): void {
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
export function getCacheSummary(): {
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
 * 供业务子应用保存状态到页面缓存（与框架级滚动位置互不干扰）。
 *
 * 场景：用户在列表页选择了筛选条件 → 切走 → 切回时恢复筛选。
 *
 * @param appName - 应用名
 * @param key - 状态键（命名空间：`app-state`）
 * @param value - 任意可序列化值
 */
export function saveAppState(appName: string, key: string, value: unknown): void {
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
export function loadAppState<T>(appName: string, key: string, defaultValue: T): T {
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
 */
export function removeAppState(appName: string, key: string): void {
  try {
    const stateKey = `${NAMESPACE_PREFIX}app-state:${appName}:${key}`;
    removeStorage(stateKey);
  } catch (error) {
    logger.warn(`removeAppState failed for ${appName}/${key}:`, error);
  }
}
