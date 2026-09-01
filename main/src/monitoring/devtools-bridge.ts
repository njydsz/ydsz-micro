/**
 * DevTools Bridge —— 桥接 micro-kernel 生命周期事件到 Chrome Extension 调试面板
 *
 * @path main\src\monitoring\devtools-bridge.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import type {
  LifecycleHookName,
  MicroAppConfig,
  MicroRuntime,
  UnmountResult,
} from "@ydsz/micro-runtime";

import { createLogger } from "@YDSZ-core/shared/utils";

const logger = createLogger("DevToolsBridge");

/** 子应用运行时状态快照 */
interface AppInstanceSnapshot {
  config?: { [key: string]: unknown; entry?: string };
  keepAlive?: boolean;
  loadDuration?: number;
  pinned?: boolean;
  sandboxType?: string;
  status: string;
}

/** 内核诊断 API 快照类型（仅 DevTools 使用） */
interface KernelDiagnostics {
  addLifecycleHook?: (
    hookName: LifecycleHookName,
    hook: (app: MicroAppConfig, err?: unknown) => Promise<void> | void,
  ) => () => void;
  getAllInstances?: () => Map<string, AppInstanceSnapshot>;
  getRegisteredApps?: () => ReadonlyArray<MicroAppConfig>;
  healthCheck?: () => { [key: string]: unknown; kernelVersion: string };
  loadApp?: (config: { name: string }) => Promise<unknown>;
  refreshRegistry?: () => void;
  unmountApp?: (name: string) => Promise<UnmountResult>;
}

/** DevTools Bridge 启动配置选项 */
export interface DevToolsBridgeOptions {
  forceEnable?: boolean;
  heartbeatMs?: number;
  kernel: KernelDiagnostics;
  microRuntime?: MicroRuntime;
}

type DiagType =
  | "kernel:memory"
  | "kernel:state:full"
  | "lifecycle:afterLoad"
  | "lifecycle:afterMount"
  | "lifecycle:afterUnmount"
  | "lifecycle:beforeLoad"
  | "lifecycle:beforeMount"
  | "lifecycle:beforeUnmount"
  | "lifecycle:error";

interface KernelStateSnapshot {
  appName: string;
  entry: string;
  keepAlive: boolean;
  loadDuration?: number;
  pinned: boolean;
  sandboxType: string;
  status: string;
}

interface ExtensionCommand {
  payload?: { [key: string]: unknown; appName?: string };
  type: string;
}

interface ExtensionMessage {
  [key: string]: unknown;
  channel: string;
  source: string;
}

interface WindowWithMicroKernel extends Window {
  __MICRO_KERNEL_DEVTOOLS_ENABLED__?: boolean;
  __sendToExtension?: (type: string, payload: unknown) => void;
}

let bridgeActive = false;
let heartbeatTimer: null | ReturnType<typeof setInterval> = null;

function shouldEnable(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem("micro-kernel:devtools") === "1";
  } catch {
    return false;
  }
}

function sendToExtension(type: DiagType, payload: unknown): void {
  try {
    const win = window as WindowWithMicroKernel;
    const sender = win.__sendToExtension;
    if (typeof sender === "function") {
      sender(type, payload);
      return;
    }
    window.postMessage(
      {
        channel: "__YDSZ_MICRO_KERNEL__CHANNEL",
        source: "page",
        type,
        payload,
        _t: Date.now(),
      },
      "*",
    );
  } catch {
    /* 静默失败 */
  }
}

/** Performance memory API 类型扩展 */
interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

