/**
 * 组件性能监控 composable：开发模式下追踪渲染次数与耗时。
 *
 * 设计目标：
 *  - 零生产环境开销（仅在 import.meta.env.DEV 下生效）；
 *  - 统计组件 setup 执行次数与总耗时；
 *  - 当渲染次数超过阈值时 console.warn 告警；
 *  - 为卡片/列表类组件在大数据集定位渲染瓶颈。
 *
 * 使用方式：
 * ```vue
 * <script setup>
 *   useRenderPerformance('YdEntityCard', { threshold: 30 });
 * </script>
 * ```
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\composables\use-render-performance.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { onMounted, onUnmounted } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('RenderPerf');

/** 全局组件渲染统计缓存 */
const perfRegistry = new Map<
  string,
  { count: number; lastWarnAt: number; totalMs: number }
>();

export interface UseRenderPerformanceOptions {
  /** 自定义日志命名空间（默认使用 componentName） */
  label?: string;
  /** 渲染次数告警阈值（默认 30） */
  threshold?: number;
  /** 是否启用耗时统计（默认 true） */
  enableTiming?: boolean;
}

/**
 * 组件性能监控 composable。
 *
 * @param componentName - 组件名（用于日志前缀与统计分组）
 * @param options - 配置选项
 *
 * @example
 * ```vue
 * <script setup name="AgentCard">
 *   // 开发环境渲染超过 20 次即告警
 *   useRenderPerformance('AgentCard', { threshold: 20 });
 * </script>
 * ```
 *
 * @since 1.0.0
 */
export function useRenderPerformance(
  componentName: string,
  options: UseRenderPerformanceOptions = {},
): void {
  const { enableTiming = true, label, threshold = 30 } = options;
  const perfLabel = label ?? componentName;

  // 环境守卫：生产环境不执行任何逻辑
  if (!import.meta.env.DEV) {
    return;
  }

  const startTime = enableTiming ? performance.now() : 0;

  onMounted(() => {
    const entry = perfRegistry.get(perfLabel) ?? {
      count: 0,
      lastWarnAt: 0,
      totalMs: 0,
    };

    entry.count += 1;

    if (enableTiming) {
      // performance.now() 是单调时钟，不受系统时间跳变影响
      entry.totalMs = performance.now() - startTime;
    }

    perfRegistry.set(perfLabel, entry);

    // 超阈值告警（每 10 次告警一次避免刷屏）
    if (entry.count > threshold && entry.count - entry.lastWarnAt >= 10) {
      entry.lastWarnAt = entry.count;
      logger.warn(
        `[Perf] ${perfLabel} 已渲染 ${entry.count} 次（阈值 ${threshold}），建议排查不必要的重渲染。平均耗时 ${entry.totalMs.toFixed(2)}ms`,
      );
    }
  });

  onUnmounted(() => {
    if (!import.meta.env.DEV) return;
    // 开发模式下保留统计信息不反复清零，便于观察源码修改前后的对比
  });
}

/**
 * 获取当前所有已注册组件的性能统计快照（调试用）。
 *
 * @returns 组件名 → 渲染统计的只读映射
 *
 * @since 1.0.0
 */
export function getRenderPerfSnapshot(): ReadonlyMap<
  string,
  Readonly<{ count: number; lastWarnAt: number; totalMs: number }>
> {
  return perfRegistry;
}

/**
 * 手动清空某组件或全部性能统计（调试用，通常在断点或 HMR 回调中调用）。
 *
 * @param componentName - 组件名；为空则清空全部
 *
 * @since 1.0.0
 */
export function resetRenderPerf(componentName?: string): void {
  if (componentName) {
    perfRegistry.delete(componentName);
  } else {
    perfRegistry.clear();
  }
}

// 暴露到 window 便于 DevTools 控制台调试
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__YDSZ_RENDER_PERF__ = {
    getSnapshot: getRenderPerfSnapshot,
    reset: resetRenderPerf,
  };
}
