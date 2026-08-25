/**
 * use-keyboard-shortcut 组合式函数 — 键盘快捷键体系
 *
 * @path comm\effects\shared-business\src\composables\use-keyboard-shortcut.ts
 * @author ydsz-team
 * @since 1.1.0
 *
 * @remarks
 * 提供键盘快捷键注册能力，支持：
 * - 组合键（Ctrl/Shift/Alt/Meta + key）
 * - 作用域隔离（scope）：不同页面可注册同名快捷键互不冲突
 * - 冲突检测：同一作用域内重复注册会告警
 * - 自动清理：组件卸载时自动解绑
 */
import { onBeforeUnmount, onMounted } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('use-keyboard-shortcut');
/**
 * 修饰键类型
 *
 * 支持 Ctrl、Shift、Alt、Meta（Mac 上的 Command）四种修饰键组合。
 *
 * @since 1.1.0
 */
type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

/**
 * 快捷键描述符
 *
 * 定义一个快捷键的触发条件与行为选项。
 *
 * @since 1.1.0
 */
export interface ShortcutDescriptor {
  /** 触发键（小写），如 'k'、's'、'enter' */
  key: string;
  /** 修饰键组合，如 ['ctrl', 'shift'] */
  modifiers?: ModifierKey[];
  /** 作用域标识，默认 'global'。不同作用域可注册同名快捷键互不冲突 */
  scope?: string;
  /** 是否阻止默认行为，默认 true */
  preventDefault?: boolean;
  /** 是否在输入框内也触发（默认 false：输入时不触发） */
  allowInInput?: boolean;
}

/** 快捷键回调 */
type ShortcutHandler = (event: KeyboardEvent) => void;

interface RegisteredShortcut {
  descriptor: ShortcutDescriptor;
  handler: ShortcutHandler;
}

/** 全局注册表：scope → shortcuts */
const registry = new Map<string, RegisteredShortcut[]>();

/** 已绑定的全局 keydown 监听（避免重复绑定） */
let globalListenerBound = false;

function isInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

function matchModifiers(event: KeyboardEvent, modifiers: ModifierKey[] = []): boolean {
  const state = {
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
  };
  // 要求的修饰键必须按下
  for (const mod of modifiers) {
    if (!state[mod]) return false;
  }
  // 未要求的修饰键不能按下（避免 Ctrl+Shift+K 误触 Ctrl+K）
  const required = new Set(modifiers);
  for (const [mod, pressed] of Object.entries(state)) {
    if (!required.has(mod as ModifierKey) && pressed) return false;
  }
  return true;
}

function handleKeydown(event: KeyboardEvent) {
  // 遍历所有 scope，匹配首个命中
  for (const shortcuts of registry.values()) {
    for (const { descriptor, handler } of shortcuts) {
      const { key, modifiers = [], allowInInput = false, preventDefault = true } =
        descriptor;

      if (event.key.toLowerCase() !== key) continue;
      if (!matchModifiers(event, modifiers)) continue;
      if (!allowInInput && isInputTarget(event.target)) continue;

      if (preventDefault) {
        event.preventDefault();
      }
      handler(event);
      return;
    }
  }
}

/** 解绑单个快捷键 */
function unbind(scope: string, key: string, modifiers: ModifierKey[] = []) {
  const shortcuts = registry.get(scope);
  if (!shortcuts) return;
  const idx = shortcuts.findIndex(
    (s) =>
      s.descriptor.key === key &&
      JSON.stringify(s.descriptor.modifiers) === JSON.stringify(modifiers),
  );
  if (idx >= 0) {
    shortcuts.splice(idx, 1);
  }
  if (shortcuts.length === 0) {
    registry.delete(scope);
  }
}

/**
 * 注册键盘快捷键（组件内使用，卸载自动清理）
 *
 * @param descriptor - 快捷键描述
 * @param handler - 回调
 *
 * @example
 * ```ts
 * // 页面内 Ctrl+K 触发搜索
 * useKeyboardShortcut(
 *   { key: 'k', modifiers: ['ctrl'], scope: 'list-page' },
 *   () => openSearch(),
 * );
 * ```
 */
export function useKeyboardShortcut(
  descriptor: ShortcutDescriptor,
  handler: ShortcutHandler,
) {
  const { scope = 'global', key, modifiers = [] } = descriptor;

  // 冲突检测
  const existing = registry.get(scope) || [];
  const conflict = existing.find(
    (s) =>
      s.descriptor.key === key &&
      JSON.stringify(s.descriptor.modifiers) === JSON.stringify(modifiers),
  );
  if (conflict) {
    logger.warn(
      `[shortcut] 快捷键冲突: scope=${scope}, key=${key}, modifiers=${JSON.stringify(modifiers)}`,
    );
  }

  onMounted(() => {
    if (!globalListenerBound) {
      window.addEventListener('keydown', handleKeydown);
      globalListenerBound = true;
    }
    const shortcuts = registry.get(scope) || [];
    shortcuts.push({ descriptor, handler });
    registry.set(scope, shortcuts);
  });

  onBeforeUnmount(() => {
    unbind(scope, key, modifiers);
  });
}

/**
 * 注册全局快捷键（非组件场景，返回手动解绑函数）
 *
 * 适用于非 Vue 组件环境（如纯 TS 模块、工具函数等），
 * 返回的解绑函数需在适当时机调用以避免内存泄漏。
 *
 * @param descriptor - 快捷键描述符
 * @param handler - 按键触发时的回调函数
 * @returns 手动解绑函数，调用后移除该快捷键注册
 *
 * @example
 * ```ts
 * // 在工具模块中注册
 * const unregister = bindGlobalShortcut(
 *   { key: 's', modifiers: ['ctrl'] },
 *   (e) => { e.preventDefault(); save(); },
 * );
 * // 清理时调用
 * unregister();
 * ```
 *
 * @since 1.1.0
 */
export function bindGlobalShortcut(
  descriptor: ShortcutDescriptor,
  handler: ShortcutHandler,
): () => void {
  const { scope = 'global', key, modifiers = [] } = descriptor;

  if (!globalListenerBound) {
    window.addEventListener('keydown', handleKeydown);
    globalListenerBound = true;
  }
  const shortcuts = registry.get(scope) || [];
  shortcuts.push({ descriptor, handler });
  registry.set(scope, shortcuts);

  return () => unbind(scope, key, modifiers);
}

/**
 * 清理某作用域下全部快捷键
 *
 * 移除指定作用域内所有已注册的快捷键。
 * 通常在离开页面或销毁模块时调用。
 *
 * @param scope - 要清理的作用域标识
 *
 * @example
 * ```ts
 * // 离开页面时清理当前作用域
 * onUnmounted(() => clearScope('list-page'));
 * ```
 *
 * @since 1.1.0
 */
export function clearScope(scope: string): void {
  registry.delete(scope);
}