function collectFullState(opts: DevToolsBridgeOptions) {
  const kernel = opts.kernel;
  const apps: KernelStateSnapshot[] = [];
  let activeApp: null | string = null;
  let keepAliveCount = 0;

  try {
    const instances = kernel?.getAllInstances?.() ?? new Map();
    for (const [name, inst] of instances) {
      const snap: KernelStateSnapshot = {
        appName: name,
        status: inst?.status || "NOT_LOADED",
        entry: inst?.config?.entry || "",
        sandboxType: inst?.sandboxType || "snapshot",
        loadDuration: inst?.loadDuration,
        keepAlive: !!inst?.keepAlive,
        pinned: !!inst?.pinned,
      };
      apps.push(snap);
      if (snap.keepAlive) keepAliveCount++;
      if (snap.status === "MOUNTED") activeApp = activeApp || name;
    }
  } catch (error) {
    logger.warn("收集状态快照失败", error);
  }

  try {
    const registeredApps = kernel?.getRegisteredApps?.() ?? [];
    for (const reg of registeredApps) {
      if (!apps.find((a) => a.appName === reg.name)) {
        apps.push({
          appName: reg.name,
          status: "NOT_LOADED",
          entry: reg.entry || "",
          sandboxType:
            (reg as { sandboxType?: string }).sandboxType || "snapshot",
          keepAlive: false,
          pinned: false,
        });
      }
    }
  } catch {
    /* noop */
  }

  let memory = "N/A";
  try {
    const perf = performance as PerformanceWithMemory;
    if (perf.memory)
      memory = `${Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)}MB`;
  } catch {
    /* noop */
  }

  return {
    apps,
    activeApp,
    keepAliveCount,
    totalApps: apps.length,
    memory,
    capabilities: {
      kernelVersion: kernel?.healthCheck?.()?.kernelVersion || "4.0.0",
      kernelName: "micro-kernel",
    },
  };
}

/** 未知错误转为可读字符串 */
function errorToMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * 启用 DevTools Bridge，注册内核生命周期钩子与心跳定时器。
 *
 * @param opts Bridge 配置选项
 */
export function enableDevToolsBridge(opts: DevToolsBridgeOptions): void {
  if (bridgeActive) return;
  if (!opts.forceEnable && !shouldEnable()) {
    logger.info("DevTools Bridge 未启用");
    return;
  }

  logger.info("DevTools Bridge 启用中...");
  (window as WindowWithMicroKernel).__MICRO_KERNEL_DEVTOOLS_ENABLED__ = true;

  const kernel = opts.kernel;
  try {
    kernel?.addLifecycleHook?.("beforeLoad", (app: MicroAppConfig) => {
      sendToExtension("lifecycle:beforeLoad", {
        appName: app.name,
        ts: Date.now(),
      });
    });
    kernel?.addLifecycleHook?.("afterLoad", (app: MicroAppConfig) => {
      sendToExtension("lifecycle:afterLoad", {
        appName: app.name,
        ts: Date.now(),
      });
    });
    kernel?.addLifecycleHook?.("beforeMount", (app: MicroAppConfig) => {
      sendToExtension("lifecycle:beforeMount", {
        appName: app.name,
        ts: Date.now(),
      });
    });
    kernel?.addLifecycleHook?.("afterMount", (app: MicroAppConfig) => {
      sendToExtension("lifecycle:afterMount", {
        appName: app.name,
        ts: Date.now(),
      });
      sendToExtension("kernel:state:full", collectFullState(opts));
    });
    kernel?.addLifecycleHook?.("beforeUnmount", (app: MicroAppConfig) => {
      sendToExtension("lifecycle:beforeUnmount", {
        appName: app.name,
        ts: Date.now(),
      });
    });
    kernel?.addLifecycleHook?.("afterUnmount", (app: MicroAppConfig) => {
      sendToExtension("lifecycle:afterUnmount", {
        appName: app.name,
        ts: Date.now(),
      });
      sendToExtension("kernel:state:full", collectFullState(opts));
    });
    kernel?.addLifecycleHook?.("error", (app: MicroAppConfig, err: unknown) => {
      sendToExtension("lifecycle:error", {
        appName: app.name,
        error: errorToMessage(err),
        ts: Date.now(),
      });
    });
  } catch (error) {
    logger.warn("挂载生命周期钩子失败", error);
  }

  const interval = opts.heartbeatMs ?? 5000;
  heartbeatTimer = setInterval(() => {
    try {
      sendToExtension("kernel:state:full", collectFullState(opts));
      const perf = performance as PerformanceWithMemory;
      if (perf.memory) {
        sendToExtension("kernel:memory", {
          usedMB: Math.round(perf.memory.usedJSHeapSize / 1024 / 1024),
          totalMB: Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024),
        });
      }
    } catch {
      /* noop */
    }
  }, interval);

  // 监听 Extension 通过 content-script 转发来的命令
  window.addEventListener("message", (e: MessageEvent<ExtensionMessage>) => {
    if (e.source !== window || !e.data) return;
    if (e.data.channel !== "__YDSZ_MICRO_KERNEL__CHANNEL") return;
    if (e.data.source !== "extension") return;
    handleExtensionCommand(e.data as ExtensionCommand, opts);
  });

  sendToExtension("kernel:state:full", collectFullState(opts));
  bridgeActive = true;
  logger.info(`DevTools Bridge 已启用（心跳 ${interval}ms）`);
}

