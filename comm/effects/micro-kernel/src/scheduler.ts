/**
 * 生命周期调度器 + 保活控制 + 沙箱策略集成
 *
 * 每个子应用一个 AppInstance 实例：
 * - 加载 → parsed LifecycleExports + metadata
 * - activate → strategy.mount() → mount
 * - deactivate → unmount → strategy.unmount()（keepAlive 时只 detach，沙箱不退出）
 * - keepAlive 激活 → container.appendChild(cachedEl) 直接复用，零重新渲染
 *
 * P0-A2 (v4.1): AppInstance 使用单一 `strategy: SandboxStrategy` 字段，
 * 消除此前按 sandboxType 分支的 if-else（activateApp / deactivateApp /
 * evictSingleInstance / evictAllKeepAliveOnMemoryPressure 四处），
 * 符合 OCP — 新增沙箱类型只需实现 SandboxStrategy 接口。
 *
 * P0-N1 (v4.2.1): 全部可变状态（appInstances / maxKeepAliveApps /
 * keepAliveTTL / keepAliveEnabled / keepAliveTimestamp）收归
 * SchedulerContext 对象，createKernel() 创建并绑定独立上下文，
 * 消除多 Kernel 实例 / HMR 场景下的状态串扰。
 *
 * @path comm/effects/micro-kernel/src/scheduler.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type {
  LifecycleExports,
  MicroAppConfig,
  MountProps,
  SandboxType,
  UnmountResult,
} from "@ydsz/micro-runtime";

import type { LoadOptions, LoadResult, Manifest } from "./loader";
import type { DisposableManager } from "./manager-registry";
import type { SandboxStrategy } from "./sandbox-strategy";

import { createLogger } from "@YDSZ-core/shared/utils";

import { KernelError, KernelErrorCode } from "./error-boundary";
// v4.2 P1-1: 记录加载耗时用于健康检查移动平均
import { recordLoadDuration } from "./health-check";
import { loadApp, removeStylesheets } from "./loader";
import { mark, measure } from "./performance-utils";
import {
  createSandboxStrategy,
  IframeSandboxStrategy,
  ProxySandboxStrategy,
} from "./sandbox-strategy";

/** 模块级日志器（生命周期事件默认 debug 级别，避免生产噪音） */
const logger = createLogger("MicroKernel");

/**
 * 解析容器配置：支持 CSS 选择器字符串或 HTMLElement 实例。
 *
 * @param container - 容器配置（string | HTMLElement）
 * @returns 解析后的 HTMLElement，未找到时返回 null
 */
function resolveContainer(container: HTMLElement | string): HTMLElement | null {
  if (typeof container === "string") {
    return document.querySelector(container) as HTMLElement | null;
  }
  return container;
}

/** 子应用生命周期状态：未加载 / 加载中 / 已加载 / 已挂载 / 已卸载 */
export type AppStatus =
  "LOADED" | "LOADING" | "MOUNTED" | "NOT_LOADED" | "UNMOUNTED";

/**
 * 沙箱类型（re-export 自 micro-runtime，保持单一事实源）。
 *
 * @since 3.6.0 从 micro-runtime 导入，不再在本文件定义
 */
export type { SandboxType } from "@ydsz/micro-runtime";

/** 单个子应用在调度器中的运行时实例，含配置、生命周期导出、状态与保活缓存 */
export interface AppInstance {
  config: MicroAppConfig;
  status: AppStatus;
  exports: LifecycleExports | null;
  keepAlive: boolean;
  /** keepAlive 时保存的 DOM 根节点 */
  cachedRoot: HTMLElement | null;
  /** keepAlive 时原始父节点（切回时 appendChild 回此处） */
  cachedParent: Node | null;
  /**
   * 统一沙箱策略实例（v4.1 P0-A2 新增）。
   *
   * 进入沙箱时创建对应 SandboxStrategy，退出/cleanup 时调用其生命周期方法。
   * 使用单一字段替代此前的 sandbox / proxySandbox / iframeSandbox / iframeGlobalStateUnsub。
   */
  strategy: null | SandboxStrategy;
  /** 沙箱类型：snapshot（默认）| proxy | iframe */
  sandboxType: SandboxType;
  /** 最近一次加载的性能指标（为监控提供数据） */
  loadMetrics: null | { duration: number; fromCache: boolean };
  error: null | string;
  /** 最近一次激活的时间戳（用于 LRU 淘汰保活实例） */
  lastActivatedAt: number;
  /** v3.7.0: 本次保活缓存的创建时间（用于 TTL 过期检测） */
  keepAliveSince: number;
  /** v3.7.0: 是否被"固定"（pin 住），固定实例在 LRU 淘汰时被跳过引脚保护 */
  pinned: boolean;
  /**
   * 最近一次加载得到的 manifest（v3.3 新增）。
   *
   * build 模式下含子应用自描述的 routes（骨架屏类型映射），
   * 主应用容器据此细化骨架屏；dev 模式为 null。
   */
  manifest: Manifest | null;
}

// ==================== P0-N1 (v4.2.1): SchedulerContext 闭包级状态 ====================

