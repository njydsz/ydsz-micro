/**
 * global-state.ts — 全局状态 (globalState) 纯内存 pub-sub 实现
 *
 * 从 kernel.ts 提取的 RawGlobalStateAPI 实现，消除闭包内状态对 createKernel
 * 大函数的耦合，便于独立测试与复用：
 * - 纯内存 pub-sub，不依赖 qiankun initGlobalState
 * - 支持键级订阅（仅当订阅的 key 变化时通知，P0-3）
 * - ADR-006: kernel:state 性能标记
 *
 * 用法：
 *   const api = createGlobalStateAPI();
 *   api.setGlobalState({ theme: 'dark' });
 *   api.onKeyChange('theme', (val, prev) => console.log(val, prev));
 *
 * @path comm/effects/micro-kernel/src/global-state.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import type { RawGlobalStateAPI } from "@ydsz/micro-runtime";

import { mark } from "./performance-utils";

/** 变化监听器类型 */
type ChangeListener<T> = (state: T, prev: T) => void;

/** 键级变化监听器类型 */
type KeyChangeListener<K, V> = (value: V, prevValue: V, key: K) => void;

/**
 * 创建全局状态 API 实例。
 *
 * 每次调用返回独立状态，供 createKernel 闭包持有。
 * 与 createKernel 内的实例一一对应，多内核 / HMR 场景互不串扰。
 *
 * 返回值在 RawGlobalStateAPI 基础上扩展：
 * - `onKeyChange` — 键级订阅（P0-3）
 * - `reset()` — 供内核 _stop 场景清空状态
 *
 * @example
 * ```ts
 * const api = createGlobalStateAPI<{ theme: string; lang: string }>();
 * // 传统监听（兼容 qiankun API）
 * api.onGlobalStateChange((state, prev) => { ... });
 * // 键级订阅（新 API）
 * const unsub = api.onKeyChange('theme', (val, prev, key) => {
 *   console.log(`theme changed from ${prev} to ${val}`);
 * });
 * api.setGlobalState({ theme: 'dark' }); // 仅通知 theme 的订阅者
 * ```
 */
export function createGlobalStateAPI<
  T = Record<string, unknown>,
>(): RawGlobalStateAPI<T> & {
  onKeyChange<K extends keyof T & string>(
    key: K,
    listener: KeyChangeListener<K, T[K]>,
    fireImmediately?: boolean,
  ): () => void;
  reset(): void;
} {
  let _globalState: T = {} as T;

  // 传统全局监听器（向后兼容）
  const _globalStateListeners = new Set<ChangeListener<T>>();

  // 键级监听器（P0-3：增量广播核心）
  const _keyListeners = new Map<
    keyof T & string,
    Set<KeyChangeListener<keyof T & string, unknown>>
  >();

  return {
    onGlobalStateChange(listener, fireImmediately) {
      _globalStateListeners.add(listener);
      if (fireImmediately) {
        try {
          listener({ ..._globalState }, {} as T);
        } catch {
          /* 静默 */
        }
      }
      // 返回取消订阅函数，防止内存泄漏
      return () => {
        _globalStateListeners.delete(listener);
      };
    },

    onKeyChange<K extends keyof T & string>(
      key: K,
      listener: KeyChangeListener<K, T[K]>,
      fireImmediately?: boolean,
    ) {
      let listeners = _keyListeners.get(key);
      if (!listeners) {
        listeners = new Set();
        _keyListeners.set(key, listeners);
      }
      // 需要包装为 unknown 类型以适配 Map 存储
      listeners.add(listener as KeyChangeListener<keyof T & string, unknown>);

      if (fireImmediately) {
        try {
          (listener as KeyChangeListener<keyof T & string, unknown>)(
            _globalState[key],
            undefined as unknown as T[K],
            key,
          );
        } catch {
          /* 静默 */
        }
      }
      return () => {
        listeners?.delete(
          listener as KeyChangeListener<keyof T & string, unknown>,
        );
        if (listeners && listeners.size === 0) {
          _keyListeners.delete(key);
        }
      };
    },

    setGlobalState(patch) {
      // === ADR-006: kernel:state 标记 ===
      const stateKeys = Object.keys(patch as object).join(",");
      mark(`kernel:state:${stateKeys}`);

      const prev = { ..._globalState };
      const changedKeys = new Set<keyof T & string>();

      // 应用变更并记录实际变化的 keys
      for (const key in patch as object) {
        if (Object.prototype.hasOwnProperty.call(patch, key)) {
          const newValue = (patch as T)[key];
          const oldValue = _globalState[key];
          if (newValue !== oldValue) {
            (_globalState as Record<string, unknown>)[key as string] = newValue;
            changedKeys.add(key);
            // === P0-3: 键级通知 — 仅通知订阅了该 key 的监听器 ===
            const listeners = _keyListeners.get(key);
            if (listeners) {
              for (const listener of listeners) {
                try {
                  listener(newValue as unknown, oldValue as unknown, key);
                } catch {
                  /* 静默 */
                }
              }
            }
          }
        }
      }

      // === 传统全局监听器：仅在实际有变化时通知 ===
      if (_globalStateListeners.size > 0 && changedKeys.size > 0) {
        const changedPatch = {} as Partial<T>;
        for (const key of changedKeys) {
          (changedPatch as Record<string, unknown>)[key as string] =
            _globalState[key];
        }
        for (const listener of _globalStateListeners) {
          try {
            listener(changedPatch as T, prev);
          } catch {
            /* 静默 */
          }
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
    getState<K extends string>(key: K): T[K] {
      return _globalState[key as unknown as keyof T];
    },

    reset() {
      _globalState = {} as T;
      _globalStateListeners.clear();
      _keyListeners.clear();
    },
  };
}
