/**
 * 应用使用统计存储
 *
 * 管理应用访问频率统计的加载、保存与查询，
 * 供 PreloadManager 的频率策略使用。
 *
 * 从 preload-strategy.ts 提取，保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/preload-usage-stats.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { AppUsageStats } from "./preload-types";

/** 统计数据 localStorage key */
const STORAGE_KEY = "ydsz_app_usage_stats";

/**
 * 使用统计存储管理器。
 *
 * 封装了 usageStats Map 与 localStorage 之间的持久化逻辑。
 */
export class UsageStatsStore {
  private usageStats: Map<string, AppUsageStats> = new Map();
  private storageKey = STORAGE_KEY;

  constructor() {
    this.load();
  }

  /**
   * 获取所有使用统计 Map（只读引用）。
   */
  get stats(): Map<string, AppUsageStats> {
    return this.usageStats;
  }

  /**
   * 记录应用访问（用于频率统计）
   *
   * @param appName - 应用名称
   */
  recordVisit(appName: string): void {
    const now = Date.now();
    const stats = this.usageStats.get(appName);

    if (stats) {
      const interval = now - stats.lastVisitTime;
      stats.visitCount++;
      stats.lastVisitTime = now;
      // 更新平均间隔（加权平均）
      stats.averageInterval =
        (stats.averageInterval * (stats.visitCount - 1) + interval) /
        stats.visitCount;
    } else {
      this.usageStats.set(appName, {
        appName,
        visitCount: 1,
        lastVisitTime: now,
        averageInterval: 0,
      });
    }

    this.save();
  }

  /**
   * 获取应用使用统计
   *
   * @param appName - 应用名称
   * @returns 应用使用统计，未记录时返回 null
   */
  getStats(appName: string): AppUsageStats | null {
    return this.usageStats.get(appName) || null;
  }

  /**
   * 根据使用频率排序应用
   *
   * @returns 按访问频率降序排列的应用名称数组
   */
  getByFrequency(): string[] {
    return Array.from(this.usageStats.entries())
      .sort((a, b) => b[1].visitCount - a[1].visitCount)
      .map(([appName]) => appName);
  }

  /**
   * 获取所有应用使用统计（供 DevTools 面板可视化）。
   *
   * @returns 按访问频率降序排列的应用统计数组
   * @since 4.1.0
   */
  getAll(): AppUsageStats[] {
    return Array.from(this.usageStats.values()).sort(
      (a, b) => b.visitCount - a.visitCount,
    );
  }

  /**
   * 清空所有统计。
   */
  clear(): void {
    this.usageStats.clear();
  }

  /**
   * 保存使用统计到本地存储
   */
  save(): void {
    try {
      const data = Object.fromEntries(this.usageStats);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // 存储失败静默处理
    }
  }

  /**
   * 从本地存储加载使用统计
   */
  private load(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.usageStats = new Map(Object.entries(parsed));
      }
    } catch {
      // 加载失败静默处理
    }
  }
}