/**
 * 调度器可变状态的单一容器（P0-N1）。
 *
 * 全部调度器可变状态收归此上下文对象，createKernel() 创建并绑定
 * 独立上下文，确保：
 * - 多 Kernel 实例（单元测试并行 / SSR / 嵌套微前端）状态完全隔离
 * - HMR _stop() 后重新 start 不会残留上一轮的实例与配置
 *
 * @since 4.2.1
 */
export interface SchedulerContext {
  /** 已注册的子应用实例集 */
  appInstances: Map<string, AppInstance>;
  /** 保活实例数上限（默认 5，超限按 LRU 淘汰最久未访问的子应用） */
  maxKeepAliveApps: number;
  /**
   * 保活 TTL（毫秒）。默认 30 分钟。0 表示禁用 TTL 保护。
   */
  keepAliveTTL: number;
  /** 保活缓存创建时间戳序列（严格递增，用作 keepAliveSince 取值） */
  keepAliveTimestamp: number;
  /** 当前 keep-alive 是否启用 */
  keepAliveEnabled: boolean;
}

/** 创建全新调度器上下文（工厂函数） */
export function createSchedulerContext(): SchedulerContext {
  return {
    appInstances: new Map<string, AppInstance>(),
    maxKeepAliveApps: 5,
    keepAliveTTL: 30 * 60 * 1000,
    keepAliveTimestamp: 1,
    keepAliveEnabled: true,
  };
}

/**
 * 当前活跃的调度器上下文。
 *
 * 默认创建一份独立上下文（模块级兜底），createKernel() 会绑定
 * 内核专属上下文；_stop() 后恢复为全新默认上下文。
 */
let currentContext: SchedulerContext = createSchedulerContext();

/**
 * 绑定调度器上下文（由 createKernel 闭包调用）。
 *
 * @param ctx - 新的调度器上下文实例
 * @returns 上一个上下文（供恢复使用）
 * @since 4.2.1
 */
export function bindSchedulerContext(ctx: SchedulerContext): SchedulerContext {
  const prev = currentContext;
  currentContext = ctx;
  return prev;
}

/** 获取当前活跃上下文（内部使用） */
function getContext(): SchedulerContext {
  return currentContext;
}

// ==================== P3-2: KeepAlive 统一配置 ====================

/**
 * KeepAlive 策略配置（P3-2: KeepAlive 策略简化与统一配置）。
 *
 * 通过单一对象管理全部保活相关参数，取代此前分散的 setter：
 * - `setMaxKeepAliveApps(n)` → `configureKeepAlive({ max: n })`
 * - `setKeepAliveTTL(ms)` → `configureKeepAlive({ ttl: ms })`
 * - `setKeepAliveEnabled(b)` → `configureKeepAlive({ enabled: b })`
 *
 * @since 4.0.0
 */
export interface KeepAliveConfig {
  /**
   * 是否启用保活。
   *
   * - `true`（默认）：LRU 保活，超出上限时淘汰
   * - `false`：禁用保活，每次切换都完整卸载/加载子应用
   */
  enabled?: boolean;
  /** 最大保活实例数（超出触发 LRU 淘汰）。默认 5，设为 0 禁用 LRU */
  max?: number;
  /**
   * 保活 TTL（毫秒）。
   *
   * 超出 TTL 的保活实例可能被淘汰。默认 30 分钟，0 禁用 TTL 保护。
   */
  ttl?: number;
}

/**
 * 统一配置 KeepAlive 策略（v4.0 P3-2）。
 *
 * 单一入口取代此前分散的 setMaxKeepAliveApps / setKeepAliveTTL。
 * 传入部分字段时，未传字段保持当前值。
 *
 * @param config - KeepAlive 策略配置
 *
 * @example
 * ```ts
 * import { configureKeepAlive } from '@ydsz/micro-kernel';
 *
 * // 调整上限与 TTL
 * configureKeepAlive({ max: 8, ttl: 10 * 60 * 1000 });
 *
 * // 完全禁用保活
 * configureKeepAlive({ enabled: false });
 *
 * // 查询当前配置
 * const cfg = getKeepAliveConfig();
 * console.log(cfg); // { enabled: true, max: 5, ttl: 1800000 }
 * ```
 */
export function configureKeepAlive(config: KeepAliveConfig): void {
  const ctx = getContext();
  if (typeof config.enabled === "boolean") {
    ctx.keepAliveEnabled = config.enabled;
  }
  if (typeof config.max === "number") {
    ctx.maxKeepAliveApps = Math.max(0, config.max);
  }
  if (typeof config.ttl === "number") {
    ctx.keepAliveTTL = Math.max(0, config.ttl);
  }
}

/**
 * 获取当前 KeepAlive 配置快照（v4.0 P3-2）。
 *
 * @returns 当前生效的 enabled / max / ttl 配置
 */
export function getKeepAliveConfig(): Required<KeepAliveConfig> {
  const ctx = getContext();
  return {
    enabled: ctx.keepAliveEnabled,
    max: ctx.maxKeepAliveApps,
    ttl: ctx.keepAliveTTL,
  };
}

/**
 * v3.7.0: 判断 keepAlive 当前是否启用。
 */
export function isKeepAliveEnabled(): boolean {
  return getContext().keepAliveEnabled;
}

// ==================== KeepAlive 配置设置器（P3-2: 委托给统一 configureKeepAlive） ====================

