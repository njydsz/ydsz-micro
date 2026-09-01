/**
 * 应用状态管理模块
 *
 * 定义子应用生命周期状态、实例结构、调度器上下文，
 * 并提供保活策略配置与实例管理 API。
 *
 * @path comm/effects/micro-kernel/src/app-state.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type {
  LifecycleExports,
  MicroAppConfig,
  SandboxType,
  UnmountResult,
} from "@ydsz/micro-runtime";
import type { Manifest } from "./loader";
import type { SandboxStrategy } from "./sandbox-strategy";
// ==================== 状态类型 ====================

/** 子应用生命周期状态：未加载 / 加载中 / 已加载 / 已挂载 / 已卸载 */
export type AppStatus =
  | "LOADED"
  | "LOADING"
  | "MOUNTED"
  | "NOT_LOADED"
  | "UNMOUNTED";

/** 沙箱类型 (re-export 自 micro-runtime) */
export type { SandboxType } from "@ydsz/micro-runtime";

/** 单个子应用运行时实例 */
export interface AppInstance {
  config: MicroAppConfig;
  status: AppStatus;
  exports: LifecycleExports | null;
  keepAlive: boolean;
  cachedRoot: HTMLElement | null;
  cachedParent: Node | null;
  /** v4.1 P0-A2: 统一沙箱策略 (替代 sandbox/proxySandbox/iframeSandbox) */
  strategy: null | SandboxStrategy;
  sandboxType: SandboxType;
  loadMetrics: null | { duration: number; fromCache: boolean };
  error: null | string;
  lastActivatedAt: number;
  /** v3.7.0: 保活缓存创建时间 (TTL 过期检测) */
  keepAliveSince: number;
  /** v3.7.0: pin 保护，LRU 淘汰时跳过 */
  pinned: boolean;
  /** v4.2.1 N6: keep-alive 停用的状态快照 */
  cachedState: unknown;
  /** v3.3: build 模式子应用 manifest (含 routes) */
  manifest: Manifest | null;
}

// ==================== SchedulerContext (P0-N1 v4.2.1) ====================

/** 调度器可变状态容器 — 多 Kernel / HMR 隔离 */
export interface SchedulerContext {
  appInstances: Map<string, AppInstance>;
  maxKeepAliveApps: number;
  keepAliveTTL: number; // ms, 0 = 禁用 TTL 保护
  keepAliveTimestamp: number;
  keepAliveEnabled: boolean;
  /** v4.2.1 N5: 全局 CSS 作用域兜底开关 */
  styleIsolationEnabled: boolean;
}

export function createSchedulerContext(): SchedulerContext {
  return {
    appInstances: new Map<string, AppInstance>(),
    maxKeepAliveApps: 5,
    keepAliveTTL: 30 * 60 * 1000,
    keepAliveTimestamp: 1,
    keepAliveEnabled: true,
    styleIsolationEnabled: false,
  };
}

let currentContext: SchedulerContext = createSchedulerContext();

/** 绑定调度器上下文 (由 createKernel 调用)，返回上一个上下文 */
export function bindSchedulerContext(ctx: SchedulerContext): SchedulerContext {
  const prev = currentContext;
  currentContext = ctx;
  return prev;
}

export function getContext(): SchedulerContext {
  return currentContext;
}

// ==================== KeepAlive 配置 (P3-2 v4.0) ====================

export interface KeepAliveConfig {
  enabled?: boolean; // 默认 true
  max?: number; // 默认 5, 0 = 禁用 LRU
  ttl?: number; // ms, 默认 30 分钟, 0 = 禁用 TTL
}

/**
 * 统一配置 KeepAlive 策略，未传字段保持当前值。
 * @example configureKeepAlive({ max: 8, ttl: 10 * 60 * 1000 })
 */
export function configureKeepAlive(config: KeepAliveConfig): void {
  const ctx = getContext();
  if (typeof config.enabled === "boolean") ctx.keepAliveEnabled = config.enabled;
  if (typeof config.max === "number") ctx.maxKeepAliveApps = Math.max(0, config.max);
  if (typeof config.ttl === "number") ctx.keepAliveTTL = Math.max(0, config.ttl);
}

/** 获取当前 KeepAlive 配置快照 */
export function getKeepAliveConfig(): Required<KeepAliveConfig> {
  const ctx = getContext();
  return { enabled: ctx.keepAliveEnabled, max: ctx.maxKeepAliveApps, ttl: ctx.keepAliveTTL };
}

export function isKeepAliveEnabled(): boolean {
  return getContext().keepAliveEnabled;
}

/** v4.2.1 N5: 全局 CSS 作用域兜底开关 */
export function setStyleIsolation(enabled: boolean): void {
  getContext().styleIsolationEnabled = enabled;
}

