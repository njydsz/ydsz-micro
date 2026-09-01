/**
 * 生命周期调度器 + 保活控制 + 沙箱策略集成
 *
 * 核心 activate/deactivate 调度逻辑 + 沙箱 mount/unmount。
 * v4.1 P0-A2: 使用 strategy.mount()/cleanup() 替代 if-else 分支。
 *
 * @path comm/effects/micro-kernel/src/lifecycle.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { MountProps, MicroAppConfig } from "@ydsz/micro-runtime";
import type { LoadOptions, LoadResult } from "./loader";
import type { SandboxStrategy } from "./sandbox-strategy";
import type { AppInstance, DeactivateResult, GlobalStateBridge } from "./app-state";
import { createGlobalStateProxy } from "./app-state";
import { createLogger } from "@YDSZ-core/shared/utils";
import { KernelError, KernelErrorCode } from "./error-boundary";
import { recordLoadDuration } from "./health-check";
import { loadApp, removeStylesheets } from "./loader";
import { mark, measure } from "./performance-utils";
import { applyRuntimeCssScope, removeRuntimeCssScope } from "./runtime-css-scope";
import { createSandboxStrategy, type IframeSandboxStrategy, type ProxySandboxStrategy } from "./sandbox-strategy";
import { getContext } from "./app-state";
import { evictKeepAliveIfNeeded } from "./task-queue";

const logger = createLogger("MicroKernel:Lifecycle");

/** 解析容器配置：CSS 选择器或 HTMLElement */
function resolveContainer(container: HTMLElement | string): HTMLElement | null {
  if (typeof container === "string") {
    return document.querySelector(container) as HTMLElement | null;
  }
  return container;
}

/** 全局开关 OR per-app 配置 */
function shouldApplyRuntimeCssScope(config: MicroAppConfig): boolean {
  const ctx = getContext();
  return ctx.styleIsolationEnabled || config.styleIsolation === true;
}

/**
 * 激活子应用：加载 → 挂载。keepAlive 时复用缓存 DOM 直接 appendChild。
 * v4.1 P0-A2: strategy.mount()；v4.2.1 P0-N2: AbortSignal 支持。
 */