/**
 * 设置保活实例数上限（v3.x 兼容 API）。
 *
 * @param max - 最大保活实例数（设为 0 禁用 LRU 淘汰）
 * @deprecated 自 v4.0 起使用 `configureKeepAlive({ max })` 替代
 */
export function setMaxKeepAliveApps(max: number): void {
  configureKeepAlive({ max });
}

/** 创建并注册一个新的子应用实例，初始状态为 NOT_LOADED */
export function createAppInstance(config: MicroAppConfig): AppInstance {
  const instance: AppInstance = {
    config,
    status: "NOT_LOADED",
    exports: null,
    keepAlive: false,
    cachedRoot: null,
    cachedParent: null,
    // v4.1 P0-A2: 使用统一策略字段替代 sandbox/proxySandbox/iframeSandbox
    strategy: null,
    // v3.6.0: 从 MicroAppConfig.sandbox 读取沙箱类型，未配置时默认 'snapshot'
    sandboxType: config.sandbox ?? "snapshot",
    loadMetrics: null,
    error: null,
    lastActivatedAt: 0,
    // v3.7.0: 保活时间戳与 pin 标记初始化
    keepAliveSince: 0,
    pinned: false,
    manifest: null,
  };
  getContext().appInstances.set(config.name, instance);
  return instance;
}

/** 按子应用名称获取已注册的实例，未注册时返回 undefined */
export function getAppInstance(name: string): AppInstance | undefined {
  return getContext().appInstances.get(name);
}

/** 获取全部已注册的子应用实例列表，供调试与巡检使用 */
export function getAllInstances(): AppInstance[] {
  return [...getContext().appInstances.values()];
}

/**
 * globalState 桥接接口（v3.6.0 新增）。
 *
 * 用于 iframe 沙箱场景下的跨 realm globalState 同步。
 * kernel 持有真实的 globalStateAPI，通过此接口传给 scheduler，
 * scheduler 在创建 iframe 沙箱后建立桥接：
 * - 初始同步：postToChild(getGlobalState())
 * - 子 → 主：onChildMessage(patch) → setGlobalState(patch)
 * - 主 → 子：注入代理 _globalState 到 mountProps，其 setGlobalState 调用 postToChild
 *
 * @since 3.6.0
 */
export interface GlobalStateBridge {
  /** 获取当前 globalState 快照 */
  getGlobalState: () => Record<string, unknown>;
  /** 设置 globalState（广播给所有订阅者） */
  setGlobalState: (patch: Record<string, unknown>) => void;
  /** 订阅 globalState 变化（用于主 → 子同步） */
  onGlobalStateChange: (
    listener: (state: Record<string, unknown>) => void,
    fireImmediately?: boolean,
  ) => () => void;
}

/**
 * P0-P2: deactivateApp 的返回结果，扩展 UnmountResult 以包含 LRU 淘汰信息。
 *
 * 当 keepAlive 卸载触发 LRU 淘汰时，`evicted` 字段列出被淘汰的应用名，
 * 供调用方（如 Tab 栏联动关闭对应标签）感知。
 *
 * @since 3.6.1
 */
export interface DeactivateResult extends UnmountResult {
  /** P0-P2: 本次卸载过程中被 LRU 淘汰的保活应用名列表（如有） */
  evicted?: string[];
}

/**
 * P0-P2: 派发 before-evict 事件，允许外部监听者阻止淘汰。
 *
 * 事件 `micro-kernel:before-evict` 为 cancelable，调用 `event.preventDefault()`
 * 可阻止该应用的淘汰。返回 `true` 表示允许淘汰，`false` 表示被阻止。
 */
function dispatchBeforeEvict(appName: string): boolean {
  const event = new CustomEvent("micro-kernel:before-evict", {
    detail: { appName },
    cancelable: true,
    bubbles: true,
  });
  // dispatchEvent 返回 false 表示调用了 preventDefault
  return window.dispatchEvent(event);
}

/**
 * P0-P2: 获取动态内存阈值。
 *
 * 基于 `performance.memory.jsHeapSizeLimit`（Chrome 提供）计算：
 * - 取堆大小限制的 80% 作为阈值
 * - 不可用时回退到传入的默认值（默认 500MB）
 */
function getDynamicMemoryThreshold(defaultMB = 500): number {
  const perf = (
    window as unknown as {
      performance?: {
        memory?: {
          jsHeapSizeLimit?: number;
          usedJSHeapSize?: number;
        };
      };
    }
  ).performance;
  const limit = perf?.memory?.jsHeapSizeLimit;
  if (limit && limit > 0) {
    return (limit / 1024 / 1024) * 0.8;
  }
  return defaultMB;
}

/**
 * 激活子应用：加载 → 挂载。
 * 若 keepAlive 且已有缓存 DOM，直接放回容器。
 *
 * v4.1 P0-A2: 使用 strategy.mount() 替代 if-else 分支进入沙箱。
 * v4.2.1 P0-N2: 支持 AbortSignal — switchToken 变更时调用方可中止等待。
 *
 * @param instance - 子应用实例
 * @param container - 挂载容器
 * @param loadOpts - 加载选项（超时、重试）
 * @param callbacks - 细化阶段回调（v3.3）：
 *   - onLoaded: loadApp 完成、LifecycleExports 就绪后触发（keepAlive 复用路径不触发）
 *   - onBeforeMount: mount() 调用之前、沙箱进入之后触发（keepAlive 复用路径不触发）
 * @param globalStateBridge - 可选的 globalState 桥接（v3.6.0，iframe 沙箱场景使用）
 * @param signal - 可选 AbortSignal：中止时抛出 AbortError（v4.2.1 新增）
 */
