/**
 * 全局键盘快捷键组合式函数 —— 提供声明式的快捷键注册/注销与帮助面板状态（v5.3）
 *
 * @path main\src\composables\use-keyboard.ts
 * @author ydsz-team
 * @since 5.3.0
 *
 * @remarks
 * 封装 use-global-shortcut 的 registerKeyboard，提供：
 * 1. 声明式快捷键数组注册（onMounted / onUnmounted 自动绑定）
 * 2. 动态 registerShortcut / unregisterShortcut
 * 3. 帮助面板可见性状态 isHelpVisible（全局单例）
 * 4. 列表数据 shortcuts（计算自注册表）
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useKeyboard } from '#/composables/use-keyboard';
 *
 * const { shortcuts } = useKeyboard([
 *   { key: 'cmd+k', description: '全局搜索', category: 'navigation', handler: () => openSearch() },
 *   { key: 'escape', description: '关闭当前弹窗', category: 'system', handler: () => closeModal() },
 * ]);
 * </script>
 * ```
 */

import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';

import {
  listDetailedShortcuts,
  registerKeyboard,
  type ShortcutCategory,
  type ShortcutDetail,
  type ShortcutOptions,
} from '#/hooks/use-global-shortcut';

/**
 * 快捷键定义 —— 面向 useKeyboard composable 的输入格式
 *
 * @since 5.3.0
 */
export interface KeyboardShortcut {
  /** 快捷键表达式（如 "cmd+k"、"escape"、"shift+?"） */
  key: string;
  /** 中文功能描述 */
  description: string;
  /** 分类 */
  category?: ShortcutCategory;
  /** 按键处理函数 */
  handler: (e: KeyboardEvent) => void;
  /** 是否阻止浏览器默认行为（默认 true） */
  preventDefault?: boolean;
  /** 是否在 input/textarea 内仍生效（默认 false） */
  enableInInput?: boolean;
}

/**
 * useKeyboard 返回值
 *
 * @since 5.3.0
 */
export interface UseKeyboardReturn {
  /** 当前已注册的快捷键详情列表（响应式） */
  shortcuts: ComputedRef<ShortcutDetail[]>;
  /** 注册一组快捷键（组件挂载时调用） */
  registerAll: (items: KeyboardShortcut[]) => void;
  /** 动态注册单个快捷键，返回取消注册函数 */
  registerShortcut: (item: KeyboardShortcut) => () => void;
  /** 取消单个快捷键注册 */
  unregisterShortcut: (key: string) => void;
  /** 帮助面板可见性（全局单例） */
  isHelpVisible: Ref<boolean>;
  /** 打开帮助面板 */
  openHelp: () => void;
  /** 关闭帮助面板 */
  closeHelp: () => void;
}

// ─── 全局单例状态 ───────────────────────────────────────────────

/**
 * 帮助面板可见性（全局单例）
 *
 * 以具名导出供帮助面板直接订阅，避免为读一个布尔值引入整个 composable。
 *
 * @since 5.3.0
 */
export const isHelpVisible = ref(false);

/** 内部记录每个 key 对应的 unregister 函数 */
const unregisterMap = new Map<string, () => void>();

// ─── 组合式函数实现 ────────────────────────────────────────────

/**
 * 声明式快捷键注册组合式函数
 *
 * @param items  快捷键定义数组
 * @returns 操作接口
 *
 * @since 5.3.0
 */
export function useKeyboard(items: KeyboardShortcut[] = []): UseKeyboardReturn {
  /**
   * 注册一组快捷键
   */
  function registerAll(shortcuts: KeyboardShortcut[]): void {
    for (const item of shortcuts) {
      registerShortcut(item);
    }
  }

  /**
   * 注册单个快捷键
   *
   * @returns 取消注册函数
   */
  function registerShortcut(item: KeyboardShortcut): () => void {
    // 同 key 先取消旧的
    if (unregisterMap.has(item.key)) {
      unregisterMap.get(item.key)!();
    }

    const options: ShortcutOptions = {
      preventDefault: item.preventDefault ?? true,
      enableInInput: item.enableInInput,
      description: item.description,
      category: item.category ?? 'system',
    };

    const unregister = registerKeyboard(item.key, item.handler, options);
    unregisterMap.set(item.key, unregister);
    return unregister;
  }

  /**
   * 取消单个快捷键注册
   */
  function unregisterShortcut(key: string): void {
    const unregister = unregisterMap.get(key);
    if (unregister) {
      unregister();
      unregisterMap.delete(key);
    }
  }

  onMounted(() => {
    if (items.length > 0) registerAll(items);
  });

  onUnmounted(() => {
    for (const [, unregister] of unregisterMap) {
      unregister();
    }
    unregisterMap.clear();
  });

  return {
    shortcuts: computed(listDetailedShortcuts),
    registerAll,
    registerShortcut,
    unregisterShortcut,
    isHelpVisible,
    openHelp: () => {
      isHelpVisible.value = true;
    },
    closeHelp: () => {
      isHelpVisible.value = false;
    },
  };
}

/**
 * 获取帮助面板可见性状态（全局单例，跨组件共享）
 *
 * 用于非 setup 场景或需要在多个组件间同步帮助面板状态。
 *
 * @returns 帮助面板可见性 ref
 *
 * @since 5.3.0
 */
export function useKeyboardHelpState(): { isHelpVisible: Ref<boolean> } {
  return { isHelpVisible };
}