export async function activateApp(
  instance: AppInstance, container: HTMLElement,
  loadOpts: LoadOptions = {},
  callbacks: {
    onBeforeMount?: (i: AppInstance, c: HTMLElement) => void;
    onLoaded?: (i: AppInstance) => void;
  } = {},
  globalStateBridge?: GlobalStateBridge, signal?: AbortSignal,
): Promise<void> {
  const { config } = instance;
  const ctx = getContext();

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (instance.status === "MOUNTED") return;

  // keepAlive 复用
  // 必须同时校验 cachedRoot 与 cachedParent：前者是缓存的 DOM，后者标记「已摘离待恢复」。
  // 只看 cachedRoot 会把仍在页面上的实例误判为可恢复，导致 append 一个已在 DOM 树中的节点
  if (
    ctx.keepAliveEnabled &&
    instance.keepAlive &&
    instance.cachedRoot &&
    instance.cachedParent
  ) {
    mark(`kernel:activate:${config.name}:start`);
    container.append(instance.cachedRoot);
    // 置空即「已归还」标记：本次恢复后本轮保活周期结束，
    // 再次激活会走完整挂载路径，避免同一 DOM 被重复 append
    instance.cachedParent = null;
    instance.status = "MOUNTED";
    instance.lastActivatedAt = Date.now();
    instance.strategy?.activate();
    if (instance.exports?.activate) {
      try { await instance.exports.activate(); }
      catch (error) { logger.error(`${config.name} activate hook failed:`, error); }
    }
    // v4.2.1 N6: keep-alive 恢复 hydrate
    // 仅当 cachedState 被显式序列化过才 hydrate：undefined 可能表示
    // 「子应用未提供 serialize」或「序列化失败」，此时传 undefined 会让子应用
    // 误以为要重置为空状态，反而丢数据
    if (instance.exports?.hydrate && instance.cachedState !== undefined) {
      try { await instance.exports.hydrate(instance.cachedState, { container,
        basename: typeof config.activeRule === "string" ? config.activeRule : "/", ...config.props });
      } catch (error) { logger.error(`${config.name} hydrate hook failed:`, error); }
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

  // 加载
  if (!instance.exports) {
    instance.status = "LOADING";
    try {
      const result: LoadResult = await loadApp(config, loadOpts);
      if (signal?.aborted) {
        instance.status = "NOT_LOADED";
        throw new DOMException("Aborted", "AbortError");
      }
      instance.exports = result.exports;
      instance.loadMetrics = { duration: result.duration, fromCache: result.fromCache };
      instance.manifest = result.manifest;
      instance.status = "LOADED";
      recordLoadDuration(config.name, result.duration);
      callbacks.onLoaded?.(instance);
    } catch (error) {
      instance.status = "NOT_LOADED";
      instance.error = String(error);
      throw error;
    }
  }

  // 挂载准备
  const mountProps: MountProps = { container,
    basename: typeof config.activeRule === "string" ? config.activeRule : "/", ...config.props };
  container.dataset.microApp = config.name;
  if (shouldApplyRuntimeCssScope(config)) applyRuntimeCssScope(config.name);

  // v4.1 P0-A2: 创建沙箱策略
  let strategy: SandboxStrategy;
  try {
    strategy = await createSandboxStrategy(instance.sandboxType, config.name, container, config.devUrl);
  } catch (error) {
    instance.status = "LOADED";
    instance.error = String(error);
    throw new KernelError(KernelErrorCode.SANDBOX_ERROR,
      `[MicroKernel] Failed to create sandbox for ${config.name}: ${String(error)}`, error);
  }
  instance.strategy = strategy;
  strategy.mount();

  // 注入沙箱特有能力
  if (strategy.type === "proxy") {
    mountProps.fakeWindow = (strategy as ProxySandboxStrategy).fakeWindow;
  } else if (strategy.type === "iframe") {
    const iframeStrategy = strategy as IframeSandboxStrategy;
    if (iframeStrategy.container) mountProps.container = iframeStrategy.container;
    if (iframeStrategy.contentWindow) mountProps.iframeWindow = iframeStrategy.contentWindow;
    // v3.6.0: globalState 跨 realm 桥接 (代理写入通过 postMessage)
    if (globalStateBridge) {
      const proxy = createGlobalStateProxy(globalStateBridge, iframeStrategy.postToChild);
      mountProps._globalState = proxy;
      iframeStrategy.attachGlobalStateBridge(globalStateBridge, proxy);
    }
  }

  callbacks.onBeforeMount?.(instance, container);

  // === ADR-006: kernel:mount 标记 ===
  mark(`kernel:mount:${config.name}:start`);
  try {
    await instance.exports.mount(mountProps);
    if (signal?.aborted) {
      await instance.exports.unmount(mountProps).catch(() => {});
      strategy.cleanup();
      instance.strategy = null;
      instance.status = "LOADED";
      throw new DOMException("Aborted", "AbortError");
    }
    instance.status = "MOUNTED";
    instance.error = null;
    instance.lastActivatedAt = Date.now();
    mark(`kernel:mount:${config.name}:end`);
    measure(
      `kernel:mount:${config.name}`,
      `kernel:mount:${config.name}:start`,
      `kernel:mount:${config.name}:end`,
    );
    logger.debug(`${config.name} mounted`);
  } catch (error) {
    instance.strategy?.cleanup();
    instance.strategy = null;
    instance.status = "LOADED";
    instance.error = String(error);
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new KernelError(
      KernelErrorCode.MOUNT_ERROR,
      `[MicroKernel] ${config.name} mount failed: ${String(error)}`,
      error,
    );
  }
}

/**
 * 停用子应用。keepAlive 时摘除 DOM，否则完整卸载。
 * v4.1 P0-A2: strategy.unmount()/cleanup()；v4.2.1 P0-N2: AbortSignal。
 */
export async function deactivateApp(
  instance: AppInstance,
  signal?: AbortSignal,
): Promise<DeactivateResult> {
  const { config } = instance;
  const ctx = getContext();

  if (signal?.aborted) return { name: config.name, success: true };
  if (instance.status !== "MOUNTED") return { name: config.name, success: true };

  if (ctx.keepAliveEnabled && instance.keepAlive) {
    const container = resolveContainer(config.container);
    if (container) {
      mark(`kernel:deactivate:${config.name}:start`);
      // 只缓存容器的第一个子节点：子应用 mount 时约定把根节点挂在容器下，
      // 保活不需要记录整棵子树，恢复时 append 这个根即可
      instance.cachedRoot = container.firstElementChild as HTMLElement;
      instance.cachedParent = container;
      // remove() 而非隐藏（display:none）：保留 DOM 会让子应用继续响应
      // 路由、定时器和 IntersectionObserver，且仍参与全局样式计算与查询，
      // 达不到释放的目的
      if (instance.cachedRoot) instance.cachedRoot.remove();
      instance.status = "UNMOUNTED";
      // 用逻辑时钟而非 Date.now()：同一毫秒内缓存多个应用时时间戳会相同，
      // LRU 排序将退化为不确定顺序；自增序号保证严格有序
      instance.keepAliveSince = ctx.keepAliveTimestamp++;
      instance.strategy?.unmount();
      if (instance.exports?.deactivate) {
        try { await instance.exports.deactivate(); }
        catch (error) { logger.error(`${config.name} deactivate hook failed:`, error); }
      }
      // v4.2.1 N6: 序列化应用状态
      if (instance.exports?.serialize) {
        try { instance.cachedState = await instance.exports.serialize(); }
        catch (error) { logger.error(`${config.name} serialize hook failed:`, error); instance.cachedState = undefined; }
      }
      mark(`kernel:deactivate:${config.name}:end`);
      measure(
        `kernel:deactivate:${config.name}`,
        `kernel:deactivate:${config.name}:start`,
        `kernel:deactivate:${config.name}:end`,
      );
      logger.debug(`${config.name} detached (keepAlive)`);

      // P0-P2: LRU 淘汰
      // 必须在本实例入缓存**之后**执行：否则刚缓存的实例不在候选集里，
      // 本次停用不会触发超限淘汰，缓存数会突破 maxKeepAliveApps
      const evicted = await evictKeepAliveIfNeeded(ctx);
      return {
        name: config.name,
        success: true,
        evicted: evicted.length > 0 ? evicted : undefined,
      };
    }
  }

  // 完整卸载
  mark(`kernel:unmount:${config.name}:start`);
  try {
    // 容器已不存在（路由切换时父节点被销毁）时用临时 div 兜底：
    // 子应用 unmount 常会访问 container 做清理，传 null 会引发连锁异常，
    // 使本已失败的场景更难恢复。兜底容器不插入文档，用完即弃
    await instance.exports?.unmount?.({
      container: resolveContainer(config.container) || document.createElement("div"),
      basename: typeof config.activeRule === "string" ? config.activeRule : "/",
    });
    instance.strategy?.cleanup();
    instance.strategy = null;
    const containerEl = resolveContainer(config.container);
    if (containerEl) delete containerEl.dataset.microApp;
    removeRuntimeCssScope(config.name);
    removeStylesheets(config.name);
    instance.exports = null;
    instance.status = "NOT_LOADED";
    instance.error = null;
    mark(`kernel:unmount:${config.name}:end`);
    measure(
      `kernel:unmount:${config.name}`,
      `kernel:unmount:${config.name}:start`,
      `kernel:unmount:${config.name}:end`,
    );
    logger.debug(`${config.name} unmounted`);
    return { name: config.name, success: true };
  } catch (error) {
    instance.strategy?.cleanup();
    instance.strategy = null;
    instance.error = String(error);
    throw new KernelError(
      KernelErrorCode.UNMOUNT_ERROR,
      `[MicroKernel] ${config.name} unmount failed: ${String(error)}`,
      error,
    );
  }
}

/**
 * P1-1: 更新已挂载子应用 props（调用 update 生命周期）。
 * 未挂载或未定义 update 方法时静默忽略。
 */
export async function updateAppProps(
  instance: AppInstance,
  newProps: MountProps,
): Promise<void> {
  if (instance.status !== "MOUNTED" || !instance.exports?.update) return;
  try {
    await instance.exports.update(newProps);
    logger.debug(`${instance.config.name} updated via update lifecycle`);
  } catch (error) {
    logger.error(`${instance.config.name} update lifecycle failed:`, error);
    instance.error = String(error);
  }
}