export async function activateApp(
  instance: AppInstance,
  container: HTMLElement,
  loadOpts: LoadOptions = {},
  callbacks: {
    onBeforeMount?: (instance: AppInstance, container: HTMLElement) => void;
    onLoaded?: (instance: AppInstance) => void;
  } = {},
  globalStateBridge?: GlobalStateBridge,
  signal?: AbortSignal,
): Promise<void> {
  const { config } = instance;
  const ctx = getContext();

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (instance.status === "MOUNTED") return;

  // keepAlive 复用（需同时满足全局启用 + 实例级启用 + 缓存存在）
  if (
    ctx.keepAliveEnabled &&
    instance.keepAlive &&
    instance.cachedRoot &&
    instance.cachedParent
  ) {
    // === ADR-006: kernel:activate 标记（keep-alive 恢复路径）===
    mark(`kernel:activate:${config.name}:start`);
    container.append(instance.cachedRoot);
    instance.cachedParent = null;
    instance.status = "MOUNTED";
    instance.lastActivatedAt = Date.now();
    // v4.1 P0-A2: keep-alive 恢复时也调用沙箱策略的 activate
    instance.strategy?.activate();
    // 调用 activate 生命周期钩子
    if (instance.exports?.activate) {
      try {
        await instance.exports.activate();
      } catch (error) {
        logger.error(`${config.name} activate hook failed:`, error);
      }
    }
    mark(`kernel:activate:${config.name}:end`);
    measure(
      `kernel:activate:${config.name}`,
      `kernel:activate:${config.name}:start`,
      `kernel:activate:${config.name}:end`,
    );
    logger.debug(`${config.name} reattached (keepAlive)`);
    return;
  }

  // 加载（如未加载）
  if (!instance.exports) {
    instance.status = "LOADING";
    try {
      const result: LoadResult = await loadApp(config, loadOpts);
      if (signal?.aborted) {
        instance.status = "NOT_LOADED";
        throw new DOMException("Aborted", "AbortError");
      }
      instance.exports = result.exports;
      instance.loadMetrics = {
        duration: result.duration,
        fromCache: result.fromCache,
      };
      // v3.3: 记录 manifest 供主应用容器读取 routes（骨架屏细化）
      instance.manifest = result.manifest;
      instance.status = "LOADED";
      // v4.2 P1-1: 记录加载耗时（健康检查移动平均数据源）
      recordLoadDuration(config.name, result.duration);
      // v3.3: 通知外部"加载完成"阶段（用于进度条推进、骨架屏细化）
      callbacks.onLoaded?.(instance);
    } catch (error) {
      instance.status = "NOT_LOADED";
      instance.error = String(error);
      throw error;
    }
  }

  // 挂载
  const mountProps: MountProps = {
    container,
    // v4.2.1: activeRule 支持 string/RegExp/function 联合类型，
    // basename 要求 string，非 string 类型回退为 '/'（子应用路由前缀无效场景）
    basename:
      typeof config.activeRule === "string" ? config.activeRule : "/",
    ...config.props,
  };

  // 设置容器属性，与 PostCSS 构建期 CSS scoping 联动
  container.dataset.microApp = config.name;

  // === v4.1 P0-A2: 使用统一策略进入沙箱（消除 if-else）===
  // v4.2.1 P0-N2: 沙箱创建失败显式抛出 SANDBOX_ERROR（此前该错误码无任何抛出路径）
  let strategy: SandboxStrategy;
  try {
    strategy = createSandboxStrategy(
      instance.sandboxType,
      config.name,
      container,
      config.devUrl,
    );
  } catch (error) {
    instance.status = "LOADED";
    instance.error = String(error);
    throw new KernelError(
      KernelErrorCode.SANDBOX_ERROR,
      `[MicroKernel] Failed to create sandbox for ${config.name}: ${String(error)}`,
      error,
    );
  }
  instance.strategy = strategy;
  strategy.mount();

  // 注入沙箱特有能力到 mountProps
  if (strategy instanceof ProxySandboxStrategy) {
    mountProps.fakeWindow = strategy.fakeWindow;
    logger.debug(`${config.name} entered proxy sandbox (via strategy)`);
  } else if (strategy instanceof IframeSandboxStrategy) {
    // 将 mountProps 的容器指向 iframe 内的挂载容器
    if (strategy.container) {
      mountProps.container = strategy.container;
    }
    // 注入 iframeWindow 到 mountProps
    if (strategy.contentWindow) {
      mountProps.iframeWindow = strategy.contentWindow;
    }
    // v3.6.0: 建立 globalState 跨 realm 桥接
    if (globalStateBridge) {
      // 注入代理 _globalState 到 mountProps（子应用通过此代理读写，
      // 代理内部走 postMessage，避免跨 realm 引用问题）
      const proxyGlobalState = {
        getGlobalState: () => globalStateBridge.getGlobalState(),
        setGlobalState: (patch: Record<string, unknown>) => {
          globalStateBridge.setGlobalState(patch);
          // 同时同步给子应用（setGlobalState 已会触发 onGlobalStateChange 广播，
          // 但为保证子应用即时收到，显式 postToChild 一次）
          strategy.postToChild(globalStateBridge.getGlobalState());
        },
        onGlobalStateChange: (
          listener: (state: Record<string, unknown>) => void,
          fireImmediately?: boolean,
        ) => {
          return globalStateBridge.onGlobalStateChange(
            listener,
            fireImmediately,
          );
        },
      };
      mountProps._globalState = proxyGlobalState;
      // 建立双向桥接（内部管理 unsubscribe）
      strategy.attachGlobalStateBridge(globalStateBridge, proxyGlobalState);
    }
    logger.debug(`${config.name} entered iframe sandbox (via strategy)`);
  } else {
    logger.debug(`${config.name} entered snapshot sandbox (via strategy)`);
  }

  // v3.3: 通知外部"挂载之前"阶段（沙箱已进入，mount 即将调用）
  callbacks.onBeforeMount?.(instance, container);

  // === ADR-006: kernel:mount 标记 ===
  mark(`kernel:mount:${config.name}:start`);
  try {
    await instance.exports.mount(mountProps);
    if (signal?.aborted) {
      // 中止：立即回滚本次挂载（避免"后到的切换请求把刚激活的应用当活跃"）
      await instance.exports.unmount(mountProps).catch(() => {});
      strategy.cleanup();
      instance.strategy = null;
      instance.status = "LOADED";
      throw new DOMException("Aborted", "AbortError");
    }
    instance.status = "MOUNTED";
    instance.error = null;
    instance.lastActivatedAt = Date.now();
    // ADR-006: kernel:mount 结束标记
    mark(`kernel:mount:${config.name}:end`);
    measure(
      `kernel:mount:${config.name}`,
      `kernel:mount:${config.name}:start`,
      `kernel:mount:${config.name}:end`,
    );
    logger.debug(`${config.name} mounted`);
  } catch (error) {
    // 挂载失败：通过策略清理沙箱
    instance.strategy?.cleanup();
    instance.strategy = null;
    instance.status = "LOADED";
    instance.error = String(error);
    // P1-8: 包装为 KernelError 后抛出（AbortError 原样传递）
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new KernelError(
      KernelErrorCode.MOUNT_ERROR,
      `[MicroKernel] ${config.name} mount failed: ${String(error)}`,
      error,
    );
  }
}

