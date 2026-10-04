/**
 * 命令面板组合式函数 —— 注册 Ctrl/Cmd+K 打开搜索、Esc 关闭
 *
 * @path main\src\composables\use-command-palette.ts
 * @author ydsz-team
 * @since 5.1.0
 *
 * @remarks
 * 封装全局键盘事件注册与清理逻辑，组件内使用 onMounted / onUnmounted
 * 自动绑定/解绑；导航跳转统一走 router.push。与 use-global-shortcut.ts
 * 共享事件机制但独立注册，避免冲突。
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

import { useRouter } from 'vue-router';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('useCommandPalette');

/**
 * 命令面板选项
 *
 * @since 5.1.0
 */
export interface UseCommandPaletteOptions {
  /** 面板可见性（外部传入的响应式 Ref） */
  visible: Ref<boolean>;
  /** 打开时的可选回调 */
  onOpen?: () => void;
  /** 关闭时的可选回调 */
  onClose?: () => void;
  /** 导航跳转回调（默认走 router.push） */
  onNavigate?: (path: string) => void;
}

/**
 * 命令面板组合式函数
 *
 * 注册 Cmd+K / Ctrl+K 打开面板、Esc 关闭面板。
 * 组件卸载时自动清理事件监听。
 *
 * @param options - 配置选项
 * @returns 控制函数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { useCommandPalette } from '#/composables/use-command-palette';
 *
 * const searchVisible = ref(false);
 * const { open, close, toggle } = useCommandPalette({ visible: searchVisible });
 * </script>
 * ```
 *
 * @since 5.1.0
 */
export function useCommandPalette(options: UseCommandPaletteOptions) {
  const { visible, onOpen, onClose, onNavigate } = options;

  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    logger.warn('useRouter 不可用，导航回调将依赖 onNavigate');
  }

  /**
   * 导航跳转：优先使用外部回调，否则走 router.push
   */
  function navigate(path: string) {
    if (onNavigate) {
      onNavigate(path);
    } else if (router) {
      router.push(path).catch((err) => {
        logger.warn(`路由跳转失败: ${path}`, err);
      });
    } else {
      // 最终兜底：使用 micro-kernel:navigate 事件（与已有搜索面板兼容）
      window.dispatchEvent(
        new CustomEvent('micro-kernel:navigate', { detail: { path } }),
      );
    }
  }

  /**
   * 打开命令面板
   */
  function open() {
    visible.value = true;
    onOpen?.();
  }

  /**
   * 关闭命令面板
   */
  function close() {
    visible.value = false;
    onClose?.();
  }

  /**
   * 切换命令面板显隐
   */
  function toggle() {
    if (visible.value) close();
    else open();
  }

  /**
   * 全局 keydown 处理
   */
  function handleKeyDown(event: KeyboardEvent): void {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const cmdKey = isMac ? event.metaKey : event.ctrlKey;

    // Cmd+K / Ctrl+K → 打开/关闭
    if (cmdKey && event.key.toLowerCase() === 'k' && !event.shiftKey) {
      event.preventDefault();
      toggle();
      return;
    }

    // Esc → 关闭（仅当面板可见时拦截）
    if (event.key === 'Escape' && visible.value) {
      event.preventDefault();
      close();
    }
  }

  // ==================== Lifecycle ====================

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return {
    open,
    close,
    toggle,
    navigate,
    visible,
  };
}
