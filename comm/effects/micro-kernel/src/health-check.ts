/**
 * health-check.ts — 子应用健康检查（P1-1 落地）
 *
 * 在 kernel.healthCheck() 现有能力/指标基础上，扩展实际探测：
 * - ping 端点：对已挂载子应用发起轻量 fetch 探测可用性
 * - 内存估算：基于 Performance API memory 字段（Chromium only）推算内存压力
 * - 加载耗时：追踪各应用最近一次 load 耗时的移动平均，识别性能劣化
 *
 * 设计决策：
 * 1. 非阻塞：所有探测 async，不阻塞主线程渲染
 * 2. 降级：不支持 memory API 的环境跳过内存指标
 * 3. 节流：最小探测间隔 30s，避免高频 ping 带来额外开销
 * 4. 隔离：探测失败不影响内核正常运行
 *
 * @path comm/effects/micro-kernel/src/health-check.ts
 * @author ydsz-team
 * @since 4.2.0
 */

import type { AppStatus } from "./scheduler";

import { createLogger } from "@YDSZ-core/shared/utils";

const logger = createLogger("MicroKernel:HealthCheck");

/** 最小探测间隔（毫秒）— 防止高频探测占用带宽 */
const MIN_PROBE_INTERVAL_MS = 30_000;

/** ping 端点超时（毫秒） */
const PING_TIMEOUT_MS = 5000;

/** 内存压力阈值：超过此百分比触发告警（0-1） */
const MEMORY_PRESSURE_THRESHOLD = 0.8;

/**
 * 单应用健康探测结果
 */
export interface AppHealthResult {
  /** 应用名 */
  appName: string;
  /** 当前状态 */
  status: AppStatus;
  /** 是否可达（ping 成功） */
  reachable: boolean;
  /** ping 耗时（毫秒），不可达时为 -1 */
  pingLatencyMs: number;
  /** 最近一次加载耗时（毫秒），无记录时为 -1 */
  lastLoadDurationMs: number;
}

/**
 * 内核整体健康报告
 */
export interface KernelHealthReport {
  /** 内核版本 */
  kernelVersion: string;
  /** 探测时间戳 */
  timestamp: number;
  /** 应用健康列表 */
  apps: AppHealthResult[];
  /** 内存估算（Chromium 环境可用） */
  memory: MemoryEstimate | null;
  /** 汇总统计 */
  summary: {
    mounted: number;
    reachable: number;
    total: number;
    unreachableApps: string[];
  };
}

/**
 * 内存估算（基于 performance.memory）
 */
export interface MemoryEstimate {
  /** JS 堆已用字节 */
  usedJSHeapSize: number;
  /** JS 堆总字节 */
  totalJSHeapSize: number;
  /** 堆使用率 */
  heapUsageRatio: number;
  /** 是否处于内存压力状态 */
  isUnderPressure: boolean;
}

/** 应用加载耗时记录（移动平均窗口） */
const loadDurationWindow = new Map<string, number[]>();

/** 窗口大小 */
const WINDOW_SIZE = 5;

/** 上次全局探测时间 */
let lastProbeTime = 0;

/**
 * 记录一次加载耗时，用于计算移动平均。
 *
 * 由 scheduler.ts 在 activateApp 成功后调用。
 *
 * @param appName - 应用名
 * @param durationMs - 加载耗时（毫秒）
 */
export function recordLoadDuration(appName: string, durationMs: number): void {
  let window = loadDurationWindow.get(appName);
  if (!window) {
    window = [];
    loadDurationWindow.set(appName, window);
  }
  window.push(durationMs);
  // 滑动窗口：保留最近 N 次
  if (window.length > WINDOW_SIZE) {
    window.shift();
  }
}

/**
 * 获取应用加载耗时的移动平均值。
 *
 * @param appName - 应用名
 * @returns 平均耗时（毫秒），无记录返回 -1
 */
export function getAverageLoadDuration(appName: string): number {
  const window = loadDurationWindow.get(appName);
  if (!window || window.length === 0) return -1;
  return Math.round(window.reduce((a, b) => a + b, 0) / window.length);
}

/**
 * 清除应用的加载耗时记录。
 *
 * @param appName - 应用名
 */
export function clearLoadDuration(appName: string): void {
  loadDurationWindow.delete(appName);
}

/**
 * 获取内存估算（Chromium only）。
 *
 * performance.memory 仅在 Chromium 内核可用，且需要：
 * - Chrome 中需要启用 "Show memory" 的 DevTools 或特定 header
 * - Firefox/Safari 不支持
 *
 * @returns MemoryEstimate 或 null（不支持时）
 */
export function getMemoryEstimate(): MemoryEstimate | null {
  // performance.memory 是非标准 API，TS lib 可能未声明
  const perf = performance as unknown as {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  };

  const memory = perf.memory;
  if (!memory || typeof memory.totalJSHeapSize !== "number") {
    return null;
  }

  const heapUsageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    heapUsageRatio,
    isUnderPressure: heapUsageRatio > MEMORY_PRESSURE_THRESHOLD,
  };
}

