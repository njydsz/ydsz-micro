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
  /** 子应用实例表，key 为 MicroAppConfig.name；Map 的插入顺序即 LRU 的淘汰参考顺序 */
  appInstances: Map<string, AppInstance>;
  /** keep-alive 缓存的实例数上限，超出后按 LRU 淘汰；0 表示不做数量限制 */
  maxKeepAliveApps: number;
  /** 缓存实例的有效期（毫秒），超过后视为过期可被回收；0 = 禁用 TTL 保护 */
  keepAliveTTL: number;
  /** 逻辑时钟：每次保活缓存变动自增，用于生成单调递增的淘汰序号，避免 Date.now() 同毫秒碰撞 */
  keepAliveTimestamp: number;
  /** keep-alive 总开关；关闭后所有子应用走完整卸载，不再缓存 DOM 与状态 */
  keepAliveEnabled: boolean;
  /** v4.2.1 N5: 全局 CSS 作用域兜底开关 */
  styleIsolationEnabled: boolean;
}

/**
 * 创建一份全新的调度器上下文。
 *
 * 由 `createKernel` 在闭包内调用，使每个 kernel 实例持有独立状态，
 * 从而支持同页多 kernel 共存与 HMR 热替换（旧实例不会被新实例污染）。
 *
 * @returns 带默认保活策略的上下文：最多缓存 5 个实例、TTL 30 分钟、
 *          keep-alive 默认开启、CSS 作用域隔离默认关闭
 */
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

/**
 * 获取当前生效的调度器上下文。
 *
 * 这是整个 micro-kernel 内部读取保活/实例状态的唯一入口：所有状态访问
 * 都经由它间接寻址，而非直接引用模块级变量，这样 `bindSchedulerContext`
 * 切换上下文后既有调用点无需改动即可作用于新上下文。
 *
 * @returns 当前绑定的上下文；未显式绑定时为模块初始化时创建的默认上下文
 */
export function getContext(): SchedulerContext {
  return currentContext;
}

// ==================== KeepAlive 配置 (P3-2 v4.0) ====================

/**
 * keep-alive 策略的可选配置项。
 *
 * 三个字段全部可选且语义为「增量覆盖」：未传入的字段保持当前值不变，
 * 因此可以只调 `configureKeepAlive({ ttl })` 而不影响 max。
 */
export interface KeepAliveConfig {
  /** keep-alive 总开关，默认 true；置 false 后所有子应用走完整卸载 */
  enabled?: boolean;
  /** 缓存实例数上限，默认 5；传 0 表示不做数量限制（禁用 LRU 淘汰） */
  max?: number;
  /** 缓存有效期（毫秒），默认 30 分钟；传 0 表示不过期（禁用 TTL 保护） */
  ttl?: number;
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

/**
 * 判断当前是否启用 keep-alive。
 *
 * 卸载流程据此二选一：开启时缓存 DOM 与状态以便秒回，关闭时调用
 * 子应用 `unmount` 彻底释放。注意该开关是全局的，单个实例的
 * `instance.keepAlive` 为 false 时同样会走完整卸载。
 *
 * @returns true 表示启用保活缓存
 */
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

/**
 * 创建子应用运行时实例并登记到当前上下文的实例表。
 *
 * 兼具「构造」与「注册」两步，是为了避免调用方拿到实例后忘记注册
 * 而导致的实例泄漏（实例不在表中即无法被 LRU 回收、也无法被 reset 清理）。
 *
 * @param config 子应用配置；`name` 作为实例表的唯一 key，
 *               `sandbox` 缺省时回退为 `snapshot` 快照沙箱
 * @returns 新建的实例，状态为 `NOT_LOADED`
 *
 * @remarks
 * **同名会覆盖**：若表中已存在同名实例，旧实例被直接替换，其 keep-alive
 * 缓存与沙箱将不再被引用（由 GC 回收），但不会主动调用沙箱销毁。
 * 重复注册同名子应用前应先确保旧实例已卸载。
 */
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

/**
 * 按名称查找子应用实例。
 *
 * @param name 子应用名称，需与 `MicroAppConfig.name` 完全一致（区分大小写）
 * @returns 已注册的实例；未注册或已被 `resetScheduler()` 清空时返回 undefined，
 *          **不抛异常**，调用方需自行判空
 */
export function getAppInstance(name: string): AppInstance | undefined {
  return getContext().appInstances.get(name);
}

/**
 * 列出当前上下文中的全部子应用实例。
 *
 * @returns 实例数组的**快照**（Map 值的拷贝），可安全遍历或过滤，
 *          对返回数组的增删不会影响内部实例表
 *
 * @remarks
 * 顺序即 Map 的插入顺序，LRU 淘汰逻辑依赖该顺序，调用方不应依赖此顺序做业务判断。
 */
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
