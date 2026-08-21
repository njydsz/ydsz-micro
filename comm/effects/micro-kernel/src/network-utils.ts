/**
 * 网络条件感知工具函数
 *
 * 从 preload-strategy.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/network-utils.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { PrefetchStrategy } from './preload-types';

/**
 * 网络条件感知 — 判断当前是否处于弱网/省流量环境。
 *
 * 依据 Network Information API（navigator.connection）：
 *   - effectiveType 为 slow-2g / 2g / 3g 视为慢速网络
 *   - saveData 为 true 表示用户开启省流量模式
 *
 * 任一命中即视为弱网。浏览器不支持 Network Information API 时返回 false。
 *
 * 注意：与 kernel.ts 中 `shouldSkipPrefetchDueToNetwork` 语义一致，
 * 此处导出便于 preload-strategy 在 lazy 模式下复用，避免逻辑重复。
 */
export function isSlowNetwork(): boolean {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  };
  const conn = nav.connection;
  if (!conn) return false;

  if (conn.saveData === true) return true;

  const effectiveType = conn.effectiveType;
  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    return true;
  }

  return false;
}

/**
 * 根据 prefetchStrategy 判定是否应执行预加载。
 *
 * - `eager`：始终返回 true（立即预加载，不感知网络）
 * - `lazy`：弱网时返回 false，否则返回 true（交由调用方再走 idle 调度）
 * - `never`：始终返回 false
 *
 * 未传入时按 `lazy` 处理，与既有 P2 网络条件感知默认行为保持一致。
 */
export function shouldPrefetchByStrategy(strategy?: PrefetchStrategy): boolean {
  switch (strategy ?? 'lazy') {
    case 'eager':
      return true;
    case 'never':
      return false;
    case 'lazy':
    default:
      return !isSlowNetwork();
  }
}
