/**
 * 内核健康检查 — healthCheck() / healthCheckAsync() 方法体
 *
 * 从 kernel.ts 提取的健康检查逻辑：
 * - healthCheck: 同步返回基础健康信息（向后兼容）
 * - healthCheckAsync: 异步深度健康检查（ping 探测 + 内存估算）
 *
 * @path comm/effects/micro-kernel/src/kernel-health.ts
 * @author ydsz-team
 * @since 4.2.1
 */


import { getAllInstances } from "./scheduler";

/** 模块级日志器 */
/**
 * 健康检查所需的依赖。
 */
export interface HealthCheckContext {
  /** 获取已注册的应用列表数量 */
  getRegisteredAppsCount: () => number;
}

/**
 * 内核健康检查结果（同步）。
 */
export interface KernelHealthInfo {
  kernelVersion: string;
  kernelName: string;
  capabilities: {
    sandbox: readonly string[];
    prefetch: boolean;
    keepAlive: boolean;
    hmr: boolean;
    healthCheckAsync: true;
  };
  metrics: {
    activeApps: number;
    keepAliveCount: number;
    registeredApps: number;
  };
}

/**
 * 创建内核 healthCheck() / healthCheckAsync() 方法体。
 *
 * @param ctx - 健康检查上下文
 * @returns 含 healthCheck 和 healthCheckAsync 的对象
 */
export function createHealthCheckFunctions(ctx: HealthCheckContext) {
  /**
   * 内核健康检查（P1-1 增强版 v4.2）。
   *
   * 同步返回基础信息（兼容旧版调用方）；
   * async 模式下会执行 ping 探测 + 内存估算（需 await healthCheckAsync()）。
   */
  function healthCheck(): KernelHealthInfo {
    const all = getAllInstances();
    let ka = 0;
    for (const i of all) if (i.keepAlive && i.status === "MOUNTED") ka++;
    return {
      kernelVersion: "4.2.1",
      kernelName: "micro-kernel",
      capabilities: {
        sandbox: ["snapshot", "proxy", "iframe"] as const,
        prefetch: true,
        keepAlive: true,
        hmr: !!import.meta.env?.DEV,
        healthCheckAsync: true as const,
      },
      metrics: {
        activeApps: all.length,
        keepAliveCount: ka,
        registeredApps: ctx.getRegisteredAppsCount(),
      },
    };
  }

  /**
   * 异步深度健康检查（v4.2 P1-1 新增）。
   *
   * 执行实际 ping 探测 + 内存估算，返回完整健康报告。
   * 节流：内部 30s 间隔，高频调用会快速返回。
   */
  async function healthCheckAsync(options?: { force?: boolean; skipPing?: boolean }) {
    // 延迟导入避免循环依赖
    const { runHealthCheck } = await import("./health-check");
    const allInstances = getAllInstances();
    const apps = allInstances.map((i) => ({
      config: { name: i.config.name, entry: i.config.entry },
      status: i.status,
      loadMetrics: i.loadMetrics ?? undefined,
    }));
    return runHealthCheck(apps, options);
  }

  return { healthCheck, healthCheckAsync };
}