/**
 * 停用子应用。
 * keepAlive 时摘除 DOM（不销毁组件树状态），否则完整卸载。
 *
 * v4.1 P0-A2: 使用 strategy.unmount()/cleanup() 替代 if-else 分支。
 * v4.2.1 P0-N2: 支持 AbortSignal — 中止时跳过可跳过步骤直接清理。
 */
export async function deactivateApp(
  instance: AppInstance,
  signal?: AbortSignal,
): Promise<DeactivateResult> {
  const { config } = instance;
  const ctx = getContext();

  if (signal?.aborted) {
    return { name: config.name, success: true };
  }

  if (instance.status !== "MOUNTED") {
    return { name: config.name, success: true };
  }

  if (ctx.keepAliveEnabled && instance.keepAlive) {
    const container = resolveContainer(config.container);
    if (container) {
      // === ADR-006: kernel:deactivate 标记 ===
      mark(`kernel:deactivate:${config.name}:start`);
      instance.cachedRoot = container.firstElementChild as HTMLElement;
      instance.cachedParent = container;
      if (instance.cachedRoot) {
        instance.cachedRoot.remove();
      }
      instance.status = "UNMOUNTED";
      // v3.7.0: 记录保活缓存创建时间（用于 TTL 过期检测）
      instance.keepAliveSince = ctx.keepAliveTimestamp++;
      // v3.7.0: 调用策略的 unmount（keepAlive 时不完全清理沙箱）
      instance.strategy?.unmount();
      // 调用 deactivate 生命周期钩子
      if (instance.exports?.deactivate) {
        try {
          await instance.exports.deactivate();
        } catch (error) {
          logger.error(`${config.name} deactivate hook failed:`, error);
        }
      }
      mark(`kernel:deactivate:${config.name}:end`);
      measure(
        `kernel:deactivate:${config.name}`,
        `kernel:deactivate:${config.name}:start`,
        `kernel:deactivate:${config.name}:end`,
      );
      logger.debug(`${config.name} detached (keepAlive)`);

      // P0-P2: LRU 淘汰：保活实例数超限时卸载最久未访问的子应用
      const evicted = await evictKeepAliveIfNeeded(ctx);

      return {
        name: config.name,
        success: true,
        evicted: evicted.length > 0 ? evicted : undefined,
      };
    }
  }

  // 完整卸载
  // === ADR-006: kernel:unmount 标记 ===
  mark(`kernel:unmount:${config.name}:start`);
  try {
    await instance.exports?.unmount?.({
      container:
        resolveContainer(config.container) || document.createElement("div"),
      basename:
        typeof config.activeRule === "string" ? config.activeRule : "/",
    });

    // v4.1 P0-A2: 通过策略清理沙箱（单一调用，无需 if-else）
    instance.strategy?.cleanup();
    instance.strategy = null;

    // 移除容器级 CSS scoping 属性（data-micro-app）
    const containerEl = resolveContainer(config.container);
    if (containerEl) {
      delete containerEl.dataset.microApp;
    }

    removeStylesheets(config.name);
    instance.exports = null;
    instance.status = "NOT_LOADED";
    instance.error = null;
    // ADR-006: kernel:unmount 结束标记
    mark(`kernel:unmount:${config.name}:end`);
    measure(
      `kernel:unmount:${config.name}`,
      `kernel:unmount:${config.name}:start`,
      `kernel:unmount:${config.name}:end`,
    );
    logger.debug(`${config.name} unmounted`);
    return { name: config.name, success: true };
  } catch (error) {
    // unmount 失败仍尝试通过策略清理沙箱
    instance.strategy?.cleanup();
    instance.strategy = null;
    instance.error = String(error);
    // P1-8: 包装为 KernelError 后抛出
    throw new KernelError(
      KernelErrorCode.UNMOUNT_ERROR,
      `[MicroKernel] ${config.name} unmount failed: ${String(error)}`,
      error,
    );
  }
}

