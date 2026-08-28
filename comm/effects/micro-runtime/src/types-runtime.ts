/**
 * 微应用运行时 — 运行时接口与启动选项类型
 *
 * 从 types.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-runtime/src/types-runtime.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { MicroAppConfig } from "./types-app-config";
import type {
  LifecycleHook,
  LifecycleHookName,
  ErrorLifecycleHook,
  MicroAppEntry,
  PermissionChecker,
  UnmountResult,
} from "./types-lifecycle";

/** 全局状态句柄 — 从 global-state 统一导出，避免使用方直接依赖 internal 模块 */
export type {
  GlobalStateHandle,
  GlobalStateListener,
  RawGlobalStateAPI,
  VersionedState,
} from "./global-state";

/** 内核启动选项 */
export interface StartOptions {
  /** 沙箱策略 */
  sandbox?: {
    /** 启用样式隔离 */
    styleIsolation?: boolean;
  };
  /** 预加载策略：false 不预加载 / true 全部预加载 / 函数按应用名返回 true */
  prefetch?: ((app: MicroAppConfig) => boolean) | boolean;
  /** 权限检查器，用于预加载时过滤无权限的应用 */
  permissionChecker?: PermissionChecker;
  /**
   * 注册表适配器（v3.7.0 新增）。
   *
   * 默认 'static'：从 micro-apps.config.ts 静态 MICRO_APPS 数组读取。
   * 'remote' / 'auto'：优先拉取远程 registry.json，失败回退到静态。
   */
  registry?: "auto" | "remote" | "static";
  /**
   * 预加载策略模式（v3.7.0 新增）。
   *
   * - `eager`：立即注入 Speculation Rules + 全量预加载，适用于高速网络桌面端
   * - `lazy`（默认）：idle 时预加载 + 弱网跳过，节省带宽
   * - `never`：不预加载（用户手动点击菜单访问）
   *
   * 未传入时内核取 `shouldPrefetchByStrategy('lazy')` 结果。
   *
   * @since 3.7.0
   */
  prefetchStrategy?: "eager" | "lazy" | "never";
  /**
   * 自定义注册表获取函数（覆盖默认 resolveRegistry）。
   *
   * 用于测试或需要自定义获取逻辑（如从不同端点、带鉴权）的场景。
   *
   * @since 3.7.0
   */
  registryFetcher?: () => Promise<MicroAppEntry[]>;
  /**
   * P1-3: 路由激活阶段守卫。
   *
   * 仅作用于路由激活阶段（主应用路由跳转触发子应用 mount），
   * 在 `permissionChecker`（仅预加载阶段）之外提供更细粒度的权限控制。
   *
   * 返回 `true` 允许激活; `false` 阻止激活（停留在当前应用）。
   *
   * 典型用途: 已登录用户在 A 应用编辑表单时跳转 B 应用，
   * 通过 onRouteActivate 阻止并弹框提示保存。
   *
   * @since 4.0.1
   */
  onRouteActivate?: (appName: string) => boolean;
  /**
   * 是否启用内核内置的路由预测预加载（v4.2.1 N9）。
   *
   * 基于马尔可夫链转移概率，在浏览器空闲时预测并预加载用户最可能访问的
   * 下一子应用。默认 true（启用）。
   *
   * 设为 false 可关闭（如内部系统导航模式随机、命中率低时）。
   *
   * @since 4.2.1
   */
  routePreload?: boolean;
  /**
   * 是否启用预加载命中率指标回环上报（v4.4.0）。
   *
   * 周期采样 preloadCount / consumedCount / hitRate 与马尔可夫转移样本量，
   * 经 sendBeacon 上报 `/api/v1/monitor/preload-metrics`，
   * 用于数据驱动验证 route/markov 预测相对 frequency 的增益。
   * 默认 true（启用）。
   *
   * @since 4.4.0
   */
  metricsReporting?: boolean;
  /**
   * 预加载指标采样间隔（毫秒），默认 120_000。
   *
   * @since 4.4.0
   */
  metricsIntervalMs?: number;
}

/**
 * 内核实现必须满足的接口。
 *
 * 内核可以是对应于 qiankun、wujie、自研 micro-kernel 的不同实现。
 * registerKernel / createRuntime 实现内核的可插拔注册与选择。
 */
export interface MicroRuntime {
  /** 注册子应用列表（必须在 start 前调用） */
  registerApps(apps: MicroAppConfig[]): void;

  /**
   * 异步注册子应用列表（v3.7.0 新增）。
   *
   * 调用后可立即返回（不阻塞），内部 await 注册表就绪后自动注册。
   * 用于 'remote' / 'auto' 注册表适配器场景，基座可在注册表拉取完成前渲染骨架。
   *
   * 返回 Promise 在注册完成（或失败回退到静态）后 resolve。
   *
   * @param registry - 注册表配置（adapter / fetcher）
   * @returns 注册完成后的应用配置数组
   */
  registerAppsAsync(registry: {
    adapter: "auto" | "remote" | "static";
    fetcher?: () => Promise<MicroAppEntry[]>;
  }): Promise<MicroAppConfig[]>;

  /** 查询已注册应用 */
  getRegisteredApps(): ReadonlyArray<MicroAppConfig>;

  /** 启动微前端运行时 */
  start(options?: StartOptions): void;