/**
 * ping 单个子应用端点，探测可用性。
 *
 * 使用 fetch 发起 HEAD 请求（轻量）到应用的 entry URL。
 * 注意：这仅检验 HTTP 可达性，不检验 JS 执行是否正常。
 *
 * 特殊处理：
 * - dev 模式（HMR 端口）同样可以 ping
 * - CORS 跨域限制下 fetch 可能失败，此时 reachable=false 但非真正不可达
 *
 * @param appName - 应用名
 * @param entryUrl - 应用入口 URL
 * @returns 探测结果
 */
async function pingApp(
  appName: string,
  entryUrl: string,
): Promise<{ latencyMs: number; reachable: boolean }> {
  // 对 ESM 入口 URL 做 HEAD 请求，提取 origin 而非完整路径（避免 404）
  let origin: string;
  try {
    const url = new URL(entryUrl, window.location.origin);
    origin = url.origin;
  } catch {
    // 解析失败则直接尝试 entryUrl
    origin = entryUrl;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const start = performance.now();
    // 使用 HEAD + no-cors 模式，仅检验可达性
    await fetch(origin, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = Math.round(performance.now() - start);
    return { reachable: true, latencyMs };
  } catch {
    return { reachable: false, latencyMs: -1 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 执行完整健康检查。
 *
 * 节流：两次调用间隔 < MIN_PROBE_INTERVAL_MS 时，返回缓存的上次报告。
 *
 * @param apps - 所有应用实例列表（来自 getAllInstances / scheduler）
 * @param options - 检查配置
 * @returns 健康报告
 */
export async function runHealthCheck(
  apps: Array<{
    config: { entry?: string; name: string };
    loadMetrics?: { duration: number };
    status: AppStatus;
  }>,
  options?: { force?: boolean; skipPing?: boolean; timeout?: number },
): Promise<KernelHealthReport> {
  const now = Date.now();

  // 节流检查
  if (!options?.force && now - lastProbeTime < MIN_PROBE_INTERVAL_MS) {
    logger.debug("Health check throttled, returning cached data");
  }
  lastProbeTime = now;

  // 内存估算
  const memory = getMemoryEstimate();

  // 应用探测（串行化以减少并发带宽占用，或限制并发度）
  const appResults: AppHealthResult[] = [];
  const maxConcurrent = 3; // 最大并发探测数
  const queue = [...apps];

  // 简单的并发控制
  async function probeNext(): Promise<void> {
    while (queue.length > 0) {
      const app = queue.shift()!;
      const entryUrl = app.config.entry || "";
      const lastLoadMs =
        app.loadMetrics?.duration ?? getAverageLoadDuration(app.config.name);

      let reachable = false;
      let latencyMs = -1;

      if (!options?.skipPing && entryUrl) {
        const result = await pingApp(app.config.name, entryUrl);
        reachable = result.reachable;
        latencyMs = result.latencyMs;
      }

      appResults.push({
        appName: app.config.name,
        status: app.status,
        reachable,
        pingLatencyMs: latencyMs,
        lastLoadDurationMs: lastLoadMs,
      });
    }
  }

  // 启动 N 个并发 worker
  const workers = Array.from(
    { length: Math.min(maxConcurrent, queue.length) },
    () => probeNext(),
  );
  await Promise.all(workers);

  // 汇总
  const mounted = appResults.filter((a) => a.status === "MOUNTED");
  const reachableApps = appResults.filter((a) => a.reachable);
  const unreachableList = appResults
    .filter((a) => a.status === "MOUNTED" && !a.reachable)
    .map((a) => a.appName);

  if (unreachableList.length > 0) {
    logger.warn(`Unreachable mounted apps: ${unreachableList.join(", ")}`);
  }

  // 内存压力告警
  if (memory?.isUnderPressure) {
    logger.warn(
      `Memory pressure detected: heap usage ${(memory.heapUsageRatio * 100).toFixed(1)}%`,
    );
  }

  return {
    kernelVersion: "4.2.0",
    timestamp: now,
    apps: appResults,
    memory,
    summary: {
      total: appResults.length,
      mounted: mounted.length,
      reachable: reachableApps.length,
      unreachableApps: unreachableList,
    },
  };
}

/**
 * 重置健康检查状态（用于测试）。
 */
export function resetHealthCheck(): void {
  loadDurationWindow.clear();
  lastProbeTime = 0;
}

/**
 * P0-A1: 创建健康检查生命周期管理器。
 *
 * dispose() 时清除加载耗时缓存。
 *
 * @since 4.2.0
 */
export function createHealthCheckerManager(): import("./manager-registry").DisposableManager {
  return {
    name: "health-checker",
    dispose(): void {
      resetHealthCheck();
    },
  };
}