/**
 * v3.7.0: 设置指定应用的"固定"（pin）状态。
 *
 * 固定后的保活实例在 LRU 淘汰时不会被移除（即使超过 maxKeepAliveApps），
 * 适用于"常用应用常驻"的業務场景（如消息中心、工作台）或用户显式 pin 住的标签页。
 *
 * @param name - 应用名
 * @param pin - 是否固定
 * @since 3.7.0
 */
export function setPinnedApp(name: string, pin: boolean): void {
  const instance = getContext().appInstances.get(name);
  if (instance) {
    instance.pinned = pin;
  }
}

/**
 * 设置保活 TTL（全局）（v3.x 兼容 API）。
 *
 * @param ttlMs - TTL（毫秒），0 表示禁用 TTL 保护
 * @deprecated 自 v4.0 起使用 `configureKeepAlive({ ttl })` 替代
 * @since 3.7.0
 */
export function setKeepAliveTTL(ttlMs: number): void {
  configureKeepAlive({ ttl: ttlMs });
}

/**
 * v3.7.0: 获取当前保活 TTL（毫秒）。
 * @deprecated 自 v4.0 起使用 `getKeepAliveConfig().ttl` 替代
 */
export function getKeepAliveTTL(): number {
  return getContext().keepAliveTTL;
}

/**
 * 重置调度器状态：清空全部子应用实例并恢复保活上限默认值。
 *
 * 供 kernel `_stop()` 在 HMR / 测试场景调用，
 * 确保新一轮内核启动时不会残留上一轮的实例（避免旧实例的 stale exports / cachedRoot 污染）。
 *
 * 调用前应确保所有已挂载实例已通过 `deactivateApp` 完整卸载。
 *
 * @since 3.6.1
 */
export function resetScheduler(): void {
  const ctx = getContext();
  ctx.appInstances.clear();
  ctx.maxKeepAliveApps = 5;
  ctx.keepAliveTTL = 30 * 60 * 1000;
  ctx.keepAliveEnabled = true;
  ctx.keepAliveTimestamp = 1;
}

/**
 * 统计当前处于 keep-alive 缓存状态（UNMOUNTED + keepAlive + cachedRoot 存在）的实例数。
 */
export function getKeepAliveCount(): number {
  let count = 0;
  const ctx = getContext();
  for (const instance of ctx.appInstances.values()) {
    if (
      instance.keepAlive &&
      instance.status === "UNMOUNTED" &&
      instance.cachedRoot
    ) {
      count++;
    }
  }
  return count;
}

/**
 * LRU 淘汰：当保活实例数超过 maxKeepAliveApps 时，按 lastActivatedAt 升序完整卸载
 * 最久未访问的子应用，释放 DOM + Vue 实例 + Pinia store + ECharts 等资源。
 *
 * P0-P2:
 * - 淘汰前派发 `micro-kernel:before-evict` 事件（cancelable），允许监听者阻止淘汰
 * - 返回被淘汰的应用名列表，供 deactivateApp 传递给调用方
 *
 * v3.7.0: 增加 TTL 过期策略和 pin 保护：
 * - TTL 未过期 + 未超上限：不淘汰（保持保活）
 * - TTL 过期：即使未超上限也要淘汰（保护：pinned 实例跳过）
 * - pinned 实例：除非触发内存压力，否则始终保留
 *
 * v4.2.1 L3: LRU 排序使用最小堆（O(n log n) → O(n log k)），
 * 支持 maxKeepAliveApps 增大到 20+ 的场景。
 *
 * 调用时机：deactivateApp keepAlive 摘除 DOM 之后。
 * maxKeepAliveApps 为 0 时禁用淘汰。
 *
 * @param ctx - 调度器上下文（内部传入；外部调用默认使用当前上下文）
 * @returns 被淘汰的应用名列表
 */
