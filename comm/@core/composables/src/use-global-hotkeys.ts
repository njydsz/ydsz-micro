/**
 * 全局快捷键组合式函数。
 *
 * 基于 VueUse 的 useMagicKeys 封装，提供跨平台（Mac/Windows）的快捷键注册。
 * 自动处理 Cmd（Mac）/ Ctrl（Windows）键位映射。
 *
 * @path comm\@core\composables\src\use-global-hotkeys.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @example
 * ```ts
 * import { useGlobalHotkeys } from '@ydsz-core/composables';
 *
 * const { register, unregister } = useGlobalHotkeys();
 *
 * // 注册 Ctrl+K 打开搜索
 * register('mod+k', () => {
 *   openSearch();
 * });
 *
 * // 组件卸载时注销
 * onUnmounted(() => unregister());
 * ```
 */
import { onUnmounted, watch } from 'vue';

import { useMagicKeys, type UseMagicKeysOptions } from '@vueuse/core';

/**
 * 快捷键配置。
 */
export interface HotkeyConfig {
  /**
   * 快捷键组合，如 'mod+k'、'mod+shift+n'、'esc'。
   * - mod：自动映射为 Mac 的 Cmd / Windows 的 Ctrl
   * - shift：Shift 键
   * - alt：Alt 键
   * - meta：Meta 键（Windows 键）
   * - 字母/数字：对应键位
   */
  combo: string;

  /**
   * 触发时的回调函数。
   */
  handler: (event: KeyboardEvent) => void;

  /**
   * 是否阻止默认行为（默认 true）。
   */
  preventDefault?: boolean;

  /**
   * 是否只在输入框外生效（默认 false）。
   */
  ignoreInputs?: boolean;
}

const inputTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * 判断事件目标是否为输入元素。
 */
function isInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (inputTags.has(target.tagName)) {
    return true;
  }
  // 检查 contenteditable
  return target.isContentEditable;
}

/**
 * 全局快捷键组合式函数。
 *
 * @param options - useMagicKeys 配置
 * @returns register（注册快捷键）、unregister（注销快捷键）
 */
export function useGlobalHotkeys(options: UseMagicKeysOptions = {}) {
  const { reactive: _reactive, ...restOptions } = options;

  // 存储所有注册的快捷键
  const registeredHandlers = new Map<string, HotkeyConfig>();

  // 为每个快捷键创建独立的 magicKeys 实例
  const keyRefs = new Map<string, ReturnType<typeof useMagicKeys>>();

  function register(config: HotkeyConfig) {
    const { combo, handler, preventDefault = true, ignoreInputs = false } = config;
    registeredHandlers.set(combo, config);

    // 创建 magicKeys 实例并监听
    const keys = useMagicKeys({
      ...restOptions,
      passive: false,
    });
    keyRefs.set(combo, keys);

    // 监听 combo 键位
    const keyCombo = keys[combo];
    if (keyCombo) {
      // 使用 watch 监听键位变化
      watch(keyCombo, (pressed) => {
        if (pressed && registeredHandlers.has(combo)) {
          const event = new KeyboardEvent('keydown', {
            key: combo,
          });
          if (ignoreInputs && isInputTarget(event.target)) {
            return;
          }
          if (preventDefault) {
            event.preventDefault();
          }
          handler(event);
        }
      });
    }
  }

  function unregister(combo?: string) {
    if (combo) {
      registeredHandlers.delete(combo);
      keyRefs.delete(combo);
    } else {
      registeredHandlers.clear();
      keyRefs.clear();
    }
  }

  onUnmounted(() => {
    unregister();
  });

  return {
    register,
    unregister,
  };
}
