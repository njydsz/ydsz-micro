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
 * @path comm/effects/micro-kernel/src/page-cache-manager.ts
 * @author ydsz-team
 * @since 4.2.2
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { getStorage, setStorage, removeStorage, STORAGE_KEYS } from "./storage-utils";

const logger = createLogger("PageCacheManager");

// ==================== 类型定义 ====================

/** 单条页面缓存记录 */
export interface PageCacheRecord {
  /** 滚动位置 */
  scroll: ScrollPosition;
  /** 应用自定义状态快照（来自 serialize()） */
  appState: unknown;
  /** 缓存创建时间戳 */
  createdAt: number;
  /** 路由 path（用于校验缓存是否对应当前路由） */
  routePath: string;
}

/** 滚动位置信息 */
export interface ScrollPosition {
  /** window 垂直滚动位置 */
  windowScrollY: number;
  /** window 水平滚动位置 */
  windowScrollX: number;
  /** 可滚动容器的滚动位置（CSS 选择器 → {top, left}） */
  containers: Record<string, { top: number; left: number }>;
}

/** 缓存策略配置 */
export interface PageCachePolicy {
  /** 单应用最大缓存条目数（按路由 path 区分，默认 10） */
  maxEntriesPerApp: number;
  /** 缓存 TTL（毫秒，默认 24 小时） */
  ttlMs: number;
  /** 滚动位置恢复延迟（毫秒，等待渲染完成，默认 100ms） */
  restoreScrollDelayMs: number;
  /** 记录的最大容器滚动位置数（防止 DOM 探测器开销过大，默认 20） */
  maxContainerScrolls: number;
}

// ==================== 默认策略 ====================

const DEFAULT_POLICY: PageCachePolicy = {
  maxEntriesPerApp: 10,
  ttlMs: 24 * 60 * 60 * 1000, // 24 小时
  restoreScrollDelayMs: 100,
  maxContainerScrolls: 20,
};

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

// ==================== localStorage 	key 管理 ====================

/** 缓存存储 registry key（记录已缓存的 app 列表） */
const CACHE_REGISTRY_KEY = `${STORAGE_KEYS.CANARY_CONFIG}-page-cache-registry`;

/**
 * 生成单条缓存的存储 key（按路由 path 区分）
 */
function buildCacheKey(appName: string, routePath: string): string {
  // 将 path 中的 / 和特殊字符转换为安全 key
  const safePath = routePath.replace(/[^a-zA-Z0-9-]/g, "_");
  return `${NAMESPACE_PREFIX}page-cache:${appName}:${safePath}`;
}

const NAMESPACE_PREFIX = "micro-kernel:";

// ==================== 滚动位置捕获 ====================

/**
 * 捕获当前页面滚动位置（window + 可滚动容器）。
 *
 * 应在 deactivateApp（keepAlive 摘除 DOM）之前调用，
 * 否则容器已脱离文档流，scrollTop/scrollLeft 可能读不到。
 *
 * @param container - 子应用根容器元素
 * @returns 滚动位置快照
 */
export function captureScrollPosition(container: HTMLElement): ScrollPosition {
  const position: ScrollPosition = {
    windowScrollY: window.scrollY || window.pageYOffset,
    windowScrollX: window.scrollX || window.pageXOffset,
    containers: {},
  };

  // 探测可滚动容器：在子应用容器范围内查找 overflow: auto/scroll 的元素
  const scrollableSelectors = findScrollableContainers(container, _policy.maxContainerScrolls);
  for (const { el, selector } of scrollableSelectors) {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      position.containers[selector] = {
        top: el.scrollTop,
        left: el.scrollLeft,
      };
    }
  }

  return position;
}

/**
 * 查找子应用容器内的可滚动元素。
 *
 * 排除 window/document 级别，仅查找 overflow-y: auto/scroll 的块级元素。
 * 返回结果按文档顺序排列，限制数量以防性能开销。
 *
 * @param root - 子应用根容器
 * @param limit - 最大查找数量
 */
function findScrollableContainers(
  root: HTMLElement,
  limit: number,
): Array<{ el: HTMLElement; selector: string }> {
  const result: Array<{ el: HTMLElement; selector: string }> = [];
  const allElements = root.querySelectorAll<HTMLElement>("*");

  for (const el of allElements) {
    if (result.length >= limit) break;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;

    // 排除不可见元素（getComputedStyle 对 display:none 返回 ""）
    if (!overflowY && !overflowX) continue;

    const isScrollableY = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
    const isScrollableX = (overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth;

    if (isScrollableY || isScrollableX) {
      result.push({
        el,
        selector: generateSelector(el),
      });
    }
  }

  return result;
}

/**
 * 为元素生成简短的选择器路径（用于恢复时定位）。
 *
 * 优先使用 id，其次用 class（首个类名），最后用标签 + nth-child。
 */
function generateSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === "string") {
    const classes = el.className.trim().split(/\s+/).filter(Boolean);
    if (classes.length > 0) return `.${classes[0]}`;
  }
  // 简化：返回 tagName + data-micro-app 属性链
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (child) => (child as HTMLElement).tagName === el.tagName,
    );
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el);
      return `${tag}:nth-child(${idx + 1})`;
    }
  }
  return tag;
}

// ==================== 滚动位置恢复 ====================

/**
 * 恢复页面滚动位置（window + 容器）。
 *
 * 应在 activateApp hydrate 之后调用，此时 DOM 尺寸已就位。
 * 使用 requestAnimationFrame 确保渲染帧就绪。
 *
 * @param record - 缓存记录
 * @param container - 子应用根容器元素
 */
export function restoreScrollPosition(
  record: PageCacheRecord,
  container: HTMLElement,
): void {
  const { scroll } = record;
  const delay = _policy.restoreScrollDelayMs;

  // 延迟恢复：等待 Vue 完成异步渲染 + hydration
  setTimeout(() => {
    // 恢复 window 滚动（仅当路由 path 一致时）
    if (record.routePath === location.pathname) {
      window.scrollTo(scroll.windowScrollX, scroll.windowScrollY);
    }

    // 恢复容器滚动
    for (const [selector, pos] of Object.entries(scroll.containers)) {
      const el = container.querySelector<HTMLElement>(selector);
      if (el) {
        el.scrollTo(pos.left, pos.top);
      }
    }
  }, delay);
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
