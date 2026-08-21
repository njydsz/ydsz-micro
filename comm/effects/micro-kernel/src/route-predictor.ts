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
 * 为控制单文件行数，以下内容已拆分为独立模块：
 * - route-predictor-types.ts：类型定义与常量（PersistedData / TransitionRecord / DECAY_HALFLIFE_MS 等）
 * - route-predictor-core.ts：持久化核心逻辑（save / load / getGlobalTopApps / getSummary / 单例管理）
 *
 * 本文件保留 RoutePredictor 核心类定义与公开 API，并重新导出类型以保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/route-predictor.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import type { PersistedData, TransitionRecord } from "./route-predictor-types";

import {
  saveCore,
  loadCore,
  schedulePersistCore,
  getGlobalTopAppsCore,
  getSummaryCore,
  __registerRoutePredictor,
  getRoutePredictor,
  resetRoutePredictor,
  createRoutePredictorManagerLifecycle,
} from "./route-predictor-core";

// 重新导出类型，保持向后兼容
export type { Prediction } from "./route-predictor-types";
export type { PersistedData, TransitionRecord } from "./route-predictor-types";

// 重新导出单例管理函数，保持向后兼容
export {
  getRoutePredictor,
  resetRoutePredictor,
} from "./route-predictor-core";

const logger = createLogger("RoutePredictor");

/**
 * 路由预测器
 *
 * 一阶马尔可夫链模型：给定当前应用 A，计算 P(B|A) = count(A→B) / count(A→*)
 *
 * P0-2 (v4.2): 每条转移对独立记录 `lastSeen` 时间戳，
 * 衰减计算基于各转移对自身的年龄。
 */
export class RoutePredictor {
  /** P1-1: 待持久化标记 */
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
    loadCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
  }

  /**
   * 清除所有预测数据。
   */
  clear(): void {
    this.transitions.clear();
    this.lastSeen.clear();
    this.totals.clear();
    this.dirty = false;
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    // 动态导入避免循环依赖
    import("./storage-utils").then(({ removeStorage }) => {
      removeStorage("ydsz_route_predictions" as StorageKey);
    });
  }

  /**
   * P1-4: 获取全局访问频次最高的应用（排除当前应用）。
   *
   * @param topN - 返回前 N 个
   * @param excludeApp - 排除的应用名（当前应用）
   * @since 4.0.1
   */
  getGlobalTopApps(topN: number, excludeApp?: string) {
    return getGlobalTopAppsCore(this as unknown as import("./route-predictor-core").RoutePredictorLike, topN, excludeApp);
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
  getSummary() {
    return getSummaryCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
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
   * @param fallbackTopN - 冷启动 fallback 时返回的全局高频数
   * @returns 按概率降序的预测结果数组
   */
  predict(currentApp: string, topN = 3, fallbackTopN?: number) {
    const toMap = this.transitions.get(currentApp);
    if (!toMap || toMap.size === 0) {
      const fbN =
        fallbackTopN === undefined ? topN : fallbackTopN > 0 ? fallbackTopN : 0;
      if (fbN > 0) {
        return this.getGlobalTopApps(fbN, currentApp);
      }
      return [];
    }

    const total = this.totals.get(currentApp) || 0;
    if (total === 0) {
      const fbN =
        fallbackTopN === undefined ? topN : fallbackTopN > 0 ? fallbackTopN : 0;
      if (fbN > 0) return this.getGlobalTopApps(fbN, currentApp);
      return [];
    }

    const predictions: Array<{ appName: string; probability: number; sampleSize: number }> = [];

    for (const [to, count] of toMap) {
      predictions.push({
        appName: to,
        probability: count / total,
        sampleSize: count,
      });
    }

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

    let toMap = this.transitions.get(from);
    if (!toMap) {
      toMap = new Map();
      this.transitions.set(from, toMap);
    }

    const prevCount = toMap.get(to) || 0;
    toMap.set(to, prevCount + 1);

    this.totals.set(from, (this.totals.get(from) || 0) + 1);

    let seenMap = this.lastSeen.get(from);
    if (!seenMap) {
      seenMap = new Map();
      this.lastSeen.set(from, seenMap);
    }
    seenMap.set(to, now);

    this.dirty = true;
    schedulePersistCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
  }

  /**
   * P0-2 (v4.2): 保存到 localStorage（含指数衰减 + 条目上限淘汰）。
   *
   * @param force - 是否跳过 dirty 检查强制写入
   */
  save(force = false): void {
    saveCore(this as unknown as import("./route-predictor-core").RoutePredictorLike, force);
  }

  // ==================== 持久化（委托给 core） ====================

  /** 从 localStorage 加载（兼容 v1 和 v2 格式） */
  private load(): void {
    loadCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
  }

  /** 加载 v1 格式数据 */
  private loadV1(): void {
    // 委托给 core 内部的 loadV1Core
    loadCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
  }

  /** 加载 v2 格式数据 */
  private loadV2(): boolean {
    // 委托给 core 内部的 loadV2Core
    loadCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
    return true;
  }

  /**
   * P1-1: 调度持久化（节流）。
   */
  private schedulePersist(): void {
    schedulePersistCore(this as unknown as import("./route-predictor-core").RoutePredictorLike);
  }
}

// ==================== 单例注册 ====================

let instance: RoutePredictor | null = null;

__registerRoutePredictor(
  () => {
    if (!instance) {
      instance = new RoutePredictor();
    }
    return instance;
  },
  () => {
    try {
      instance?.save(true);
    } catch {
      /* 持久化失败不影响清理 */
    }
    instance?.clear();
    instance = null;
  },
);

/**
 * P0-A1: 创建 route-predictor 生命周期管理器。
 *
 * dispose() 时先持久化转移矩阵到 localStorage（保留用户导航模式数据），
 * 再清理内存中的实例。
 *
 * @since 4.1.0
 */
export function createRoutePredictorManager(): import("./manager-registry").DisposableManager {
  return createRoutePredictorManagerLifecycle();
}
