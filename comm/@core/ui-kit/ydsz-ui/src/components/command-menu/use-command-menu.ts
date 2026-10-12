/**
 * useCommandMenu —— 命令面板控制 composable。
 *
 * 提供 open/close/toggle 方法，通过 ref 驱动面板显隐。
 * 消费方可简单调用 useCommandMenu().open() 快速打开面板。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\command-menu\use-command-menu.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { ref, type Ref } from 'vue';

/** 命令面板控制句柄 */
export interface CommandMenuHandle {
  /** 是否打开（响应式 ref） */
  open: Ref<boolean>;
  /** 打开面板 */
  show: () => void;
  /** 关闭面板 */
  hide: () => void;
  /** 切换面板显隐 */
  toggle: () => void;
}

const openRef = ref(false);

/**
 * useCommandMenu —— 命令面板控制面板。
 *
 * 返回响应式的 open ref 和控制方法。
 *
 * @returns 面板控制句柄。
 */
export function useCommandMenu(): CommandMenuHandle {
  function show(): void {
    openRef.value = true;
  }

  function hide(): void {
    openRef.value = false;
  }

  function toggle(): void {
    openRef.value = !openRef.value;
  }

  return {
    open: openRef,
    show,
    hide,
    toggle,
  };
}

export { openRef as commandMenuOpen };
