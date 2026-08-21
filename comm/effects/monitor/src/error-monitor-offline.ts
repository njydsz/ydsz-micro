/**
 * 错误监控 — 离线缓存
 *
 * 从 error-monitor.ts 提取，避免单文件超过 300 行。
 *
 * 网络不可达时将错误暂存到 localStorage，待网络恢复后自动重放。
 *
 * @path comm/effects/monitor/src/error-monitor-offline.ts
 * @author ydsz-team
 * @since 3.4.0
 */

import type { ErrorReport } from './error-monitor-types';

/** 离线缓存键名 */
const OFFLINE_CACHE_KEY = 'ydsz_monitor_offline_queue';

/** 离线缓存最大条数 */
const MAX_OFFLINE_CACHE = 100;

/**
 * 缓存错误到本地存储（离线场景）
 */
export function cacheForOffline(batch: ErrorReport[]): void {
  try {
    const cached = loadOfflineCache();
    const merged = [...cached, ...batch].slice(-MAX_OFFLINE_CACHE);
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // 存储失败静默
  }
}

/**
 * 加载离线缓存的错误
 */
export function loadOfflineCache(): ErrorReport[] {
  try {
    const data = localStorage.getItem(OFFLINE_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 清空离线缓存
 */
export function clearOfflineCache(): void {
  try {
    localStorage.removeItem(OFFLINE_CACHE_KEY);
  } catch {
    // 静默
  }
}

/**
 * 恢复离线缓存的错误（网络恢复时调用）
 */
export function restoreOfflineCache(
  sendBatch: (batch: ErrorReport[], retryCount: number) => void,
): void {
  const cached = loadOfflineCache();
  if (cached.length > 0) {
    clearOfflineCache();
    sendBatch(cached, 0);
  }
}
