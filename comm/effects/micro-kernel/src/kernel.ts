/**
 * 自研轻内核 — 实现 MicroRuntime 接口
 *
 * ESM 原生微前端运行时：适合同一团队、统一构建链的同源子应用集群。
 * 能力覆盖：
 *   ESM loader → 生命周期 → 快照沙箱 → keep-alive → 错误降级 → 路由同步 → 全局通信。
 *
 * P0-A2 修复：全部可变状态（_globalState / lifecycleHooks / activeAppName /
 * switchToken）收进 createKernel 闭包，避免多实例 / HMR 场景下状态串扰。
 *
 * 使用方式：
 *   registerKernel('micro-kernel', () => createKernel());
 *   createRuntime({ kernel: 'micro-kernel' });
 *
 * @path comm/effects/micro-kernel/src/kernel.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type {
  MicroAppConfig,
  MicroAppEntry,
  MicroRuntime,
  StartOptions,
} from "@ydsz/micro-runtime";

import type { ManagerRegistry } from "./manager-registry";
import type { KeepAliveConfig } from "./scheduler";

import { createLogger } from "@YDSZ-core/shared/utils";

import { createGlobalStateAPI } from "./global-state";
import { clearRegistryCache, resolveAppEntry, resolveRegistry } from "./registry-adapter";
import {
  createSwitchToApp,
  createStartRouterSync as createStartRouterSyncFn,
  type LifecycleDependencies,
  type LifecycleStateAccessors,
} from "./kernel-lifecycle";
import {
  createKernelMessagingAPI,
  type KernelMessagingAPI,
} from "./kernel-events";
import { createHealthCheckFunctions, type HealthCheckContext } from "./kernel-health";
import { createStartFunction, type StartupContext } from "./kernel-startup";
import { createStopFunction, type ShutdownContext } from "./kernel-shutdown";
import { createRegistryFunctions, type RegistryContext } from "./kernel-registry";
import { createPropsFunctions, type PropsContext } from "./kernel-props";
import { createLifecycleHookRegistry } from "./lifecycle-hooks";
import { createManagerRegistry } from "./manager-registry";
import { getPreloadManager } from "./preload-strategy";
import {
  bindSchedulerContext,
  configureKeepAlive as configureKeepAliveAction,
  createSchedulerContext,
  deactivateApp,
  getAllInstances,
  getAppInstance,
  getKeepAliveConfig,
  isKeepAliveEnabled,
  setKeepAlive as setKeepAliveAction,
  setPinnedApp,
} from "./scheduler";
import { getVersionManager } from "./version-manager";

/** 模块级日志器 */
const logger = createLogger("MicroKernel");

/**
 * 创建轻内核运行时实例。
 *
 * P0-A2: 全部可变状态收进此闭包，确保多次调用 `createKernel()` 时
 * 各实例拥有独立状态，互不串扰（HMR / 测试场景关键）。
 *
 * 返回的实例含内部 `_stop` 方法（非 MicroRuntime 接口暴露）：
 * - 清理路由监听与 history 补丁
 * - 卸载全部子应用
 * - 清空降级标记
 * - 重置 scheduler / loader 模块级状态
 * 用于基座 HMR / 测试环境正常重启。
 */
