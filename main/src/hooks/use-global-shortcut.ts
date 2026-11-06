/**
 * 全局快捷键注册中心 —— 统一管理快捷键的注册、冲突检测与标准化（v4.0）
 *
 * @path main\src\hooks\use-global-shortcut.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('GlobalShortcut');

/**
 * 修饰键类型
 *
 * 支持 cmd（Mac Command / Windows Ctrl）、alt、shift 三种修饰键。
 *
 * @since 4.0.0
 */
export type Modifier = 'cmd' | 'ctrl' | 'alt' | 'shift';

/**
 * 快捷键选项
 *
 * @since 4.0.0
 */
export interface ShortcutOptions {
  /** 是否阻止默认行为，默认 true */
  preventDefault?: boolean;
  /** 是否在 input/textarea 内仍生效，默认 false */
  enableInInput?: boolean;
  /** 功能描述（用于帮助面板展示） */
  description?: string;
  /** 分类（用于帮助面板分组） */
  category?: ShortcutCategory;
}

/**
 * 快捷键分类
 *
 * 与帮助面板分组顺序一致。
 *
 * @since 5.3.0
 */
export type ShortcutCategory = 'navigation' | 'editing' | 'system' | 'app';

/**
 * 快捷键详情（帮助面板展示用）
 *
 * @since 5.3.0
 */
export interface ShortcutDetail {
  /** 标准化组合键字符串 */
  combo: string;
  /** 展示用文本（如 "Cmd + K"） */
  displayText: string;
  /** 功能描述 */
  description: string;
  /** 分类 */
  category: ShortcutCategory;
}

/**
 * 分类展示名映射
 *
 * @since 5.3.0
 */
export const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: '导航',
  editing: '编辑',
  system: '系统',
  app: '应用',
};

interface Shortcut {
  combo: string; // 标准化组合键字符串
  handler: (e: KeyboardEvent) => void;
  options: ShortcutOptions;
}

const registry = new Map<string, Shortcut>();

/** 是否已注册全局 keydown 监听 */
let bound = false;

/**
 * 将键盘事件标准化为组合字符串（如 "cmd+shift+p"）
 */
function normalizeEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('cmd');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  const key = e.key.toLowerCase();
  if (!['meta', 'control', 'alt', 'shift'].includes(key)) parts.push(key);
  return parts.join('+');
}

/**
 * 解析用户友好的快捷键表达式（"cmd+k" → 标准化格式）
 */
function parseShortcutExpr(expr: string): string {
  return expr
    .toLowerCase()
    .split('+')
    .map((s) => s.trim())
    .map((s) => (s === 'cmd' || s === 'command' || s === 'meta' ? 'cmd' : s))
    .map((s) => (s === 'ctrl' || s === 'control' ? 'cmd' : s))
    .sort((a, b) => {
      const o = ['cmd', 'alt', 'shift'];
      const ao = o.indexOf(a);
      const bo = o.indexOf(b);
      if (ao >= 0 && bo >= 0) return ao - bo;
      if (ao >= 0) return -1;
      if (bo >= 0) return 1;
      return a.localeCompare(b);
    })
    .join('+');
}

function bindGlobal(): void {
  if (bound) return;
  bound = true;
  document.addEventListener('keydown', handleKeyDown, true);
}

function handleKeyDown(e: KeyboardEvent): void {
  const combo = normalizeEvent(e);
  const shortcut = registry.get(combo);
  if (!shortcut) return;

  const { handler, options } = shortcut;
  const { preventDefault = true, enableInInput = false } = options;

  // input/textarea 内默认不拦截（除非显式 enableInInput）
  if (!enableInInput) {
    const target = e.target as HTMLElement | null;
    if (target && ['input', 'textarea'].includes(target.tagName.toLowerCase())) return;
  }

  if (preventDefault) e.preventDefault();
  handler(e);
}

/**
 * 注册全局快捷键。
 *
 * @param expr     快捷键表达式，如 "cmd+k"、"ctrl+shift+p"、"escape"
 * @param handler  按键处理函数
 * @param options  选项
 * @returns 取消注册函数
 *
 * @example
 * // 在 setup 内
 * onMounted(() => {
 *   const stop = registerKeyboard('cmd+k', () => searchVisible.value = !searchVisible.value);
 *   onUnmounted(stop);
 * });
 */
export function registerKeyboard(
  expr: string,
  handler: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {},
): () => void {
  const combo = parseShortcutExpr(expr);
  bindGlobal();

  // 冲突检测：同 combo 已注册则 console 警告
  if (registry.has(combo)) {
    logger.warn(`快捷键 ${combo} 已被注册，后注册将覆盖`);
  }

  registry.set(combo, {
    combo,
    handler,
    options: { ...options, category: options.category ?? 'system' },
  });
  return () => {
    registry.delete(combo);
    if (registry.size === 0) {
      document.removeEventListener('keydown', handleKeyDown, true);
      bound = false;
    }
  };
}

/**
 * 取消所有已注册的快捷键
 *
 * 清空注册表并移除全局 keydown 监听器。
 * 主要用于测试环境清理或全局重置场景。
 *
 * @example
 * ```ts
 * // 测试用例 afterEach 中
 * afterEach(() => resetAllShortcuts());
 * ```
 *
 * @since 4.0.0
 */
export function resetAllShortcuts(): void {
  registry.clear();
  if (bound) {
    document.removeEventListener('keydown', handleKeyDown, true);
    bound = false;
  }
}

/**
 * 获取当前已注册的快捷键列表
 *
 * 返回所有已注册快捷键的标准化组合字符串数组，
 * 主要用于调试面板或开发者工具。
 *
 * @returns 已注册的快捷键组合字符串数组
 *
 * @example
 * ```ts
 * // 调试面板中展示
 * const shortcuts = listRegisteredShortcuts();
 * console.log(`已注册 ${shortcuts.length} 个快捷键:`, shortcuts);
 * ```
 *
 * @since 4.0.0
 */
export function listRegisteredShortcuts(): string[] {
  return [...registry.keys()];
}

/**
 * 把标准化组合键转成展示文本（"cmd+shift+p" → "Cmd + Shift + P"）
 */
function toDisplayText(combo: string): string {
  return combo
    .split('+')
    .map((part) => {
      const key = part.trim();
      if (key === 'cmd') return 'Cmd';
      if (key === 'escape') return 'Esc';
      return key.charAt(0).toUpperCase() + key.slice(1);
    })
    .join(' + ');
}

/**
 * 获取当前已注册快捷键的详情列表（含描述与分类）
 *
 * 供帮助面板按分类分组展示。返回的是快照副本，
 * 响应式场景请通过 `useKeyboard` 的 `shortcuts` 计算属性获取。
 *
 * @returns 快捷键详情数组
 *
 * @since 5.3.0
 */
export function listDetailedShortcuts(): ShortcutDetail[] {
  return [...registry.values()].map(({ combo, options }) => ({
    combo,
    displayText: toDisplayText(combo),
    description: options.description ?? '',
    category: options.category ?? 'system',
  }));
}
