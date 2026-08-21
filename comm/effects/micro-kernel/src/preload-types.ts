/**
 * 预加载策略类型定义
 *
 * 从 preload-strategy.ts 提取的类型定义，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/preload-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 应用使用频率统计 */
export interface AppUsageStats {
  /** 应用名称 */
  appName: string;
  /** 访问次数 */
  visitCount: number;
  /** 最后访问时间 */
  lastVisitTime: number;
  /** 平均访问间隔（ms） */
  averageInterval: number;
}

/** 权限检查函数类型 */
export type PermissionChecker = (codes: string[]) => boolean;

/** 预加载优先级 */
export type PreloadPriority = 'high' | 'medium' | 'low';

/** 预加载策略类型 */
export type PreloadStrategy = 'idle' | 'hover' | 'visibility' | 'route' | 'manual' | 'permission' | 'frequency';

/**
 * 预加载模式（prefetchStrategy）。
 *
 * 与上面按触发时机划分的 PreloadStrategy（idle/hover/visibility/...）正交，
 * prefetchStrategy 控制的是"是否预加载"以及"何时预加载"的高层语义：
 * - `eager`：立即预加载（忽略 idle 调度与网络条件），即当前默认行为
 * - `lazy`：仅 idle 时预加载，弱网（slow-2g/2g/3g 或 saveData）时不预加载
 * - `never`：不预加载
 *
 * 配合 `shouldPrefetchByStrategy()` 在 kernel.ts 的 start() 预加载分支复用
 * 既有的网络条件感知逻辑（shouldSkipPrefetchDueToNetwork）。
 */
export type PrefetchStrategy = 'eager' | 'lazy' | 'never';

/** PrefetchStrategy 配置项（用于 start options 与运行时复用） */
export interface PrefetchStrategyConfig {
  /** 预加载模式，默认 'lazy' */
  prefetchStrategy?: PrefetchStrategy;
}

/** 预加载策略配置 */
export interface PreloadStrategyOptions {
  /** 策略类型 */
  strategy: PreloadStrategy;
  /** 预加载延迟（毫秒），仅 idle 策略使用 */
  idleTimeout?: number;
  /** 预加载回调 */
  onPreload?: (appName: string) => void | Promise<void>;
  /** 权限码（permission 策略使用） */
  permissionCodes?: string[];
  /** 预加载优先级（frequency 策略使用） */
  priority?: PreloadPriority;
}
