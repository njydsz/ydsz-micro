import type { microRuntime } from "#/setup/micro-runtime";

import { enableMicroDevTools, getCanaryManager } from "@ydsz/micro-kernel";
import { setupMonitor } from "@ydsz/monitor";
import { useUserStore } from "@ydsz/stores";

/**
 * 监控与运行期增强模块
 *
 * 负责前端监控（错误捕获 + Web Vitals）、灰度分流（Canary）、
 * DevTools Bridge、会话超时预警、跨标签页同步。
 *
 * 从 bootstrap.ts 拆出（原 v3.1/v4.0 逻辑），保持行为不变。
 *
 * @path main/src/setup/monitoring.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { createLogger } from "@YDSZ-core/shared/utils";

import { useCrossTabSync } from "#/hooks/use-cross-tab-sync";
import { useSessionExpiryWarning } from "#/hooks/use-session-expiry-warning";
import { enableDevToolsBridge } from "#/monitoring/devtools-bridge";

/** 运行时日志器 */
const runtimeLogger = createLogger("MicroRuntime");

/**
 * 安装前端监控（错误捕获 + Web Vitals）。
 * v3.1: 注入 release 版本（sourcemap 关联）+ getUserId（全链路追踪）+ 生产采样
 * v4.0 P0-3: 可选 Sentry 转发（设置 VITE_SENTRY_DSN 时启用）
 */
export function setupAppMonitoring(app: Parameters<typeof setupMonitor>[0]) {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  setupMonitor(app, {
    getUserId: () => {
      try {
        return useUserStore().userInfo?.userId;
      } catch {
        return undefined;
      }
    },
    release:
      import.meta.env.VITE_APP_RELEASE || import.meta.env.VITE_APP_VERSION,
    // 生产环境高频错误采样 80%，开发环境全量
    sampleRate: import.meta.env.PROD ? 0.8 : 1,
    ...(sentryDsn ? { sentryDsn } : {}),
  });
}

/**
 * 初始化灰度分流管理器（有远端 URL 或本地 fallback 配置时启用）。
 * Canary 在首次 prefetch 决策时影响子应用加载哪个版本（stable/canary）。
 */
export async function initCanaryManager() {
  try {
    const remoteUrl = import.meta.env.VITE_CANARY_CONFIG_URL;
    if (remoteUrl || import.meta.env.DEV) {
      await getCanaryManager().init({
        remoteUrl: remoteUrl || undefined,
      });
      runtimeLogger.info("Canary manager initialized");
    }
  } catch (error) {
    runtimeLogger.warn(`Canary init skipped: ${String(error)}`);
  }
}

/**
 * 开发态启用微前端 DevTools 面板（Alt+Shift+M 切换）。
 */
export function initMicroDevTools() {
  if (import.meta.env.DEV) {
    enableMicroDevTools();
  }
}

/**
 * 启用微前端运行时 DevTools Bridge —— 桥接生命周期事件到 Chrome Extension。
 * 启用条件：开发态自动启用；生产态需 localStorage 'micro-kernel:devtools' = '1'
 * kernel 实例在 registerMicroRuntime() 内 createKernel() 时被挂载到 window.__MICRO_KERNEL__
 */
export function initDevToolsBridge(runtime: typeof microRuntime) {
  if (window.__MICRO_KERNEL__) {
    enableDevToolsBridge({
      kernel: window.__MICRO_KERNEL__,
      microRuntime: runtime ?? undefined,
    });
  }
}

/**
 * 会话超时预警 + 跨标签页状态同步。
 * 必须在 initStores 之后、app 挂载之后调用（Pinia 与 effect scope 均已就绪）。
 */
export function setupSessionSync() {
  // E2: 会话超时预警（组件卸载时定时器自动清理）
  useSessionExpiryWarning();

  // F6: 跨标签页状态同步（登出/会话失效联动）
  useCrossTabSync();
}