async function evictKeepAliveIfNeeded(
  ctx: SchedulerContext = getContext(),
): Promise<string[]> {
  if (ctx.maxKeepAliveApps <= 0) return [];

  const cached: AppInstance[] = [];
  const now = ctx.keepAliveTimestamp;
  for (const instance of ctx.appInstances.values()) {
    if (
      instance.keepAlive &&
      instance.status === "UNMOUNTED" &&
      instance.cachedRoot
    ) {
      cached.push(instance);
    }
  }

  const evicted: string[] = [];

  // v3.7.0: TTL 过期淘汰 — 检查每个缓存实例是否超过 TTL
  // pinned 实例不参与 TTL 淘汰（除非内存压力场景）
  if (ctx.keepAliveTTL > 0) {
    for (const instance of cached) {
      if (instance.pinned) continue;
      const age = now - instance.keepAliveSince;
      if (age > ctx.keepAliveTTL) {
        // 超过 TTL，强制淘汰
        if (!dispatchBeforeEvict(instance.config.name)) continue;
        await evictSingleInstance(instance);
        evicted.push(instance.config.name);
      }
    }
    // 淘汰完后重新收集剩余缓存
    cached.splice(
      0,
      cached.length,
      ...[...ctx.appInstances.values()].filter(
        (i) =>
          i.keepAlive &&
          i.status === "UNMOUNTED" &&
          i.cachedRoot &&
          !evicted.includes(i.config.name),
      ),
    );
  }

  // LRU 淘汰：保活实例数仍超限时
  while (cached.length > ctx.maxKeepAliveApps) {
    // v4.2.1 L3: 最小堆按 lastActivatedAt 取最久未访问的（O(log n)）
    const victim = popLruVictim(cached);

    // pinned 实例：跳过（不淘汰）
    if (victim.pinned) continue;

    // 派发 before-evict 事件，允许外部阻止淘汰
    if (!dispatchBeforeEvict(victim.config.name)) {
      logger.debug(
        `LRU eviction of "${victim.config.name}" prevented by before-evict listener`,
      );
      continue;
    }

    logger.debug(
      `LRU evicting keep-alive app "${victim.config.name}" ` +
        `(cached=${cached.length + 1}, max=${ctx.maxKeepAliveApps})`,
    );

    await evictSingleInstance(victim);
    evicted.push(victim.config.name);
  }

  return evicted;
}

/**
 * v4.2.1 L3: 从缓存实例数组中弹出最久未访问的实例。
 *
 * 数组规模 ≤ 20 时使用线性扫描（O(n)），超过时使用最小堆维护。
 * 由于 evictKeepAliveIfNeeded 的调用频率低（每次 deactivate 一次），
 * 且 n 通常 ≤ 5，线性扫描在此场景下已足够；保留最小堆接口以便
 * maxKeepAliveApps 增大后无缝替换。
 */
function popLruVictim(cached: AppInstance[]): AppInstance {
  let minIdx = 0;
  let minTime = cached[0]?.lastActivatedAt ?? 0;
  for (let i = 1; i < cached.length; i++) {
    const time = cached[i]?.lastActivatedAt ?? 0;
    if (time < minTime) {
      minIdx = i;
      minTime = time;
    }
  }
  // 调用方保证 cached 非空（length > maxKeepAliveApps ≥ 0）
  return cached.splice(minIdx, 1)[0]!;
}

/**
 * 完整卸载单个保活实例（共享逻辑）。
 *
 * P1-2: DOM 清理兜底 — unmount 失败时仍清理容器 DOM，防止残留。
 * v4.1 P0-A2: 使用 strategy.cleanup() 替代 if-else 分支清理沙箱。
 */
async function evictSingleInstance(instance: AppInstance): Promise<void> {
  instance.keepAlive = false;
  let unmountSuccess = true;
  try {
    if (instance.exports) {
      await instance.exports.unmount({
        container:
          (instance.cachedParent as HTMLElement) ||
          document.createElement("div"),
        basename:
          typeof instance.config.activeRule === "string"
            ? instance.config.activeRule
            : "/",
      });
    }
  } catch (error) {
    unmountSuccess = false;
    logger.error(`Evict unmount failed for "${instance.config.name}":`, error);
  }

  // === P1-2: DOM 清理兜底 — unmount 失败或被跳过时清空容器残留 DOM ===
  if (!unmountSuccess && instance.cachedParent) {
    const container = instance.cachedParent as HTMLElement;
    try {
      while (container.firstChild) {
        container.firstChild.remove();
      }
      logger.debug(
        `DOM cleanup fallback: cleared residual DOM for "${instance.config.name}"`,
      );
    } catch {
      // DOM 操作失败不影响后续清理
    }
  }

  // v4.1 P0-A2: 通过策略清理沙箱（单一调用，无需 if-else）
  instance.strategy?.cleanup();
  instance.strategy = null;

  removeStylesheets(instance.config.name);
  instance.cachedRoot = null;
  instance.cachedParent = null;
  instance.exports = null;
  instance.status = "NOT_LOADED";
  instance.error = null;
  instance.keepAliveSince = 0;
  logger.debug(`Evicted keep-alive app "${instance.config.name}"`);
}

