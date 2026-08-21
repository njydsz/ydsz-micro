/**
 * 页面缓存管理器类型定义
 *
 * 从 page-cache-manager.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/page-cache-types.ts
 * @author ydsz-team
 * @since 4.2.2
 */

import { STORAGE_KEYS } from "./storage-utils";

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

/** 默认缓存策略 */
export const DEFAULT_POLICY: PageCachePolicy = {
  maxEntriesPerApp: 10,
  ttlMs: 24 * 60 * 60 * 1000, // 24 小时
  restoreScrollDelayMs: 100,
  maxContainerScrolls: 20,
};

/** 缓存存储 registry key（记录已缓存的 app 列表） */
export const CACHE_REGISTRY_KEY = `${STORAGE_KEYS.CANARY_CONFIG}-page-cache-registry`;

/** 命名空间前缀 */
export const NAMESPACE_PREFIX = "micro-kernel:";
