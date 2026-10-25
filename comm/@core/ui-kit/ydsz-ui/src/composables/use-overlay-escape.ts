/**
 * useOverlayEscape —— 浮层 ESC 关闭调度（栈式）。
 *
 * <p>解决的问题：把 ESC 监听挂在浮层根节点上只有焦点位于该节点内才会触发，
 * 用户鼠标点击遮罩外区域或尚未聚焦时按 ESC 没有任何反应；多个浮层同时打开时
 * 若各自监听 document，一次按键会把整叠浮层全部关掉。
 *
 * <p>方案：全局唯一 keydown 监听 + 注册栈，只有最后注册（最上层）的浮层响应。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-overlay-escape.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import { onBeforeUnmount, watch } from 'vue';

import type { Ref } from 'vue';

/** ESC 处理函数 */
type EscapeHandler = () => void;

/** 当前活跃的浮层处理栈（末尾为最上层） */
const stack: EscapeHandler[] = [];

/** 全局监听是否已安装 */
let installed = false;

/**
 * document keydown 回调：只把 Escape 交给栈顶浮层。
 *
 * @param event - 键盘事件
 * @returns 无
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  stack[stack.length - 1]?.();
}

/**
 * 注册一个 ESC 处理函数。
 *
 * @param handler - 命中栈顶时调用
 * @returns 注销函数
 */
function pushHandler(handler: EscapeHandler): () => void {
  if (!installed) {
    document.addEventListener('keydown', onKeydown);
    installed = true;
  }
  stack.push(handler);
  return () => {
    const index = stack.indexOf(handler);
    if (index >= 0) stack.splice(index, 1);
    if (stack.length === 0 && installed) {
      document.removeEventListener('keydown', onKeydown);
      installed = false;
    }
  };
}

/**
 * useOverlayEscape —— 在 active 为真期间接管 ESC 键。
 *
 * @param active - 浮层是否打开
 * @param handler - 关闭回调
 * @returns 无
 */
export function useOverlayEscape(active: Ref<boolean>, handler: EscapeHandler): void {
  let unregister: (() => void) | null = null;

  watch(
    active,
    (visible) => {
      unregister?.();
      unregister = null;
      if (visible) unregister = pushHandler(handler);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    unregister?.();
    unregister = null;
  });
}

/**
 * 重置 ESC 栈 —— 仅用于测试隔离。
 *
 * @returns 无
 */
export function __resetOverlayEscapeStackForTests(): void {
  stack.length = 0;
  if (installed) {
    document.removeEventListener('keydown', onKeydown);
    installed = false;
  }
}
