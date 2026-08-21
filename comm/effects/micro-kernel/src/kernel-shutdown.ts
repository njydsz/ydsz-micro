/**
 * 内核关闭逻辑 — _stop() 方法体
 *
 * 从 kernel.ts 提取的内核停止/清理流程，用于 HMR / 测试环境重启。
 *
 * 清理内容：
 * - 路由监听与 history 补丁
 * - 卸载全部子应用
 * - 重置闭包级状态
 * - 释放全部管理器
 * - 清理 loader 模块级缓存
 * - 恢复全新调度器上下文
 *
 * @path comm/effects/micro-kernel/src/kernel-shutdown.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { ManagerRegistry } from "./manager-registry";
import type { GlobalStateAPI } from "./global-state";
import type { LifecycleHookRegistry } from "./lifecycle-hooks";

import { createLogger } from "@YDSZ-core/shared/utils";

import {
  createCanaryManager,
  createDevToolsManager,
  createErrorBoundaryManager,
  createHealthCheckerManager,
  createMessageBrokerManager,
  createPerformanceManager,
  createPreloadManager,
  createRoutePredictorManager,
  createSchedulerManager,
  createSpeculationRulesManager,
  createVersionManager,
} from "./kernel-managers";
import { clearManifestCache } from "./loader";
import { bindSchedulerContext, createSchedulerContext, deactivateApp, getAllInstances } from "./scheduler";

/** 模块级日志器 */
const logger = createLogger("MicroKernel:Shutdown");

/**
 * 关闭所需的状态访问器与依赖。
 */
export interface ShutdownContext {
  /** 获取路由同步清理函数 */
  getRouterSyncCleanup: () => (() => void) | null;
  /** 设置路由同步清理函数 */
  setRouterSyncCleanup: (cleanup: (() => void) | null) => void;
  /** 获取可见性清理函数 */
  getVisibilityCleanup: () => (() => void) | null;
  /** 设置可见性清理函数 */
  setVisibilityCleanup: (cleanup: (() => void) | null) => void;
  /** 获取当前 AbortController */
  getAbortController: () => AbortController | null;
  /** 设置当前 AbortController */
  setAbortController: (controller: AbortController | null) => void;
  /** 重置活跃应用名 */
  resetActiveAppName: () => void;
  /** 重置切换令牌 */
  resetSwitchToken: () => void;
  /** 全局状态 API */
  globalStateAPI: GlobalStateAPI;
  /** 生命周期钩子注册表 */
  lifecycleHooks: LifecycleHookRegistry;
  /** 重置应用列表 */
  resetApps: () => void;
  /** 重置 started 状态 */
  resetStarted: () => void;
  /** 管理器注册表 */
  registry: ManagerRegistry;
}

/**
 * 创建内核 _stop() 方法体。
 *
 * 清理所有注册，用于 HMR / 测试环境重启。
 *
 * @param ctx - 关闭上下文
 * @returns _stop 函数
 */
export function createStopFunction(ctx: ShutdownContext) {
  return async function _stop(): Promise<void> {
    ctx.getRouterSyncCleanup?.();
    ctx.setRouterSyncCleanup(null);
    ctx.getVisibilityCleanup?.();
    ctx.setVisibilityCleanup(null);

    // v4.2.1 P0-N2: 中止未完成的切换异步链路
    ctx.getAbortController?.().abort();
    ctx.setAbortController(null);

    for (const instance of getAllInstances()) {
      if (instance.status === "MOUNTED") {
        await deactivateApp(instance);
      }
    }

    // === P0-A2: 重置闭包级状态 ===
    ctx.resetActiveAppName();
    ctx.resetSwitchToken();
    ctx.globalStateAPI.reset();
    ctx.lifecycleHooks.clear();
    ctx.resetApps();
    ctx.resetStarted();

    // === P0-A1 (v4.1): 注册全部管理器到 ManagerRegistry 后统一释放 ===
    ctx.registry.register(createSchedulerManager());
    ctx.registry.register(createVersionManager());
    ctx.registry.register(createPreloadManager());
    ctx.registry.register(createCanaryManager());
    ctx.registry.register(createRoutePredictorManager());
    ctx.registry.register(createMessageBrokerManager());
    ctx.registry.register(createPerformanceManager());
    ctx.registry.register(createSpeculationRulesManager());
    ctx.registry.register(createErrorBoundaryManager());
    ctx.registry.register(createDevToolsManager());
    ctx.registry.register(createHealthCheckerManager());

    await ctx.registry.disposeAll();

    // 清理 loader 模块级缓存（非单例管理器，独立清理）
    clearManifestCache();

    // v4.2.1 P0-N1: 恢复全新调度器上下文（释放本内核持有的实例集）
    bindSchedulerContext(createSchedulerContext());

    logger.info("Stopped");
  };
}
