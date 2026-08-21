/**
 * 性能追踪器 — 内存采样
 *
 * 从 performance-tracker.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/monitor/src/performance-tracker-memory.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import type { MemorySample } from './performance-tracker-types';

/** 内存采样间隔（ms） */
const MEMORY_SAMPLE_INTERVAL = 5_000;

/** 内存采样数据 */
const memorySamples: MemorySample[] = [];

/** 内存采样定时器 */
let memorySampleTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 采样当前内存状态
 */
function sampleMemory(): MemorySample | null {
  try {
    const perf = performance as unknown as {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    const memory = perf.memory;

    return {
      timestamp: Date.now(),
      jsHeapUsedMB: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
      jsHeapLimitMB: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 0,
      domNodes: document.querySelectorAll('*').length,
      keepAliveCount: 0, // 需要外部注入（scheduler 暴露）
    };
  } catch {
    return null;
  }
}

/**
 * 启动内存采样
 */
export function startMemorySampling(): void {
  if (memorySampleTimer) return;

  memorySampleTimer = setInterval(() => {
    const sample = sampleMemory();
    if (sample) {
      memorySamples.push(sample);
      // 保留最近 100 条
      while (memorySamples.length > 100) {
        memorySamples.shift();
      }
    }
  }, MEMORY_SAMPLE_INTERVAL);

  // 立即采集一次
  const sample = sampleMemory();
  if (sample) memorySamples.push(sample);
}

/**
 * 停止内存采样
 */
export function stopMemorySampling(): void {
  if (memorySampleTimer) {
    clearInterval(memorySampleTimer);
    memorySampleTimer = null;
  }
}

/**
 * 获取内存趋势数据
 */
export function getMemoryTrend(): MemorySample[] {
  return [...memorySamples];
}

/**
 * 设置 keep-alive 实例数（由 scheduler 调用）
 */
export function setKeepAliveCount(count: number): void {
  if (memorySamples.length > 0) {
    memorySamples[memorySamples.length - 1].keepAliveCount = count;
  }
}

/**
 * 清除内存采样数据（供 clearTimeline 调用）
 */
export function clearMemorySamples(): void {
  memorySamples.length = 0;
}
