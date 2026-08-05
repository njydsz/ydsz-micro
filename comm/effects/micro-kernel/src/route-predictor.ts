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
 * 触发时机：
 * - kernel 的 switchToApp 成功时记录一次 transition
 * - bootstrap.ts 在 router.afterEach 中调用 getRoutePredictor().predict(currentApp)
 *
 * @path comm/effects/micro-kernel/src/route-predictor.ts
 * @author remi-team
 * @since 4.0.0
 */

import { createLogger } from '@remi-core/shared/utils';

const logger = createLogger('RoutePredictor');

/** localStorage key */
const STORAGE_KEY = 'remi_route_predictions';

/** 最大保留的转移记录时间窗口（7 天） */
const MAX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * P1-1: 持久化节流间隔（毫秒）。
 *
 * 路由跳转可能高频触发（如快速切换 Tab），每次写入 localStorage 性能开销大。
 * 延迟 5s 批量写入，期间多次 recordTransition 仅更新内存状态，
 * 最后一次 flush 时序列化整个转移矩阵。
 */
const PERSIST_THROTTLE_MS = 5_000;

/**
 * P1-1: 最大转移条目数（from→to 对）。
 *
 * 超过上限时淘汰总计数最低的转移对，防止 Map 无限膨胀导致：
 * 1. 内存占用持续增长
 * 2. localStorage 序列化/反序列化耗时增加
 * 3. 过时行为模式权重过高
 */
const MAX_TRANSITION_ENTRIES = 500;

/**
 * P1-1: 指数衰减半衰期（毫秒）。
 *
 * 记录在 persist 时按 (1/2)^(age/halflife) 衰减计数，
 * 使近期导航模式权重高于历史模式，适应用户行为变化。
 * 默认 3 天：3 天前的记录权重降为 50%，6 天前 25%，以此类推。
 */
const DECAY_HALFLIFE_MS = 3 * 24 * 60 * 60 * 1000;

/** 转移记录 */
interface TransitionRecord {
  /** 来源应用名 */
  from: string;
  /** 目标应用名 */
  to: string;
  /** 时间戳 (ms) */
  timestamp: number;
  /** 转移次数（聚合后） */
  count: number;
}

/** 持久化数据结构 */
interface PersistedData {
  version: 1;
  transitions: TransitionRecord[];
  lastUpdated: number;
}

/** 预测结果 */
export interface Prediction {
  /** 预测的目标应用名 */
  appName: string;
  /** 预测概率（0~1） */
  probability: number;
  /** 基于多少次转移记录 */
  sampleSize: number;
}

/**
 * 路由预测器
 *
 * 一阶马尔可夫链模型：给定当前应用 A，计算 P(B|A) = count(A→B) / count(A→*)
 */
export class RoutePredictor {
  /** 转移记录：from → (to → count) */
  private transitions: Map<string, Map<string, number>> = new Map();
  /** 来源的总计数：from → total */
  private totals: Map<string, number> = new Map();
  /** 去重集合：记录已处理的 (from,to) 对，用于增量合并 */
  private seenKeys: Set<string> = new Set();
  /** P1-1: 持久化节流定时器 */
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  /** P1-1: 待持久化标记（有未写入的变更时 true） */
  private dirty = false;
  /** P1-1: 上次持久化的时间戳（用于指数衰减估算） */
  private lastPersistTime: number | null = null;

  constructor() {
    this.load();
  }

  /**
   * 记录一次路由跳转。
   *
   * @param from - 来源应用名
   * @param to - 目标应用名
   */
  recordTransition(from: string, to: string): void {
    if (!from || !to || from === to) return;

    const key = `${from}→${to}`;

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

    // 标记为已见（用于持久化逻辑）
    if (!this.seenKeys.has(key)) {
      this.seenKeys.add(key);
    }

    // P1-1: 节流持久化 — 标记 dirty 并设置延迟写入定时器
    this.dirty = true;
    this.schedulePersist();
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
      const fbN = fallbackTopN === undefined ? topN : (fallbackTopN > 0 ? fallbackTopN : 0);
      if (fbN > 0) {
        return this.getGlobalTopApps(fbN, currentApp);
      }
      return [];
    }

