/**
 * 路由预测引擎（P1-2）
 *
 * 基于马尔可夫链的一阶转移概率模型，根据用户历史导航序列预测下一步最可能访问的子应用。
 *
 * 核心能力：
 * 1. 记录主子应用间的跳转序列（from → to 转移）
 * 2. 构建一阶转移矩阵（sparse Map 存储）
 * 3. 给定当前应用，按转移概率降序返回 topN 预测结果
 * 4. 持久化到 localStorage，跨会话保留模式
 * 5. 指数衰减：近期导航权重更高，适应行为变化（v4.0 P1-1 落地）
 * 6. P1-1: 持久化节流（5s 批量 flush）+ 条目上限（500 条）
 *
 * P0-2 (v4.2): 修复指数衰减算法——每条转移对独立记录时间戳，
 * 衰减按各转移对的实际年龄计算，而非按上次持久化时间统一计算。
 *
 * 触发时机：
 * - kernel 的 switchToApp 成功时记录一次 transition
 * - bootstrap.ts 在 router.afterEach 中调用 getRoutePredictor().predict(currentApp)
 *
 * 类型定义与常量已提取至 route-predictor-types.ts。
 *
 * @path comm/effects/micro-kernel/src/route-predictor.ts
 * @author ydsz-team
 * @since 4.0.0
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

// 重新导出类型，保持向后兼容
export type { Prediction } from "./route-predictor-types";
export type { PersistedData, TransitionRecord } from "./route-predictor-types";

const logger = createLogger("RoutePredictor");

/**
 * 路由预测器
 *
 * 一阶马尔可夫链模型：给定当前应用 A，计算 P(B|A) = count(A→B) / count(A→*)
 *
 * P0-2 (v4.2): 每条转移对独立记录 `lastSeen` 时间戳，
 * 衰减计算基于各转移对自身的年龄，确保：
 * - 高频近期转移对获得更高权重
 * - 历史低频转移对逐渐衰减
 * - 跨会话加载时正确延续衰减
 */
export class RoutePredictor {
  /** P1-1: 待持久化标记（有未写入的变更时 true） */
  private dirty = false;
  /** 各转移对最近一次发生时间：from → (to → timestamp) */
  private lastSeen: Map<string, Map<string, number>> = new Map();
  /** P1-1: 持久化节流定时器 */
  private persistTimer: null | ReturnType<typeof setTimeout> = null;
  /** 来源的总计数：from → total */
  private totals: Map<string, number> = new Map();
  /** 转移计数：from → (to → count) */
  private transitions: Map<string, Map<string, number>> = new Map();

  constructor() {
    this.load();
  }

  /**
   * 清除所有预测数据。
   */
  clear(): void {
    this.transitions.clear();
    this.lastSeen.clear();
    this.totals.clear();
    this.dirty = false;
    // P1-1: 清理节流定时器
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    // P0-4: 使用统一存储层清理
    removeStorage(STORAGE_KEY);
    removeStorage("ydsz_route_predictions" as StorageKey);
  }

