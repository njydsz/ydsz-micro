/**
 * 路由预测引擎类型定义与常量
 *
 * 从 route-predictor.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/route-predictor-types.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { STORAGE_KEYS } from "./storage-utils";

/** localStorage key (P0-4: 使用统一命名空间) */
export const STORAGE_KEY = STORAGE_KEYS.ROUTE_PREDICTIONS;

/** 最大保留的转移记录时间窗口（7 天） */
export const MAX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * P1-1: 持久化节流间隔（毫秒）。
 *
 * 路由跳转可能高频触发（如快速切换 Tab），每次写入 localStorage 性能开销大。
 * 延迟 5s 批量写入，期间多次 recordTransition 仅更新内存状态，
 * 最后一次 flush 时序列化整个转移矩阵。
 */
export const PERSIST_THROTTLE_MS = 5000;

/**
 * P1-1: 最大转移条目数（from→to 对）。
 *
 * 超过上限时淘汰总计数最低的转移对，防止 Map 无限膨胀导致：
 * 1. 内存占用持续增长
 * 2. localStorage 序列化/反序列化耗时增加
 * 3. 过时行为模式权重过高
 */
export const MAX_TRANSITION_ENTRIES = 500;

/**
 * P1-1: 指数衰减半衰期（毫秒）。
 *
 * 记录在 persist 时按 (1/2)^(age/halflife) 衰减计数，
 * 使近期导航模式权重高于历史模式，适应用户行为变化。
 * 默认 3 天：3 天前的记录权重降为 50%，6 天前 25%，以此类推。
 */
export const DECAY_HALFLIFE_MS = 3 * 24 * 60 * 60 * 1000;

/** 转移记录 */
export interface TransitionRecord {
  /** 来源应用名 */
  from: string;
  /** 目标应用名 */
  to: string;
  /** 时间戳 (ms) — 该转移对的最近发生时间 */
  timestamp: number;
  /** 转移次数（聚合后） */
  count: number;
}

/** 持久化数据结构 */
export interface PersistedData {
  /** 格式版本，用于未来数据迁移 */
  version: 2;
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