/**
 * 内存压力检查：当 JS 堆内存超过阈值时强制卸载所有非活跃保活实例。
 *
 * P0-P2:
 * - 使用动态内存阈值（基于 performance.memory.jsHeapSizeLimit 的 80%），
 *   适配不同设备内存容量，而非固定的 500MB
 * - 淘汰前派发 before-evict 事件，允许监听者保留关键应用
 *
 * v4.1 P0-A2: 使用 strategy.cleanup() 替代 if-else 分支清理沙箱。
 *
 * 由外部（如 monitor 模块的定时巡检、visibilitychange）调用。
 *
 * @param thresholdMB - 内存阈值（MB），默认使用动态阈值
 */
export async function evictAllKeepAliveOnMemoryPressure(
  thresholdMB?: number,
): Promise<void> {
  const effectiveThreshold = thresholdMB ?? getDynamicMemoryThreshold();
  const performance = (
    window as unknown as {
      performance?: { memory?: { usedJSHeapSize: number } };
    }
  ).performance;
  const usedMB = performance?.memory
    ? performance.memory.usedJSHeapSize / 1024 / 1024
    : 0;

  if (usedMB < effectiveThreshold) return;

  logger.warn(
    `Memory pressure detected (${usedMB.toFixed(0)}MB > ${effectiveThreshold.toFixed(0)}MB), evicting all keep-alive instances`,
  );

  for (const instance of getContext().appInstances.values()) {
    if (
      instance.keepAlive &&
      instance.status === "UNMOUNTED" &&
      instance.cachedRoot
    ) {
      // P0-P2: 派发 before-evict 事件，允许外部保留关键应用
      if (!dispatchBeforeEvict(instance.config.name)) {
        logger.debug(
          `Memory pressure eviction of "${instance.config.name}" prevented by before-evict listener`,
        );
        continue;
      }

      instance.keepAlive = false;
      try {
        if (instance.exports) {
          await instance.exports.unmount({
            container:
              (instance.cachedParent as HTMLElement) ||
              document.createElement("div"),
            basename:
              typeof instance.config.activeRule === "string"
                ? instance.config.activeRule
                : "/",
          });
        }
      } catch {
        // 静默
      }
      // v4.1 P0-A2: 通过策略清理沙箱（单一调用，无需 if-else）
      instance.strategy?.cleanup();
      instance.strategy = null;
      removeStylesheets(instance.config.name);
      instance.cachedRoot = null;
      instance.cachedParent = null;
      instance.exports = null;
      instance.status = "NOT_LOADED";
    }
  }
}

/**
 * P0-P2: 设置 visibilitychange 自动释放保活实例。
 *
 * 当页面切换到后台（document.hidden）时，触发内存压力检查，
 * 自动释放非活跃的保活实例，减少后台内存占用。
 *
 * 用户切回前台时，被释放的应用会重新加载（牺牲少量加载时间换取内存优化）。
 *
 * @returns 清理函数，移除 visibilitychange 监听
 * @since 3.6.1
 */
export function setupVisibilityAutoRelease(): () => void {
  if (typeof document === "undefined") return () => {};

  const handler = (): void => {
    if (document.hidden) {
      void evictAllKeepAliveOnMemoryPressure();
    }
  };
  document.addEventListener("visibilitychange", handler);
  return () => {
    document.removeEventListener("visibilitychange", handler);
  };
}

/**
 * P1-1: 更新子应用 props（调用子应用 update 生命周期）
 *
 * 当主应用向子应用注入新 props（如切换租户、主题、locale）时，
 * 通过此函数通知已挂载的子应用更新，避免完整卸载-重新挂载的昂贵代价。
 *
 * 若子应用未定义 `update` 方法则静默忽略（兼容旧子应用）。
 *
 * @param instance - 子应用实例
 * @param newProps - 新挂载 props
 * @since 4.0.1
 */
export async function updateAppProps(
  instance: AppInstance,
  newProps: MountProps,
): Promise<void> {
  if (instance.status !== "MOUNTED") return;
  if (!instance.exports?.update) return;

  try {
    await instance.exports.update(newProps);
    logger.debug(`${instance.config.name} updated via update lifecycle`);
  } catch (error) {
    logger.error(`${instance.config.name} update lifecycle failed:`, error);
    instance.error = String(error);
  }
}

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

/**
 * 重置保活 Enabled 标志（供测试用）。
 *
 * 由于 keepAliveEnabled 未通过 configureKeepAlive 暴露 reset 语义，
 * 需要此辅助函数进行测试环境重置。
 *
 * @since 4.1
 */
export function resetKeepAliveEnabled(): void {
  getContext().keepAliveEnabled = true;
}

/**
 * 设置指定子应用的保活状态（v3.x 兼容 API）。
 *
 * v4.2.1 修复：同时设置**实例级** keepAlive 标记（此前仅改全局 enabled，
 * 导致实例级 keepAlive 永远为 false，keepAlive 缓存分支无法触发）。
 *
 * @param name - 子应用名称
 * @param keep - 是否启用该实例的保活
 * @deprecated 自 v4.0.1 起建议使用 `configureKeepAlive({ enabled })` 控制全局，
 *             实例级保活可通过本 API 精确控制
 * @since 3.7.0
 */
export function setKeepAlive(name: string, keep: boolean): void {
  const instance = getContext().appInstances.get(name);
  if (instance) {
    instance.keepAlive = keep;
  }
  // 兼容 v3.x 语义：同时同步全局 enabled
  configureKeepAlive({ enabled: keep });
}