  /**
   * P1-4: 获取全局访问频次最高的应用（排除当前应用）。
   *
   * 作为冷启动 phase 的 fallback 预测，新用户在无历史导航数据时
   * 按整体访问频率预加载热门应用，而非空预加载。
   *
   * @param topN - 返回前 N 个
   * @param excludeApp - 排除的应用名（当前应用）
   * @since 4.0.1
   */
  getGlobalTopApps(topN: number, excludeApp?: string): Prediction[] {
    // 统计所有应用的被访问总次数（作为 to 的目标计数之和）
    const inboundCounts = new Map<string, number>();
    for (const [, toMap] of this.transitions) {
      for (const [to, count] of toMap) {
        inboundCounts.set(to, (inboundCounts.get(to) || 0) + count);
      }
    }

    const predictions: Prediction[] = [];
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
   * 获取所有已知的应用名（有转出记录的应用）。
   */
  getKnownApps(): string[] {
    return [...this.transitions.keys()];
  }

  /**
   * 获取数据摘要（用于 DevTools 面板展示）。
   */
  getSummary(): {
    topPairs: Array<{ count: number; from: string; to: string }>;
    totalTransitions: number;
    uniquePairs: number;
  } {
    const allPairs: Array<{ count: number; from: string; to: string }> = [];
    let totalTransitions = 0;

    for (const [from, toMap] of this.transitions) {
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

  /**
   * 获取特定应用对的转移概率。
   */
  getTransitionProbability(from: string, to: string): number {
    const toMap = this.transitions.get(from);
    const total = this.totals.get(from);
    if (!toMap || !total) return 0;
    return (toMap.get(to) || 0) / total;
  }

  /**
   * 预测给定应用的下一步 topN 目标。
   *
   * P1-4: 当该应用无历史转移数据时，回退到全局高频 topN。
   *
   * @param currentApp - 当前应用名
   * @param topN - 返回前 N 个预测结果，默认 3
   * @param fallbackTopN - 冷启动 fallback 时返回的全局高频数，默认 topN（传 0 禁用 fallback）
   * @returns 按概率降序的预测结果数组
   */
  predict(currentApp: string, topN = 3, fallbackTopN?: number): Prediction[] {
    const toMap = this.transitions.get(currentApp);
    if (!toMap || toMap.size === 0) {
      // P1-4: 冷启动 fallback — 返回全局最高频应用
      const fbN =
        fallbackTopN === undefined ? topN : fallbackTopN > 0 ? fallbackTopN : 0;
      if (fbN > 0) {
        return this.getGlobalTopApps(fbN, currentApp);
      }
      return [];
    }

    const total = this.totals.get(currentApp) || 0;
    if (total === 0) {
      // totals 为 0 但有 transitions 的异常情况，也走 fallback
      const fbN =
        fallbackTopN === undefined ? topN : fallbackTopN > 0 ? fallbackTopN : 0;
      if (fbN > 0) return this.getGlobalTopApps(fbN, currentApp);
      return [];
    }

    const predictions: Prediction[] = [];

    for (const [to, count] of toMap) {
      predictions.push({
        appName: to,
        probability: count / total,
        sampleSize: count,
      });
    }

    // 按概率降序排序，取 topN
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, topN);
  }

  /**
   * 记录一次路由跳转。
   *
   * @param from - 来源应用名
   * @param to - 目标应用名
   */
  recordTransition(from: string, to: string): void {
    if (!from || !to || from === to) return;

    const now = Date.now();

    // 获取或创建 to 的计数矩阵
    let toMap = this.transitions.get(from);
    if (!toMap) {
      toMap = new Map();
      this.transitions.set(from, toMap);
    }

    const prevCount = toMap.get(to) || 0;
    toMap.set(to, prevCount + 1);

    // 更新 totals
    this.totals.set(from, (this.totals.get(from) || 0) + 1);

    // P0-2: 更新该转移对的时间戳
    let seenMap = this.lastSeen.get(from);
    if (!seenMap) {
      seenMap = new Map();
      this.lastSeen.set(from, seenMap);
    }
    seenMap.set(to, now);

    // P1-1: 节流持久化 — 标记 dirty 并设置延迟写入定时器
    this.dirty = true;
    this.schedulePersist();
  }

  /**
   * P0-2 (v4.2): 保存到 localStorage（含指数衰减 + 条目上限淘汰）。
   *
   * 每条转移对按各自的年龄独立衰减：
   * - 年龄 = 当前时间 - 该转移对的 lastSeen 时间戳
   * - 衰减因子 = (1/2)^(age/halflife)
   * - 年龄越老的转移对衰减越剧烈
   *
   * 流程：
   * 1. 收集所有转移对，按各自的 lastSeen 年龄独立衰减
   * 2. 条目超限时淘汰衰减后计数最低的转移对
   * 3. 持久化（带版本号）
   *
   * @param force - 是否跳过 dirty 检查强制写入（HMR _stop 使用）
   */
  save(force = false): void {
    if (!force && !this.dirty) return;
    const now = Date.now();
    const allPairs: Array<{
      count: number;
      from: string;
      timestamp: number;
      to: string;
    }> = [];

    // 1. 收集所有转移对并按各自的年龄独立衰减
    for (const [from, toMap] of this.transitions) {
      const seenMap = this.lastSeen.get(from);
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

    // P0-4: 使用统一存储层（封装容量检测 + 异常静默）
    setStorage(STORAGE_KEY, data);
  }

  // ==================== 持久化 ====================

  /** 从 localStorage 加载（兼容 v1 和 v2 格式） */
  private load(): void {
    // 优先尝试加载 v2 格式
    const v2Loaded = this.loadV2();
    if (!v2Loaded) {
      // 回退到 v1 格式加载并转换
      this.loadV1();
    }
  }

  /** 加载 v1 格式数据（向后兼容，统一初始化为当前时间） */
  private loadV1(): void {
    // P0-4: 使用统一存储层（v1 key 不在注册表中，使用 string 传入）
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

      let toMap = this.transitions.get(record.from);
      if (!toMap) {
        toMap = new Map();
        this.transitions.set(record.from, toMap);
      }

      let seenMap = this.lastSeen.get(record.from);
      if (!seenMap) {
        seenMap = new Map();
        this.lastSeen.set(record.from, seenMap);
      }

      // v1 数据无 per-pair 时间戳，视为本次会话新数据
      const existingCount = toMap.get(record.to) || 0;
      toMap.set(record.to, Math.max(existingCount, record.count));
      seenMap.set(record.to, now); // 标记为当前时间（首次加载时统一）

      // P1-5: 累加所有转移计数作为 totals
      const existingTotal = this.totals.get(record.from) || 0;
      this.totals.set(record.from, existingTotal + record.count);
    }

    // 迁移：立即以 v2 格式保存
    this.dirty = true;
    this.save();
    // 清理旧数据
    removeStorage("ydsz_route_predictions" as StorageKey);
  }

  /** 加载 v2 格式数据 */
  private loadV2(): boolean {
    // P0-4: 使用统一存储层
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

      let toMap = this.transitions.get(record.from);
      if (!toMap) {
        toMap = new Map();
        this.transitions.set(record.from, toMap);
      }

      let seenMap = this.lastSeen.get(record.from);
      if (!seenMap) {
        seenMap = new Map();
        this.lastSeen.set(record.from, seenMap);
      }

      // P0-2: 跨会话衰减——基于该转移对自身的 lastSeen 时间
      const age = now - record.timestamp;
      const decayFactor = 0.5 ** (age / DECAY_HALFLIFE_MS);
      const decayedCount = record.count * decayFactor;

      if (decayedCount < 0.01) continue; // 衰减后过小则丢弃

      const existingCount = toMap.get(record.to) || 0;
      // 合并取最大值（避免与内存中已有数据重复累加）
      toMap.set(record.to, Math.max(existingCount, decayedCount));
      seenMap.set(record.to, record.timestamp);

      // P1-5: 累加所有衰减后的转移计数作为 totals（概率归一化分母）
      const existingTotal = this.totals.get(record.from) || 0;
      this.totals.set(record.from, existingTotal + decayedCount);
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
  private schedulePersist(): void {
    if (this.persistTimer !== null) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      if (this.dirty) {
        this.save();
        this.dirty = false;
      }
    }, PERSIST_THROTTLE_MS);
  }
}

/** 全局单例 */
let instance: null | RoutePredictor = null;

/**
 * 获取路由预测器单例。
 */
export function getRoutePredictor(): RoutePredictor {
  if (!instance) {
    instance = new RoutePredictor();
  }
  return instance;
}

/**
 * 重置路由预测器（用于测试）。
 */
export function resetRoutePredictor(): void {
  instance?.clear();
  instance = null;
}

/**
 * P0-A1: 创建 route-predictor 生命周期管理器。
 *
 * dispose() 时先持久化转移矩阵到 localStorage（保留用户导航模式数据），
 * 再清理内存中的实例。
 *
 * @since 4.1.0
 */
export function createRoutePredictorManager(): import("./manager-registry").DisposableManager {
  return {
    name: "route-predictor",
    dispose(): void {
      try {
        instance?.save(true);
      } catch {
        /* 持久化失败不影响清理 */
      }
      instance?.clear();
      instance = null;
    },
  };
}
