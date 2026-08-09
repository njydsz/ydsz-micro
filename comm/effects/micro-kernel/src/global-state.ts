/**
 * global-state.ts — 全局状态 (globalState) 纯内存 pub-sub 实现
 *
 * 从 kernel.ts 提取的 RawGlobalStateAPI 实现，消除闭包内状态对 createKernel
 * 大函数的耦合，便于独立测试与复用：
 * - 纯内存 pub-sub，不依赖 qiankun initGlobalState
 * - 支持增量广播（仅将变化的 key/value 传给监听器，P1-5）
 * - ADR-006: kernel:state 性能标记
 *
 * 用法：
 *   const api = createGlobalStateAPI();
 *   api.setGlobalState({ theme: 'dark' });
 *
 * @path comm/effects/micro-kernel/src/global-state.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import type { RawGlobalStateAPI } from '@ydsz/micro-runtime';
import { mark } from './performance-utils';

/**
 * 创建全局状态 API 实例。
 *
 * 每次调用返回独立状态，供 createKernel 闭包持有。
 * 与 createKernel 内的实例一一对应，多内核 / HMR 场景互不串扰。
 *
 * 返回值在 RawGlobalStateAPI 基础上扩展 `reset()`，供内核 _stop 场景清空状态。
 */
export function createGlobalStateAPI(): RawGlobalStateAPI & { reset(): void } {
  let _globalState: Record<string, unknown> = {};
  const _globalStateListeners = new Set<
    (state: Record<string, unknown>, prev: Record<string, unknown>) => void
  >();

  return {
    onGlobalStateChange(listener, fireImmediately) {
      _globalStateListeners.add(listener);
      if (fireImmediately) {
        try {
          listener({ ..._globalState }, {});
        } catch {
          /* 静默 */
        }
      }
      // 返回取消订阅函数，防止内存泄漏
      return () => {
        _globalStateListeners.delete(listener);
      };
    },
    setGlobalState(patch) {
      // === ADR-006: kernel:state 标记 ===
      const stateKeys = Object.keys(patch).join(',');
      mark(`kernel:state:${stateKeys}`);
      const prev = { ..._globalState };
      Object.assign(_globalState, patch);
      // P1-5: 增量广播 — 仅将变化的 key/value 传给监听器
      for (const listener of _globalStateListeners) {
        try {
          listener(patch, prev);
        } catch {
          /* 静默 */
        }
      }
    },
    getGlobalState() {
      return { ..._globalState };
    },
    /**
     * 直接获取指定 key 的值（v4.0.1 性能优化）。
     * 避免 getGlobalState() 在热路径中返回完整浅拷贝。
     */
    getState<K extends string>(key: K): Record<string, unknown>[K] {
      return _globalState[key];
    },
    reset() {
      _globalState = {};
      _globalStateListeners.clear();
    },
  };
}