export function createKernel(): MicroRuntime & { _stop: () => Promise<void> } {
  let apps: MicroAppConfig[] = [];
  let started = false;
  let routerSyncCleanup: (() => void) | null = null;
  let visibilityCleanup: (() => void) | null = null;
  const versionManager = getVersionManager();
  const preloadManager = getPreloadManager();
  const registry: ManagerRegistry = createManagerRegistry();

  // === P0-N1 (v4.2.1): 绑定内核专属调度器上下文 ===
  bindSchedulerContext(createSchedulerContext());

  // ==================== P0-A2: 闭包级状态 ====================
  let activeAppName: null | string = null;
  let switchToken = 0;
  let switchAbortController: AbortController | null = null;

  // ==================== 全局通信 ====================
  const globalStateAPI = createGlobalStateAPI();
  const lifecycleHooks = createLifecycleHookRegistry();

  // ==================== 构建闭包状态访问器 ====================
  const lifecycleState: LifecycleStateAccessors = {
    getActiveAppName: () => activeAppName,
    setActiveAppName: (name: string | null) => { activeAppName = name; },
    incrementToken: () => ++switchToken,
    getToken: () => switchToken,
    getAbortController: () => switchAbortController,
    setAbortController: (c: AbortController | null) => { switchAbortController = c; },
  };

  const lifecycleDeps: LifecycleDependencies = {
    globalStateAPI,
    lifecycleHooks,
    recordAppVisit: (n: string) => preloadManager.recordAppVisit(n),
    recordPreloadConsumed: (n: string) => preloadManager.recordPreloadConsumed(n),
  };

  // ==================== 创建核心函数 ====================
  const switchToApp = createSwitchToApp(lifecycleState, lifecycleDeps);
  const startRouterSync = createStartRouterSyncFn(lifecycleState, switchToApp);
  const messagingApi: KernelMessagingAPI = createKernelMessagingAPI();

  // ==================== 创建启动/关闭/健康检查/注册/Props函数 ====================
  const startupCtx: StartupContext = {
    getApps: () => apps,
    setRouterSyncCleanup: (c) => { routerSyncCleanup = c; },
    setVisibilityCleanup: (c) => { visibilityCleanup = c; },
    preloadManager,
    startRouterSync,
  };
  const shutdownCtx: ShutdownContext = {
    getRouterSyncCleanup: () => routerSyncCleanup,
    setRouterSyncCleanup: (c) => { routerSyncCleanup = c; },
    getVisibilityCleanup: () => visibilityCleanup,
    setVisibilityCleanup: (c) => { visibilityCleanup = c; },
    getAbortController: () => switchAbortController,
    setAbortController: (c: AbortController | null) => { switchAbortController = c; },
    resetActiveAppName: () => { activeAppName = null; },
    resetSwitchToken: () => { switchToken = 0; },
    globalStateAPI,
    lifecycleHooks,
    resetApps: () => { apps = []; },
    resetStarted: () => { started = false; },
    registry,
  };
  const healthCtx: HealthCheckContext = {
    getRegisteredAppsCount: () => getAllInstances().length,
  };
  const registryCtx: RegistryContext = {
    getApps: () => apps,
    setApps: (a: MicroAppConfig[]) => { apps = a; },
    setAppEntries: (e) => versionManager.setAppEntries(e),
  };
  const propsCtx: PropsContext = {
    getApps: () => apps,
    checkVersionUpdate: (name: string, manifest: unknown) =>
      versionManager.checkUpdate(name, manifest),
  };

  const startFn = createStartFunction(startupCtx);
  const stopFn = createStopFunction(shutdownCtx);
  const { healthCheck, healthCheckAsync } = createHealthCheckFunctions(healthCtx);
  const { registerAppsInternal, addAppInternal } = createRegistryFunctions(registryCtx);
  const { updateApp, updateAllApps, prefetchApp } = createPropsFunctions(propsCtx);

  // ==================== 内核 API ====================

  const kernelApi = {
    registerApps(newApps: MicroAppConfig[]) { registerAppsInternal(newApps); },
    addApp(app: MicroAppConfig): boolean { return addAppInternal(app); },
    getRegisteredApps() { return getAllInstances().map((i) => i.config); },

    async registerAppsAsync(reg: {
      adapter: "auto" | "remote" | "static";
      fetcher?: () => Promise<MicroAppEntry[]>;
    }): Promise<MicroAppConfig[]> {
      let entries: MicroAppEntry[];
      if (reg.fetcher) {
        entries = await reg.fetcher();
      } else if (reg.adapter === "static") {
        const { MICRO_APPS } = await import("@ydsz/vite-config");
        entries = MICRO_APPS as MicroAppEntry[];
      } else {
        entries = await resolveRegistry(true);
      }
      const configs: MicroAppConfig[] = entries.map((entry) => ({
        name: entry.name,
        entry: resolveAppEntry(entry),
        container: "#subapp-container",
        activeRule: entry.activeRule,
        sandbox: entry.sandbox,
      }));
      registerAppsInternal(configs);
      return configs;
    },

    start(options?: StartOptions) {
      if (started) { logger.warn("Already started"); return; }
      started = true;
      startFn(options);
    },

    prefetchApp(name: string) { return prefetchApp(name); },

    async unmountApp(name: string) {
      const instance = getAppInstance(name);
      if (!instance) return { name, success: false, reason: "App not registered" };
      await lifecycleHooks.run("afterUnmount", instance.config);
      const result = await deactivateApp(instance);
      if (activeAppName === name) activeAppName = null;
      return result;
    },

    updateApp(name: string, newProps: Record<string, unknown>) {
      return updateApp(name, newProps);
    },
    updateAllApps(newProps: Record<string, unknown>) {
      return updateAllApps(newProps);
    },

    setKeepAliveEnabled(enabled: boolean) { configureKeepAliveAction({ enabled }); },
    setKeepAlive(name: string, keep: boolean) { setKeepAliveAction(name, keep); },
    setPinnedApp(name: string, pin: boolean) { setPinnedApp(name, pin); },
    configureKeepAlive(cfg: KeepAliveConfig) { configureKeepAliveAction(cfg); },
    getKeepAliveConfig() { return getKeepAliveConfig(); },
    isKeepAliveEnabled() { return isKeepAliveEnabled(); },

    navigateTo(path: string) { window.history.pushState(null, "", path); },
    addLifecycleHook: lifecycleHooks.add,
    getActiveAppName() { return activeAppName; },

    sendToApp(appName: string, action: string, payload?: unknown): string {
      return messagingApi.sendToApp(appName, action, payload);
    },
    sendRequestToApp<T = unknown, R = unknown>(
      appName: string, action: string, payload?: T, timeout?: number,
    ): Promise<R> {
      return messagingApi.sendRequestToApp<T, R>(appName, action, payload, timeout);
    },
    onAppMessage(handler: (message: {
      action: string; correlationId: string; from: string; payload: unknown;
    }) => void): () => void {
      return messagingApi.onAppMessage(handler);
    },

    async _stop() { await stopFn(); },

    getAllInstances() { return getAllInstances(); },
    getAppInstance(name: string) { return getAppInstance(name); },
    healthCheck() { return healthCheck(); },
    healthCheckAsync(options?: { force?: boolean; skipPing?: boolean }) {
      return healthCheckAsync(options);
    },
    refreshRegistry() {
      clearRegistryCache();
      logger.info("Registry cache cleared, will re-fetch on next access");
    },
  };

  try { (window as any).__MICRO_KERNEL__ = kernelApi; } catch { /* SSR 静默 */ }

  return kernelApi;
}