  /**
   * 手动卸载指定子应用（供 tabbar 关闭页签时调用）。
   *
   * 一般内核（qiankun）不暴露此能力，
   * 自研 micro-kernel 可利用此接口实现细粒度页签控制。
   */
  unmountApp(name: string): Promise<UnmountResult>;

  /**
   * 保活控制：切走时不销毁 DOM，切回时直接复用。
   *
   * micro-kernel 原生支持；qiankun adapter 可通过销毁/重建模拟。
   */
  setKeepAlive(name: string, keep: boolean): void;

  /** 路由导航（由内核决定走主应用 router 还是整页跳转） */
  navigateTo(path: string): void;

  /**
   * 手动预加载指定子应用的 ESM 资源（不执行 mount）。
   *
   * 用于 hover 预热等场景：用户悬停菜单链接时提前拉取模块与样式，
   * 后续点击切换时仅差 mount 耗时。已加载的应用会通过浏览器缓存复用，
   * 重复调用安全（幂等）。
   *
   * @returns Promise 在资源加载完成（或失败）时 resolve
   */
  prefetchApp(name: string): Promise<void>;

  /**
   * 添加生命周期钩子。
   *
   * 'error' 钩子签名额外接收错误对象，其它钩子只接收 app。
   * 返回取消订阅函数，组件卸载时调用以避免内存泄漏。
   */
  addLifecycleHook(
    hookName: LifecycleHookName,
    hook: ErrorLifecycleHook | LifecycleHook,
  ): () => void;

  /** 获取当前激活的应用名 */
  getActiveAppName(): null | string;

  /**
   * 运行时更新已挂载子应用的 props（触发子应用 update 生命周期）。
   *
   * 用于主题 / 租户 / locale 等跨应用状态的一键同步，
   * 避免完整卸载-重新挂载的昂贵代价。
   *
   * @param name - 子应用名
   * @param newProps - 新 props（浅合并）
   * @returns 更新是否成功（未注册 / 未挂载 / 无 update 方法返回 false）
   * @since 4.2.1
   */
  updateApp(name: string, newProps: Record<string, unknown>): Promise<boolean>;

  /**
   * 批量更新所有已挂载子应用的 props。
   *
   * @param newProps - 新 props（浅合并到每个已挂载应用）
   * @returns 各应用更新结果 Map<appName, success>
   * @since 4.2.1
   */
  updateAllApps(
    newProps: Record<string, unknown>,
  ): Promise<Record<string, boolean>>;

  /**
   * 获取全部已注册的子应用实例（DevTools / 巡检用）。
   *
   * @returns 子应用实例数组
   * @since 4.2.1
   */
  getAllInstances(): ReadonlyArray<{
    config: MicroAppConfig;
    keepAlive: boolean;
    status: string;
  }>;

  /**
   * 按名称获取子应用实例。
   *
   * @param name - 子应用名
   * @returns 实例或 undefined
   * @since 4.2.1
   */
  getAppInstance(name: string):
    | undefined
    | {
        config: MicroAppConfig;
        keepAlive: boolean;
        status: string;
      };

  /**
   * 向指定子应用发送消息（fire-and-forget）。
   *
   * @param appName - 目标子应用名
   * @param action - 业务 action
   * @param payload - 业务数据
   * @returns 消息 id（用于调试跟踪）
   * @since 4.2.1
   */
  sendToApp(appName: string, action: string, payload?: unknown): string;

  /**
   * 向指定子应用发送请求并 await 响应。
   *
   * @param appName - 目标子应用名
   * @param action - 业务 action
   * @param payload - 业务数据
   * @param timeout - 超时（ms），默认 10000
   * @returns 子应用响应数据
   * @since 4.2.1
   */
  sendRequestToApp<T = unknown, R = unknown>(
    appName: string,
    action: string,
    payload?: T,
    timeout?: number,
  ): Promise<R>;

  /**
   * 注册全局消息监听器（供主应用代码接收来自子应用的消息）。
   *
   * @param handler - 收到消息时回调
   * @returns 取消监听函数
   * @since 4.2.1
   */
  onAppMessage(
    handler: (message: {
      action: string;
      correlationId: string;
      from: string;
      payload: unknown;
    }) => void,
  ): () => void;

  /**
   * 运行时追加单个子应用注册（懒注册）。
   *
   * 用于插件市场 / 动态安装的场景，无需一次性注册全部应用。
   *
   * @param app - 子应用配置
   * @since 4.2.1
   */
  addApp?(app: MicroAppConfig): void;

  /**
   * 启用或禁用全局 KeepAlive。
   *
   * @param enabled - 是否启用保活缓存
   * @since 4.2.1
   */
  setKeepAliveEnabled?(enabled: boolean): void;

  /**
   * 设置指定子应用的"固定"（pin）状态。
   *
   * 固定后的保活实例在 LRU 淘汰时不会被移除（常用应用常驻）。
   *
   * @param name - 子应用名
   * @param pin - 是否固定
   * @since 4.2.1
   */
  setPinnedApp?(name: string, pin: boolean): void;

  /**
   * 统一配置 KeepAlive 策略。
   *
   * @param cfg - KeepAlive 配置（max / ttl / enabled）
   * @since 4.2.1
   */
  configureKeepAlive?(cfg: {
    enabled?: boolean;
    max?: number;
    ttl?: number;
  }): void;
}
