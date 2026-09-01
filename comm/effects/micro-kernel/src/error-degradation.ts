/**
 * 降级与重试状态管理
 *
 * 从 error-boundary.ts 拆出（仅移动，无行为变更）：
 * 本次会话的子应用降级标记（Set）与重试计数器（Map）为模块级单例状态，
 * 连同全部状态读写函数与三级降级决策函数整体迁移，不复制副本。
 *
 * createErrorBoundaryManager 的 dispose 直接清空上述单例状态，
 * 故随状态一起移入本模块（error-boundary.ts re-export 保持兼容）。
 *
 * @path comm/effects/micro-kernel/src/error-degradation.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { DisposableManager } from "./manager-registry";

import { createLogger } from "@YDSZ-core/shared/utils";

/** 模块级日志器 */
const logger = createLogger("MicroKernel");

/** 本次会话应用降级 set（key = app.name，该应用不再尝试微前端加载，走整页跳转） */
const degradedApps = new Set<string>();

/** 将指定子应用标记为本次会话降级，后续不再尝试微前端加载，直接整页跳转 */
export function markDegraded(appName: string): void {
  degradedApps.add(appName);
  logger.warn(`${appName} degraded to full-page navigation`);
}

/** 判断指定子应用是否已被标记为本会话降级状态 */
export function isDegraded(appName: string): boolean {
  return degradedApps.has(appName);
}

/** 清除指定子应用的降级标记（微前端级重试成功路径使用） */
export function unmarkDegraded(appName: string): void {
  degradedApps.delete(appName);
}

/** 清空本次会话的全部子应用降级标记 */
export function clearDegraded(): void {
  degradedApps.clear();
}

/** 每个应用的微前端重试计数器（达到上限后回退整页跳转） */
const retryCounters = new Map<string, number>();
/** 用户可见的 micro 重试上限：-1 表示不自动重试（直接走占位 UI） */
export const MAX_MICRO_RETRIES = 3;
/** 静默自动重试上限：首次失败后静默重试 N 次（不展示 UI，应对 CDN 偶发抖动） */
const MAX_AUTO_RETRIES = 1;

/** 重置指定应用的重试计数 */
export function resetRetryCount(appName: string): void {
  retryCounters.delete(appName);
}

/** v3.7.0: 读取应用重试计数（内部用） */
export function getRetryCount(appName: string): number {
  return retryCounters.get(appName) ?? 0;
}

/** v3.7.0: 设置应用重试计数 */
export function setRetryCount(appName: string, count: number): void {
  retryCounters.set(appName, count);
}

/**
 * P0-A1: 创建 error-boundary 生命周期管理器。
 *
 * 清空降级集合 + 重试计数器。
 *
 * @since 4.1.0
 */
export function createErrorBoundaryManager(): DisposableManager {
  return {
    name: "error-boundary",
    dispose(): void {
      degradedApps.clear();
      retryCounters.clear();
    },
  };
}

/**
 * 获取自动重试退避延迟（ms）。
 *
 * 第 n 次退避：baseDelay * 2^n + jitter，用于 CDN 偶发故障恢复。
 */
function getAutoRetryDelay(attempt: number): number {
  const base = 500;
  const jitter = Math.random() * 200;
  return base * 2 ** attempt + jitter;
}

/**
 * 三级降级决策：自动静默重试 → 占位 UI（允许手动重试）→ 整页跳转
 *
 * - attempt < MAX_AUTO_RETRIES → 静默自动重试（不展示 UI）
 * - MAX_AUTO_RETRIES <= attempt < MAX_MICRO_RETRIES → 展示占位 UI 允许手动重试
 * - attempt >= MAX_MICRO_RETRIES → 标记降级 + 整页跳转
 *
 * @param appName - 应用名
 * @returns 'auto-retry' | 'show-ui' | 'full-page'
 */
export function decideDegradationLevel(
  appName: string,
): "auto-retry" | "full-page" | "show-ui" {
  const count = retryCounters.get(appName) ?? 0;
  if (count < MAX_AUTO_RETRIES) return "auto-retry";
  if (count < MAX_MICRO_RETRIES) return "show-ui";
  return "full-page";
}

/** 获取下次自动重试延迟（仅 auto-retry 级别有意义） */
export function getNextAutoRetryDelay(appName: string): number {
  const count = retryCounters.get(appName) ?? 0;
  return getAutoRetryDelay(count);
}