function handleExtensionCommand(
  msg: ExtensionCommand,
  opts: DevToolsBridgeOptions,
): void {
  const { type, payload } = msg;
  const kernel = opts.kernel;
  switch (type) {
    case "kernel:clear-cache": {
      try {
        if (typeof caches !== "undefined") {
          caches
            .keys()
            .then((names) => Promise.all(names.map((n) => caches.delete(n))));
        }
        sendToExtension("kernel:event", {
          eventName: "cache-cleared",
          ts: Date.now(),
        });
      } catch (error: unknown) {
        sendToExtension("lifecycle:error", {
          appName: "*",
          error: errorToMessage(error),
        });
      }
      break;
    }
    case "kernel:health:request": {
      let health: {
        [key: string]: unknown;
        error?: string;
        kernelVersion?: string;
      } = { error: "kernel 不支持 healthCheck" };
      try {
        health = kernel?.healthCheck?.() ?? health;
      } catch (error: unknown) {
        health = { error: errorToMessage(error) };
      }
      sendToExtension("kernel:health:response", health);
      break;
    }
    case "kernel:refresh-registry": {
      try {
        kernel?.refreshRegistry?.();
        sendToExtension("kernel:state:full", collectFullState(opts));
      } catch (error: unknown) {
        sendToExtension("lifecycle:error", {
          appName: "*",
          error: errorToMessage(error),
        });
      }
      break;
    }
    case "kernel:reload": {
      const appName = payload?.appName;
      if (appName && kernel?.loadApp) {
        kernel
          .loadApp({ name: appName })
          .then(() =>
            sendToExtension("kernel:state:full", collectFullState(opts)),
          )
          .catch((error: unknown) =>
            sendToExtension("lifecycle:error", {
              appName,
              error: errorToMessage(error),
            }),
          );
      }
      break;
    }
    case "kernel:state:request": {
      sendToExtension("kernel:state:full", collectFullState(opts));
      break;
    }
    case "kernel:unmount": {
      const name = payload?.appName;
      if (name && kernel?.unmountApp) {
        kernel
          .unmountApp(name)
          .then(() =>
            sendToExtension("kernel:state:full", collectFullState(opts)),
          )
          .catch((error: unknown) =>
            sendToExtension("lifecycle:error", {
              appName: name,
              error: errorToMessage(error),
            }),
          );
      }
      break;
    }
    default: {
      logger.warn(`[DevTools] 未知命令: ${type}`);
    }
  }
}

/**
 * 禁用 DevTools Bridge，清理心跳定时器并重置状态。
 */
export function disableDevToolsBridge(): void {
  if (!bridgeActive) return;
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  (window as WindowWithMicroKernel).__MICRO_KERNEL_DEVTOOLS_ENABLED__ = false;
  bridgeActive = false;
}

/**
 * 查询 DevTools Bridge 是否处于活跃状态。
 *
 * @returns 当前是否已启用
 */
export function isDevToolsBridgeActive(): boolean {
  return bridgeActive;
}