    const total = this.totals.get(currentApp) || 0;
    if (total === 0) {
      // totals 为 0 但有 transitions 的异常情况，也走 fallback
      const fbN = fallbackTopN === undefined ? topN : (fallbackTopN > 0 ? fallbackTopN : 0);
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
    return Array.from(this.transitions.keys());
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
   * 清除所有预测数据。
   */
  clear(): void {
    this.transitions.clear();
    this.totals.clear();
    this.seenKeys.clear();
    this.dirty = false;
    // P1-1: 清理节流定时器
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 静默
    }
  }

  /**
   * 获取数据摘要（用于 DevTools 面板展示）。
   */
  getSummary(): {
    totalTransitions: number;
    uniquePairs: number;
    topPairs: Array<{ from: string; to: string; count: number }>;
  } {
    const allPairs: Array<{ from: string; to: string; count: number }> = [];
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

  // ==================== 持久化 ====================

  /**
   * P1-1: 保存到 localStorage（含指数衰减 + 条目上限淘汰）。
   *
   * 节流后的批量写入，包含：
   * 1. 指数衰减：按记录年龄衰减计数（半衰期 3 天）
   * 2. 条目上限：超 MAX_TRANSITION_ENTRIES 时淘汰总计数最低的转移对
   *
   * @param force - 是否跳过 dirty 检查强制写入（HMR _stop 使用）
   */
  save(force = false): void {
    if (!force && !this.dirty) return;
    try {
      const now = Date.now();
      const allPairs: Array<{ from: string; to: string; count: number; timestamp: number }> = [];

      // 1. 收集所有转移对并应用指数衰减
      for (const [from, toMap] of this.transitions) {
        for (const [to, count] of toMap) {
          // 指数衰减：(1/2)^(age/halflife)
          const age = now - (this.lastPersistTime ?? now);
          const decayFactor = Math.pow(0.5, age / DECAY_HALFLIFE_MS);
          const decayedCount = count * decayFactor;
          if (decayedCount > 0.01) {
            allPairs.push({ from, to, count: decayedCount, timestamp: now });
          }
        }
      }

      // 2. 按衰减后计数降序排序，截断到上限
      if (allPairs.length > MAX_TRANSITION_ENTRIES) {
        allPairs.sort((a, b) => b.count - a.count);
        const evicted = allPairs.length - MAX_TRANSITION_ENTRIES;
        allPairs.length = MAX_TRANSITION_ENTRIES;
        logger.debug(`RoutePredictor: evicted ${evicted} low-count pairs (limit=${MAX_TRANSITION_ENTRIES})`);
      }

      // 3. 构建持久化格式（衰减后计数四舍五入为整数）
      const data: PersistedData = {
        version: 1,
        transitions: allPairs.map((p) => ({
          from: p.from,
          to: p.to,
          count: Math.max(1, Math.round(p.count)),
          timestamp: p.timestamp,
        })),
        lastUpdated: now,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.lastPersistTime = now;
    } catch {
      // 存储失败静默（隐私模式/localStorage满等）
    }
  }

  /** 从 localStorage 加载 */
  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as PersistedData;
      if (data.version !== 1) return;
      if (Date.now() - data.lastUpdated > MAX_RETENTION_MS) {
        // 数据过期，清除
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      for (const record of data.transitions) {
        if (!record.from || !record.to || record.from === record.to) continue;

        let toMap = this.transitions.get(record.from);
        if (!toMap) {
          toMap = new Map();
          this.transitions.set(record.from, toMap);
        }

        // 合并取最大值（避免与内存中已有数据重复累加）
        const existingCount = toMap.get(record.to) || 0;
        toMap.set(record.to, Math.max(existingCount, record.count));

        const existingTotal = this.totals.get(record.from) || 0;
        this.totals.set(record.from, Math.max(existingTotal, record.count));

        this.seenKeys.add(`${record.from}→${record.to}`);
      }

      this.lastPersistTime = data.lastUpdated;
      logger.debug(`Loaded ${data.transitions.length} historical transitions`);
    } catch {
      // 加载失败静默
    }
  }
}

/** 全局单例 */
let instance: RoutePredictor | null = null;

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
