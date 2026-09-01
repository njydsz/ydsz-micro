/**
 * 自研轻内核 — 实现 MicroRuntime 接口（v4.x ESM 原生运行时）
 *
 * 适合同一团队、统一构建链的同源子应用集群。能力覆盖：
 *   ESM loader → 生命周期 → 快照沙箱 → keep-alive → 错误降级 → 路由同步 → 全局通信 → 灰度分流。
 *
 * v4 演进要点：
 * - 4.0: 闭包状态隔离（P0-A2）、ManagerRegistry、统一错误码（KernelErrorCode）
 * - 4.1: DisposableManager 生命周期、各管理器独立工厂
 * - 4.2: 调度器拆分（lifecycle / app-state / task-queue）、健康检查
 * - 4.3: 静态注册表依赖反转、document 监听代理（泄漏修复）
 * - 4.4: SRI 完整性校验、严格验签、FOUC 修复
 *
 * 使用方式：
 *   registerKernel('micro-kernel', () => createKernel());
 *   createRuntime({ kernel: 'micro-kernel' });
 *
 * @path comm\effects\micro-kernel\src\kernel.ts
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
import type { Manifest } from "./loader";
import type { KeepAliveConfig } from "./scheduler";

import { createLogger } from "@YDSZ-core/shared/utils";

import { createGlobalStateAPI } from "./global-state";
import { clearRegistryCache, getStaticRegistry, resolveAppEntry, resolveRegistry } from "./registry-adapter";
import {
  createSwitchToApp,
  type LifecycleDependencies,
  type LifecycleStateAccessors,
} from "./kernel-lifecycle";
import { createStartRouterSync as createStartRouterSyncFn } from "./kernel-router";
import { KernelError, KernelErrorCode } from "./error-boundary";
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
  let metricsCleanup: (() => void) | null = null;
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
    setMetricsCleanup: (c) => { metricsCleanup = c; },
    preloadManager,
    startRouterSync,
  };
  const shutdownCtx: ShutdownContext = {
    getRouterSyncCleanup: () => routerSyncCleanup,
    setRouterSyncCleanup: (c) => { routerSyncCleanup = c; },
    getVisibilityCleanup: () => visibilityCleanup,
    setVisibilityCleanup: (c) => { visibilityCleanup = c; },
    getMetricsCleanup: () => metricsCleanup,
    setMetricsCleanup: (c) => { metricsCleanup = c; },
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
    checkVersionUpdate: (name: string, manifest: unknown) => {
      // 调用方契约：manifest 为 loader 产出的 Manifest（activateApp 加载链路注入）
      void versionManager.checkUpdate(name, manifest as Manifest);
    },
  };

  const startFn = createStartFunction(startupCtx);
  const stopFn = createStopFunction(shutdownCtx);
  const { healthCheck, healthCheckAsync } = createHealthCheckFunctions(healthCtx);
  const { registerAppsInternal, addAppInternal } = createRegistryFunctions(registryCtx);
  const { updateApp, updateAllApps, prefetchApp } = createPropsFunctions(propsCtx);

  // ==================== 内核 API ====================

  const kernelApi = {
    /** 批量注册子应用配置（覆盖式，卸载已存在实例） */
    registerApps(newApps: MicroAppConfig[]) { registerAppsInternal(newApps); },
    /** 增量追加单个子应用配置（重复 name 忽略），返回是否实际新增 */
    addApp(app: MicroAppConfig): boolean { return addAppInternal(app); },
    /** 获取全部已注册子应用当前快照（仅配置，不含运行时状态） */
    getRegisteredApps() { return getAllInstances().map((i) => i.config); },

    /**
     * 异步加载注册表并注册（远程 / 静态 / 自定义 fetcher）。
     *
     * @param reg - adapter 与可选 fetcher
     * @returns 解析后的 MicroAppConfig 数组
     */
    async registerAppsAsync(reg: {
      adapter: "auto" | "remote" | "static";
      fetcher?: () => Promise<MicroAppEntry[]>;
    }): Promise<MicroAppConfig[]> {
      let entries: MicroAppEntry[];
      if (reg.fetcher) {
        entries = await reg.fetcher();
      } else if (reg.adapter === "static") {
        // v4.3.0: 静态注册表由宿主注入（setStaticRegistry），内核不再依赖构建配置包
        entries = getStaticRegistry();
        if (entries.length === 0) {
          throw new KernelError(
            KernelErrorCode.REGISTRY_STATIC_EMPTY,
            "Static registry is empty — host must call setStaticRegistry(MICRO_APPS) or provide a fetcher",
          );
        }
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

    /** 启动内核（注册路由监听、预热等）。重复调用忽略。 */
    start(options?: StartOptions) {
      if (started) { logger.warn("Already started"); return; }
      started = true;
      startFn(options);
    },

    /** 预取子应用资源（link-hints + manifest），不执行 mount */
    prefetchApp(name: string) { return prefetchApp(name); },

    /**
     * 卸载指定子应用（运行 afterUnmount 钩子 → 清理沙箱 → 移除样式）。
     *
     * @returns 卸载结果（成功 / 失败原因）
     */
    async unmountApp(name: string) {
      const instance = getAppInstance(name);
      if (!instance) return { name, success: false, reason: "App not registered" };
      await lifecycleHooks.run("afterUnmount", instance.config);
      const result = await deactivateApp(instance);
      if (activeAppName === name) activeAppName = null;
      return result;
    },

    /** 更新单个子应用 props（仅运行中实例生效） */
    updateApp(name: string, newProps: Record<string, unknown>) {
      return updateApp(name, newProps);
    },
    /** 批量更新全部子应用 props */
    updateAllApps(newProps: Record<string, unknown>) {
      return updateAllApps(newProps);
    },

    // ==================== keep-alive 配置 ====================

    /** 全局启用 / 禁用 keep-alive（单实例级 setKeepAlive 优先） */
    setKeepAliveEnabled(enabled: boolean) { configureKeepAliveAction({ enabled }); },
    /** 设置单个应用是否保活（覆盖全局策略） */
    setKeepAlive(name: string, keep: boolean) { setKeepAliveAction(name, keep); },
    /** 固定应用不被 LRU 淘汰（即使超出 maxKeepAliveApps） */
    setPinnedApp(name: string, pin: boolean) { setPinnedApp(name, pin); },
    /** 批量配置 keep-alive（maxKeepAliveApps / TTL 等） */
    configureKeepAlive(cfg: KeepAliveConfig) { configureKeepAliveAction(cfg); },
    /** 获取当前 keep-alive 配置（激活态 + max 数 + TTL 等） */
    getKeepAliveConfig() { return getKeepAliveConfig(); },
    /** 查询全局 keep-alive 是否已启用 */
    isKeepAliveEnabled() { return isKeepAliveEnabled(); },

    // ==================== 路由 / 工具 ====================

    /** 通过 pushState 编程式跳转（不触发页面 reload） */
    navigateTo(path: string) { window.history.pushState(null, "", path); },
    /** 注册生命周期钩子（beforeMount / afterMount / beforeUnmount / afterUnmount） */
    addLifecycleHook: lifecycleHooks.add,
    /** 获取当前激活的应用名（无激活返回 null） */
    getActiveAppName() { return activeAppName; },

    // ==================== 跨应用通信 ====================

    /**
     * 单向投递消息到指定子应用（fire-and-forget）。
     *
     * @returns correlationId（用于日志追踪）
     */
    sendToApp(appName: string, action: string, payload?: unknown): string {
      return messagingApi.sendToApp(appName, action, payload);
    },
    /**
     * 请求-响应式跨应用通信（等待目标应用返回）。
     *
     * @param timeout - 超时毫秒，默认 5000
     * @returns 目标应用响应数据
     */
    sendRequestToApp<T = unknown, R = unknown>(
      appName: string, action: string, payload?: T, timeout?: number,
    ): Promise<R> {
      return messagingApi.sendRequestToApp<T, R>(appName, action, payload, timeout);
    },
    /**
     * 订阅来自子应用上行的消息。
     *
     * @returns 取消订阅函数
     */
    onAppMessage(handler: (message: {
      action: string; correlationId: string; from: string; payload: unknown;
    }) => void): () => void {
      return messagingApi.onAppMessage(handler);
    },

    // ==================== 生命周期管理 ====================

    /** 关闭内核：取消路由监听、卸载全部子应用、重置调度器与 loader 状态（HMR/测试用） */
    async _stop() { await stopFn(); },

    // ==================== 调试 / 监控 ====================

    /** 获取所有运行中实例（含沙箱、状态、时间戳） */
    getAllInstances() { return getAllInstances(); },
    /** 按应用名获取运行实例（未注册返回 null） */
    getAppInstance(name: string) { return getAppInstance(name); },
    /** 同步健康检查（基于最近一次 ping 结果） */
    healthCheck() { return healthCheck(); },
    /** 异步健康检查（强制 ping / 跳过 ping 选项） */
    healthCheckAsync(options?: { force?: boolean; skipPing?: boolean }) {
      return healthCheckAsync(options);
    },
    /** 清空注册表缓存，迫使下次访问重新拉取 */
    refreshRegistry() {
      clearRegistryCache();
      logger.info("Registry cache cleared, will re-fetch on next access");
    },
  };

  // v4.3.0: 调试口收敛 — dev 暴露完整内核 API（HMR/调试/DevTools 扩展），
  // 生产环境仅暴露只读快照（安全 getter 集合），避免任意页面脚本直接操控内核。
  try {
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__MICRO_KERNEL__ = kernelApi;
    } else {
      (window as unknown as Record<string, unknown>).__MICRO_KERNEL__ = Object.freeze({
        getRegisteredApps: kernelApi.getRegisteredApps,
        getActiveAppName: kernelApi.getActiveAppName,
        getKeepAliveConfig: kernelApi.getKeepAliveConfig,
        isKeepAliveEnabled: kernelApi.isKeepAliveEnabled,
        healthCheck: kernelApi.healthCheck,
      });
    }
  } catch { /* SSR 静默 */ }

  return kernelApi;
}
