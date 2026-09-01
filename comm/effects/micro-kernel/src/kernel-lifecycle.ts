/**
 * 内核生命周期管理 — 子应用 mount/unmount/更新 逻辑
 *
 * 从 kernel.ts 提取的应用切换核心逻辑，消除 createKernel 闭包内的超长函数。
 *
 * 包含：
 * - createSwitchToApp: 并发安全的应用切换（含令牌校验 + AbortController 中止机制）
 *
 * 路由同步 (@{link createStartRouterSync}) 已提取至 kernel-router.ts。
 *
 * @path comm/effects/micro-kernel/src/kernel-lifecycle.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { MicroAppConfig, StartOptions } from "@ydsz/micro-runtime";
import type { GlobalStateBridge } from "./scheduler";
import type { LifecycleHookRegistry } from "./lifecycle-hooks";
import type { GlobalStateAPI } from "./global-state";

import { createNamespacedGlobalStateWrapper } from "@ydsz/micro-runtime/namespaced-state";
import { buildStandardMountProps } from "@ydsz/micro-runtime/standard-props";
import { createLogger } from "@YDSZ-core/shared/utils";

import {
  decideDegradationLevel,
  getNextAutoRetryDelay,
  getRetryCount,
  markDegraded,
  renderErrorFallback,
  setRetryCount,
} from "./error-boundary";
import { resolveContainer } from "./kernel-helpers";
import { activateApp, createAppInstance, deactivateApp, getAppInstance } from "./scheduler";
import { registerAppMessageHandler, sendRequest, sendMessage } from "./message-broker";
import { mark, measure } from "./performance-utils";
import { recordRouteTransition } from "./preload-strategy";

/** 模块级日志器 */
const logger = createLogger("MicroKernel:Lifecycle");

/**
 * 生命周期函数所需的闭包状态访问器。
 *
 * 由 createKernel 注入，使本模块的纯函数仍能与闭包状态交互，
 * 同时避免将整个 createKernel 闭包暴露给外部模块。
 */
export interface LifecycleStateAccessors {
  getActiveAppName: () => string | null;
  setActiveAppName: (name: string | null) => void;
  incrementToken: () => number;
  getToken: () => number;
  getAbortController: () => AbortController | null;
  setAbortController: (controller: AbortController | null) => void;
}

/** 生命周期所需的外部依赖（全局状态 + 钩子注册表） */
export interface LifecycleDependencies {
  globalStateAPI: GlobalStateAPI;
  lifecycleHooks: LifecycleHookRegistry;
  recordAppVisit: (appName: string) => void;
  recordPreloadConsumed: (appName: string) => void;
}

/**
 * 创建应用切换函数（switchToApp）。
 *
 * === S3 修复：带令牌的并发安全切换 ===
 * 每次拨动 switchToken，异步操作前后校验令牌是否一致。
 * 若不一致说明已有更晚的切换请求发起，当前操作结果直接丢弃，
 * 避免"后到的 deactivateApp 把刚激活的应用卸载"这类竞态。
 *
 * v4.2.1 P0-N2: 引入 AbortController — 快速连续切换时
 * 中止旧的 deactivate/activate 异步链路。
 *
 * @param state - 闭包状态访问器
 * @param deps - 外部依赖（globalStateAPI / lifecycleHooks）
 * @returns switchToApp 函数
 */
