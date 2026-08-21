/**
 * route-predictor-core.ts — RoutePredictor 持久化核心逻辑
 *
 * 从 route-predictor.ts 提取的持久化逻辑，包含：
 * - save: 保存到 localStorage（含指数衰减 + 条目上限淘汰）
 * - load / loadV1 / loadV2: 从 localStorage 加载（兼容 v1 和 v2 格式）
 * - schedulePersist: 节流持久化调度
 * - getGlobalTopApps: 全局访问频次最高的应用
 * - getSummary: 数据摘要（DevTools 面板展示）
 * - 单例管理函数
 *
 * @path comm/effects/micro-kernel/src/route-predictor-core.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { getStorage, removeStorage, setStorage } from "./storage-utils";
import type { PersistedData, TransitionRecord } from "./route-predictor-types";
import {
  DECAY_HALFLIFE_MS,
  MAX_RETENTION_MS,
  MAX_TRANSITION_ENTRIES,
  PERSIST_THROTTLE_MS,
  STORAGE_KEY,
} from "./route-predictor-types";

const logger = createLogger("RoutePredictor");

/**
 * RoutePredictor 内部状态接口
 */
export interface RoutePredictorLike {
  dirty: boolean;
  lastSeen: Map<string, Map<string, number>>;
  persistTimer: null | ReturnType<typeof setTimeout>;
  totals: Map<string, number>;
  transitions: Map<string, Map<string, number>>;
}

/**
 * P0-2 (v4.2): 保存到 localStorage（含指数衰减 + 条目上限淘汰）。
 *
 * 每条转移对按各自的年龄独立衰减：
 * - 年龄 = 当前时间 - 该转移对的 lastSeen 时间戳
 * - 衰减因子 = (1/2)^(age/halflife)
 * - 年龄越老的转移对衰减越剧烈
 *
 * @param predictor - RoutePredictor 实例
 * @param force - 是否跳过 dirty 检查强制写入
 */
export function saveCore(
  predictor: RoutePredictorLike,
  force = false,
): void {
  if (!force && !predictor.dirty) return;
  const now = Date.now();
  const allPairs: Array<{
    count: number;
    from: string;
    timestamp: number;
    to: string;
  }> = [];

  // 1. 收集所有转移对并按各自的年龄独立衰减
  for (const [from, toMap] of predictor.transitions) {
    const seenMap = predictor.lastSeen.get(from);
    for (const [to, count] of toMap) {
      const pairLastSeen = seenMap?.get(to) ?? now;
      const age = now - pairLastSeen;
      const decayFactor = 0.5 ** (age / DECAY_HALFLIFE_MS);
      const decayedCount = count * decayFactor;
      if (decayedCount > 0.01) {
        allPairs.push({
          from,
          to,
          count: decayedCount,
          timestamp: pairLastSeen,
        });
      }
    }
  }

  // 2. 按衰减后计数降序排序，截断到上限
  if (allPairs.length > MAX_TRANSITION_ENTRIES) {
    allPairs.sort((a, b) => b.count - a.count);
    const evicted = allPairs.length - MAX_TRANSITION_ENTRIES;
    allPairs.length = MAX_TRANSITION_ENTRIES;
    logger.debug(
      `RoutePredictor: evicted ${evicted} low-count pairs (limit=${MAX_TRANSITION_ENTRIES})`,
    );
  }

  // 3. 构建持久化格式（使用版本2）
  const data: PersistedData = {
    version: 2,
    transitions: allPairs.map((p) => ({
      from: p.from,
      to: p.to,
      count: Math.max(1, Math.round(p.count)),
      timestamp: p.timestamp,
    })),
    lastUpdated: now,
  };

  setStorage(STORAGE_KEY, data);
}

/** 从 localStorage 加载（兼容 v1 和 v2 格式） */
export function loadCore(predictor: RoutePredictorLike): void {
  const v2Loaded = loadV2Core(predictor);
  if (!v2Loaded) {
    loadV1Core(predictor);
  }
}

/** 加载 v1 格式数据（向后兼容，统一初始化为当前时间） */
function loadV1Core(predictor: RoutePredictorLike): void {
  type V1Data = {
    lastUpdated: number;
    transitions: TransitionRecord[];
    version: 1;
  };
  const data = getStorage<null | V1Data>(
    "ydsz_route_predictions" as StorageKey,
    null,
  );
  if (!data) return;
  if (data.version !== 1) return;
  if (Date.now() - data.lastUpdated > MAX_RETENTION_MS) {
    removeStorage("ydsz_route_predictions" as StorageKey);
    return;
  }

  const now = Date.now();
  for (const record of data.transitions) {
    if (!record.from || !record.to || record.from === record.to) continue;

    let toMap = predictor.transitions.get(record.from);
    if (!toMap) {
      toMap = new Map();
      predictor.transitions.set(record.from, toMap);
    }

    let seenMap = predictor.lastSeen.get(record.from);
    if (!seenMap) {
      seenMap = new Map();
      predictor.lastSeen.set(record.from, seenMap);
    }

    const existingCount = toMap.get(record.to) || 0;
    toMap.set(record.to, Math.max(existingCount, record.count));
    seenMap.set(record.to, now);

    const existingTotal = predictor.totals.get(record.from) || 0;
    predictor.totals.set(record.from, existingTotal + record.count);
  }

  predictor.dirty = true;
  saveCore(predictor);
  removeStorage("ydsz_route_predictions" as StorageKey);
}

