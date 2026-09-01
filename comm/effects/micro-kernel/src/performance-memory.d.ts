/**
 * 非标准 Performance API 类型声明（v4.4.1）。
 *
 * <p>声明两类 API：
 * 1. `Performance.memory` —— Chromium 私有 API（已废弃但仍在用），
 *    提供 JS 堆占用与上限的同步查询。
 * 2. `Performance.measureMemory()` —— W3C 标准提案，
 *    提供异步的标准化内存测量（Chrome 128+）。
 *
 * @path comm/effects/micro-kernel/src/performance-memory.d.ts
 * @author ydsz-team
 * @since 4.4.1
 */

/**
 * Chromium 私有 Performance.memory 对象。
 *
 * @deprecated 该 API 已被 W3C 废弃，仅作为 measureMemory() 不可用时的回退路径。
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
 */
export interface MemoryInfo {
  /** JS 堆大小上限（字节） */
  jsHeapSizeLimit: number;
  /** 已使用的 JS 堆大小（字节） */
  usedJSHeapSize: number;
  /** 总 JS 堆大小（字节） */
  totalJSHeapSize?: number;
}

/**
 * Performance.measureMemory() 的选项参数。
 *
 * @see https://wicg.github.io/performance-measure-memory/
 */
export interface MeasureMemoryOptions {
  /** 是否启用跨源归因（需 crossOriginIsolated） */
  attribution?: boolean;
}

/**
 * Performance.measureMemory() 的返回结果。
 */
export interface MeasureMemoryResult {
  /** 总内存占用（字节） */
  bytes: number;
  /** 详细归因信息（可选） */
  attribution?: Array<{
    url?: string;
    scope?: string;
    container?: { id?: string; src?: string };
    bytes?: number;
  }>;
}

/**
 * 扩展的 Performance 接口（包含非标准 API）。
 *
 * 在 @ydsz/micro-kernel 内部使用，避免在业务代码中直接扩散 any / 双重断言。
 */
export interface ExtendedPerformance extends Performance {
  /** Chromium 私有内存信息 API */
  memory?: MemoryInfo;
  /** W3C 提案：异步测量内存 */
  measureMemory?: (options?: MeasureMemoryOptions) => Promise<MeasureMemoryResult>;
}

// 全局 Window 接口扩展：仅在本模块内通过类型导入使用
declare global {
  interface Window {
    performance: ExtendedPerformance;
  }
}

// 确保文件被视为模块（而非脚本/全局声明文件）
export {};