/** @deprecated 使用 configureKeepAlive({ max }) */
export function setMaxKeepAliveApps(max: number): void {
  configureKeepAlive({ max });
}

// ==================== 实例管理 ====================

export function createAppInstance(config: MicroAppConfig): AppInstance {
  const instance: AppInstance = {
    config,
    status: "NOT_LOADED",
    exports: null,
    keepAlive: false,
    cachedRoot: null,
    cachedParent: null,
    strategy: null,
    sandboxType: config.sandbox ?? "snapshot",
    loadMetrics: null,
    error: null,
    lastActivatedAt: 0,
    keepAliveSince: 0,
    pinned: false,
    cachedState: undefined,
    manifest: null,
  };
  getContext().appInstances.set(config.name, instance);
  return instance;
}

export function getAppInstance(name: string): AppInstance | undefined {
  return getContext().appInstances.get(name);
}

export function getAllInstances(): AppInstance[] {
  return [...getContext().appInstances.values()];
}

// ==================== 桥接与结果类型 ====================

/**
 * globalState 桥接接口 (v3.6.0)：iframe 沙箱场景跨 realm 同步。
 * scheduler 建立桥接后通过 postToChild / onChildMessage 双向同步。
 */
export interface GlobalStateBridge {
  getGlobalState: () => Record<string, unknown>;
  setGlobalState: (patch: Record<string, unknown>) => void;
  onGlobalStateChange: (
    listener: (state: Record<string, unknown>) => void,
    fireImmediately?: boolean,
  ) => () => void;
}

/** deactivateApp 返回值，含 LRU 淘汰信息 (P0-P2) */
export interface DeactivateResult extends UnmountResult {
  evicted?: string[];
}

/**
 * 创建 iframe globalState 代理：子应用通过此代理读写 globalState，
 * 内部通过 postMessage 跨 realm 同步 (v3.6.0)。
 */
export function createGlobalStateProxy(
  bridge: GlobalStateBridge,
  postToChild: (state: Record<string, unknown>) => void,
) {
  return {
    getGlobalState: () => bridge.getGlobalState(),
    setGlobalState: (patch: Record<string, unknown>) => {
      bridge.setGlobalState(patch);
      postToChild(bridge.getGlobalState());
    },
    onGlobalStateChange: (
      listener: (state: Record<string, unknown>) => void,
      fireImmediately?: boolean,
    ) => bridge.onGlobalStateChange(listener, fireImmediately),
  };
}

// ==================== 保活实例 Pin 控制 ====================

/** v3.7.0: 设置 pin 状态 — 固定实例在 LRU 淘汰时被跳过 */
export function setPinnedApp(name: string, pin: boolean): void {
  const instance = getContext().appInstances.get(name);
  if (instance) instance.pinned = pin;
}

// ==================== 兼容设置器 ====================

/** @deprecated 使用 configureKeepAlive({ ttl }) */
export function setKeepAliveTTL(ttlMs: number): void {
  configureKeepAlive({ ttl: ttlMs });
}

/** @deprecated 使用 getKeepAliveConfig().ttl */
export function getKeepAliveTTL(): number {
  return getContext().keepAliveTTL;
}

// ==================== 状态重置与统计 ====================

/**
 * 重置调度器：清空实例并恢复保活默认值。
 * 供 kernel _stop() 在 HMR / 测试场景调用。
 */
export function resetScheduler(): void {
  const ctx = getContext();
  ctx.appInstances.clear();
  ctx.maxKeepAliveApps = 5;
  ctx.keepAliveTTL = 30 * 60 * 1000;
  ctx.keepAliveEnabled = true;
  ctx.keepAliveTimestamp = 1;
}

/** 统计当前 keep-alive 缓存状态的实例数 (UNMOUNTED + keepAlive + cachedRoot) */
export function getKeepAliveCount(): number {
  let count = 0;
  for (const instance of getContext().appInstances.values()) {
    if (instance.keepAlive && instance.status === "UNMOUNTED" && instance.cachedRoot) {
      count++;
    }
  }
  return count;
}

/** 重置 keepAliveEnabled 标志 (供测试) */
export function resetKeepAliveEnabled(): void {
  getContext().keepAliveEnabled = true;
}

/**
 * v4.2.1: 设置实例级 + 全局 keepAlive 标记。
 * @deprecated 建议使用 configureKeepAlive({ enabled }) 控制全局。
 */
export function setKeepAlive(name: string, keep: boolean): void {
  const instance = getContext().appInstances.get(name);
  if (instance) instance.keepAlive = keep;
  configureKeepAlive({ enabled: keep }); // 兼容 v3.x 全局同步
}