/** 加载 v2 格式数据 */
function loadV2Core(predictor: RoutePredictorLike): boolean {
  const data = getStorage<null | PersistedData>(STORAGE_KEY, null);
  if (!data) return false;
  if (data.version !== 2) return false;
  if (Date.now() - data.lastUpdated > MAX_RETENTION_MS) {
    removeStorage(STORAGE_KEY);
    return false;
  }

  const now = Date.now();
  for (const record of data.transitions) {
    if (!record.from || !record.to || record.from === record.to) continue;

    let toMap = predictor.transitions.get(record.from);
    if (!toMap) {
      toMap = new Map();
      predictor.transitions.set(record.from, toMap);
    }

    let seenMap = predictor.lastSeen.get(record.from);
    if (!seenMap) {
      seenMap = new Map();
      predictor.lastSeen.set(record.from, seenMap);
    }

    const age = now - record.timestamp;
    const decayFactor = 0.5 ** (age / DECAY_HALFLIFE_MS);
    const decayedCount = record.count * decayFactor;

    if (decayedCount < 0.01) continue;

    const existingCount = toMap.get(record.to) || 0;
    toMap.set(record.to, Math.max(existingCount, decayedCount));
    seenMap.set(record.to, record.timestamp);

    const existingTotal = predictor.totals.get(record.from) || 0;
    predictor.totals.set(record.from, existingTotal + decayedCount);
  }

  logger.debug(
    `Loaded ${data.transitions.length} historical transitions (v2)`,
  );
  return true;
}

/**
 * P1-1: 调度持久化（节流）。
 *
 * 每次调用重置定时器，确保高频路由跳转仅触发一次写入。
 */
export function schedulePersistCore(predictor: RoutePredictorLike): void {
  if (predictor.persistTimer !== null) return;
  predictor.persistTimer = setTimeout(() => {
    predictor.persistTimer = null;
    if (predictor.dirty) {
      saveCore(predictor);
      predictor.dirty = false;
    }
  }, PERSIST_THROTTLE_MS);
}

/**
 * P1-4: 获取全局访问频次最高的应用（排除当前应用）。
 *
 * 作为冷启动 phase 的 fallback 预测，新用户在无历史导航数据时
 * 按整体访问频率预加载热门应用，而非空预加载。
 *
 * @param predictor - RoutePredictor 实例
 * @param topN - 返回前 N 个
 * @param excludeApp - 排除的应用名（当前应用）
 * @since 4.0.1
 */
export function getGlobalTopAppsCore(
  predictor: RoutePredictorLike,
  topN: number,
  excludeApp?: string,
): Array<{ appName: string; probability: number; sampleSize: number }> {
  const inboundCounts = new Map<string, number>();
  for (const [, toMap] of predictor.transitions) {
    for (const [to, count] of toMap) {
      inboundCounts.set(to, (inboundCounts.get(to) || 0) + count);
    }
  }

  const predictions: Array<{ appName: string; probability: number; sampleSize: number }> = [];
  let totalVisits = 0;
  for (const count of inboundCounts.values()) {
    totalVisits += count;
  }

  if (totalVisits === 0) return [];

  for (const [appName, count] of inboundCounts) {
    if (appName === excludeApp) continue;
    predictions.push({
      appName,
      probability: count / totalVisits,
      sampleSize: count,
    });
  }

  return predictions
    .sort((a, b) => b.probability - a.probability)
    .slice(0, topN);
}

/**
 * 获取数据摘要（用于 DevTools 面板展示）。
 *
 * @param predictor - RoutePredictor 实例
 */
export function getSummaryCore(
  predictor: RoutePredictorLike,
): {
  topPairs: Array<{ count: number; from: string; to: string }>;
  totalTransitions: number;
  uniquePairs: number;
} {
  const allPairs: Array<{ count: number; from: string; to: string }> = [];
  let totalTransitions = 0;

  for (const [from, toMap] of predictor.transitions) {
    for (const [to, count] of toMap) {
      allPairs.push({ from, to, count });
      totalTransitions += count;
    }
  }

  return {
    totalTransitions,
    uniquePairs: allPairs.length,
    topPairs: allPairs.sort((a, b) => b.count - a.count).slice(0, 10),
  };
}

// ==================== 单例管理 ====================

type RoutePredictorInterface = import("./route-predictor").RoutePredictor;

let instanceGetter: (() => RoutePredictorInterface) | null = null;
let instanceDestroyer: (() => void) | null = null;

/**
 * 注册 RoutePredictor 单例工厂
 */
export function __registerRoutePredictor(
  getter: () => RoutePredictorInterface,
  destroyer: () => void,
): void {
  instanceGetter = getter;
  instanceDestroyer = destroyer;
}

/**
 * 获取路由预测器单例。
 */
export function getRoutePredictor(): RoutePredictorInterface {
  if (!instanceGetter) {
    throw new Error(
      "RoutePredictor not initialized. Ensure route-predictor.ts is imported.",
    );
  }
  return instanceGetter();
}

/**
 * 重置路由预测器（用于测试）。
 */
export function resetRoutePredictor(): void {
  instanceDestroyer?.();
}

/**
 * P0-A1: 创建 route-predictor 生命周期管理器。
 *
 * @since 4.1.0
 */
export function createRoutePredictorManagerLifecycle(): import("./manager-registry").DisposableManager {
  return {
    name: "route-predictor",
    dispose(): void {
      try {
        instanceDestroyer?.();
      } catch {
        /* 持久化失败不影响清理 */
      }
    },
  };
}
