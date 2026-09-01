/**
 * 命令面板键盘事件管理 —— 注册 ⌘K/⌘⇧P/Esc 快捷键并分发到对应回调
 *
 * @path main\src\components\command-palette\composables\use-command-keyboard.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { onMounted, onUnmounted } from "vue";

import type { PaletteMode } from "./use-command-search";

/**
 * 命令面板键盘事件管理
 *
 * @param options - 配置选项
 * @returns 控制函数
 */
export function useCommandKeyboard(options: {
  /** 打开面板的回调 */
  onOpen: (mode: PaletteMode) => void;
  /** 关闭面板的回调 */
  onClose: () => void;
  /** 切换模式的回调 */
  onToggleMode: () => void;
}) {
  function handleKeyDown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // ⌘K / Ctrl+K → 打开搜索模式
    if (cmdKey && e.key === "k" && !e.shiftKey) {
      e.preventDefault();
      options.onOpen("search");
      return;
    }

    // ⌘⇧P / Ctrl+Shift+P → 打开命令模式
    if (cmdKey && e.shiftKey && e.key === "p") {
      e.preventDefault();
      options.onOpen("command");
      return;
    }

    // Esc → 关闭面板
    if (e.key === "Escape") {
      e.preventDefault();
      options.onClose();
      return;
    }
  }

  onMounted(() => {
    document.addEventListener("keydown", handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return {
    /** 手动触发打开（指定模式） */
    open: options.onOpen,
    /** 手动触发关闭 */
    close: options.onClose,
    /** 切换模式 */
    toggleMode: options.onToggleMode,
  };
}