export function createSwitchToApp(
  state: LifecycleStateAccessors,
  deps: LifecycleDependencies,
) {
  /**
   * 切换到指定子应用。
   * 含并发安全校验、AbortController 中止、三级降级决策与完整生命周期事件派发。
   */
  return async function switchToApp(
    config: MicroAppConfig,
    options?: StartOptions,
  ): Promise<void> {
    state.getAbortController?.()?.abort();
    const controller = new AbortController();
    state.setAbortController(controller);
    const signal = controller.signal;

    const token = state.incrementToken();
    const fromApp = state.getActiveAppName();
    if (state.getActiveAppName() === config.name) return;

    if (fromApp) mark(`kernel:route:${fromApp}?${config.name}:start`);

    // 卸载当前
    if (state.getActiveAppName()) {
      const prev = getAppInstance(state.getActiveAppName()!);
      if (prev) {
        await deactivateApp(prev, signal);
        if (token !== state.getToken()) return;
        if (signal.aborted) return;
      }
    }

    const instance = getAppInstance(config.name) || createAppInstance(config);
    const enhancedGlobalState = createNamespacedGlobalStateWrapper(deps.globalStateAPI);

    const standardProps = buildStandardMountProps(config, {
      rawGlobalState: deps.globalStateAPI,
      sendMessage: (action: string, payload?: unknown) => sendMessage(config.name, action, payload),
      sendRequest: <R = unknown>(action: string, payload?: unknown, timeout?: number) =>
        sendRequest(config.name, action, payload, timeout) as Promise<R>,
      registerHandler: <T = unknown, R = unknown>(
        handler: (msg: { action: string; from: string; payload: T }) => Promise<R> | R,
      ) =>
        registerAppMessageHandler(config.name, (msg) =>
          handler({ action: msg.action, payload: msg.payload as T, from: msg.from }),
        ),
      theme: undefined,
      locale: undefined,
      userId: undefined,
    });

    config.props = {
      ...standardProps,
      _globalState: enhancedGlobalState,
      _messageBus: standardProps.messageBus,
    };

    window.dispatchEvent(new CustomEvent("micro-kernel:before-load", { detail: { appName: config.name } }));
    await deps.lifecycleHooks.run("beforeLoad", config);
    if (token !== state.getToken()) return;

    const container = resolveContainer(config.container);
    if (!container) {
      logger.error(`Container "${config.container}" not found for ${config.name}`);
      window.dispatchEvent(
        new CustomEvent("micro-kernel:error", { detail: { appName: config.name, error: "Container not found" } }),
      );
      return;
    }

    try {
      const globalStateBridge: GlobalStateBridge = {
        getGlobalState: () => deps.globalStateAPI.getGlobalState(),
        // patch 经 iframe 跨 realm 通道透传，运行时按 Partial<State> 收窄
        setGlobalState: (patch: unknown) =>
          deps.globalStateAPI.setGlobalState(
            patch as Partial<Record<string, unknown>>,
          ),
        onGlobalStateChange: (listener, fireImmediately) =>
          deps.globalStateAPI.onGlobalStateChange(listener, fireImmediately),
      };

      await activateApp(
        instance,
        container as HTMLElement,
        {},
        {
          onLoaded: (inst) => {
            if (token !== state.getToken() || signal.aborted) return;
            void deps.lifecycleHooks.run("afterLoad", inst.config);
            window.dispatchEvent(
              new CustomEvent("micro-kernel:after-load", { detail: { appName: inst.config.name } }),
            );
          },
          onBeforeMount: (inst) => {
            if (token !== state.getToken() || signal.aborted) return;
            void deps.lifecycleHooks.run("beforeMount", inst.config);
            window.dispatchEvent(
              new CustomEvent("micro-kernel:before-mount", { detail: { appName: inst.config.name } }),
            );
          },
        },
        globalStateBridge,
        signal,
      );
      if (token !== state.getToken()) return;
      if (signal.aborted) return;

      const prevAppName = state.getActiveAppName();
      state.setActiveAppName(config.name);
      deps.recordAppVisit(config.name);
      deps.recordPreloadConsumed(config.name);
      if (prevAppName) recordRouteTransition(prevAppName, config.name);

      if (fromApp) {
        mark(`kernel:route:${fromApp}?${config.name}:end`);
        measure(
          `kernel:route:${fromApp}?${config.name}`,
          `kernel:route:${fromApp}?${config.name}:start`,
          `kernel:route:${fromApp}?${config.name}:end`,
        );
      }
      await deps.lifecycleHooks.run("afterMount", config);
      window.dispatchEvent(
        new CustomEvent("micro-kernel:after-mount", { detail: { appName: config.name } }),
      );
    } catch (error) {
      if ((error instanceof DOMException || error instanceof Error) && error.name === "AbortError") {
        logger.debug(`Switch to ${config.name} aborted by newer request`);
        return;
      }

      logger.error(`Failed to activate ${config.name}:`, error);
      const level = decideDegradationLevel(config.name);

      if (level === "auto-retry") {
        const delay = getNextAutoRetryDelay(config.name);
        setRetryCount(config.name, getRetryCount(config.name) + 1);
        logger.info(`Auto-retry ${config.name} after ${Math.round(delay)}ms (silent)...`);
        setTimeout(() => { void switchToApp(config, options); }, delay);
        return;
      }

      if (level === "show-ui") {
        renderErrorFallback(config, resolveContainer(config.container), () => switchToApp(config, options));
      } else {
        markDegraded(config.name);
        renderErrorFallback(config, resolveContainer(config.container), () => switchToApp(config, options));
      }

      window.dispatchEvent(
        new CustomEvent("micro-kernel:error", { detail: { appName: config.name, error: String(error) } }),
      );
      await deps.lifecycleHooks.runError(config, error);
      if (state.getActiveAppName() === config.name) state.setActiveAppName(null);
    }
  };
}
