/**
 * 生命周期调度器（微内核入口模块）
 *
 * v4.2.2 模块拆分说明：
 * - lifecycle.ts   — 核心调度逻辑（activateApp / deactivateApp / updateAppProps）
 * - app-state.ts   — 状态类型、实例管理、保活配置
 * - task-queue.ts  — LRU 淘汰、内存压力释放、visibility auto release
 *
 * 本模块为向后兼容的统一入口，所有导出均可从本模块直接导入。
 * 新功能建议直接引用子模块。
 *
 * @path comm\effects\micro-kernel\src\scheduler.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { SandboxType } from "@ydsz/micro-runtime";
import type { DisposableManager } from "./manager-registry";

import type {
  AppInstance,
  AppStatus,
  DeactivateResult,
  GlobalStateBridge,
  KeepAliveConfig,
  SchedulerContext,
} from "./app-state";

import {
  bindSchedulerContext,
  configureKeepAlive,
  createAppInstance,
  createSchedulerContext,
  getContext,
  getAllInstances,
  getAppInstance,
  getKeepAliveConfig,
  getKeepAliveCount,
  getKeepAliveTTL,
  isKeepAliveEnabled,
  resetKeepAliveEnabled,
  resetScheduler,
  setKeepAlive,
  setKeepAliveTTL,
  setMaxKeepAliveApps,
  setPinnedApp,
  setStyleIsolation,
} from "./app-state";

import {
  activateApp,
  deactivateApp,
  updateAppProps,
} from "./lifecycle";

import {
  evictAllKeepAliveOnMemoryPressure,
  setupVisibilityAutoRelease,
} from "./task-queue";

// ==================== 类型重导出 ====================

export type { SandboxType };
export type {
  AppInstance,
  AppStatus,
  DeactivateResult,
  GlobalStateBridge,
  KeepAliveConfig,
  SchedulerContext,
};

// ==================== app-state.ts 函数导出 ====================

export {
  bindSchedulerContext,
  configureKeepAlive,
  createAppInstance,
  createSchedulerContext,
  getAllInstances,
  getAppInstance,
  getKeepAliveConfig,
  getKeepAliveCount,
  getKeepAliveTTL,
  isKeepAliveEnabled,
  resetKeepAliveEnabled,
  resetScheduler,
  setKeepAlive,
  setKeepAliveTTL,
  setMaxKeepAliveApps,
  setPinnedApp,
  setStyleIsolation,
};

// ==================== lifecycle.ts 函数导出 ====================

export { activateApp, deactivateApp, updateAppProps };

// ==================== task-queue.ts 函数导出 ====================

export {
  evictAllKeepAliveOnMemoryPressure,
  setupVisibilityAutoRelease,
};

// ==================== 本模块独有导出 ====================

/**
 * P0-A1: 为 ManagerRegistry 提供的 DisposableManager 包装。
 *
 * dispose 时恢复为全新默认上下文（释放当前上下文持有的全部实例）。
 *
 * @since 4.0.1
 */
export function createSchedulerManager(): DisposableManager {
  return {
    name: "scheduler",
    dispose(): void {
      // 释放当前上下文持有的实例集，并恢复全新默认上下文
      const ctx = getContext();
      ctx.appInstances.clear();
      bindSchedulerContext(createSchedulerContext());
    },
  };
}
