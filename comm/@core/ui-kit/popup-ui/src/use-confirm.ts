/**
 * 确认框的组合式 API：useConfirm。
 *
 * 对标 PrimeVue 的 useConfirm 用法，在 setup 上下文中提供命令式确认框控制器。
 * 内部委托已有的 YdConfirm 函数，并补充异步操作的 loading 状态追踪能力。
 *
 * 典型场景：提交前二次确认、删除危险操作拦截等。
 *
 * @path comm\@core\ui-kit\popup-ui\src\use-confirm.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import { ref, type Ref } from 'vue';

import type { YdAlertProps } from './alert/alert';

import { YdConfirm } from './alert/AlertBuilder';

/** 简化版的确认框选项：仅暴露最常用的配置项 */
export interface ConfirmOptions {
  /** 确认提示正文 */
  message: string;
  /** 弹窗标题；省略时回落到国际化词条 'confirm'（中文为「确认」） */
  title?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmButtonType?: 'danger' | 'primary' | 'warning';
  /** 弹窗图标 */
  icon?: YdAlertProps['icon'];
  /** 关闭前的拦截回调；返回 false 阻止关闭 */
  beforeClose?: YdAlertProps['beforeClose'];
}

/** useConfirm 返回的控制器句柄 */
export interface UseConfirmReturn {
  /**
   * 是否有一个确认框正处于打开且等待用户决策的状态。
   *
   * 同一时刻只允许弹一个确认框，避免叠出多层的 UX 灾难；
   * 确认打开后该值变 true，结算（confirm/cancel）后重置为 false。
   */
  isConfirming: Readonly<Ref<boolean>>;
  /**
   * 弹出确认框并等待用户决策。
   *
   * @returns Promise<boolean>：用户点击确认时 resolve(true)，取消/关闭时 resolve(false)。
   *          与 YdConfirm 的「取消即 reject」契约不同，本 composable 把取消也规约为 resolve(false)，
   *          使调用方无需 try/catch，用 `if (await confirm(...))` 即可表达语义。
   */
  confirm(options: ConfirmOptions): Promise<boolean>;
  /**
   * 便捷入口：弹出删除确认框（危险操作样式）。
   *
   * @param targetName - 被删除目标的名称，嵌入提示文案
   */
  confirmDelete(targetName?: string): Promise<boolean>;
}

/**
 * 创建组件作用域的确认框控制器。
 *
 * @returns UseConfirmReturn 控制器
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const confirm = useConfirm();
 *
 * async function handleDelete(id: string) {
 *   const ok = await confirm.confirmDelete('该用户');
 *   if (!ok) return;
 *   await api.remove(id);
 * }
 * </script>
 * ```
 */
export function useConfirm(): UseConfirmReturn {
  const isConfirming = ref(false);

  async function confirm(options: ConfirmOptions): Promise<boolean> {
    if (isConfirming.value) {
      return false;
    }
    isConfirming.value = true;
    try {
      await YdConfirm(options.message, options.title ?? '确认', {
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        icon: options.icon,
        beforeClose: options.beforeClose,
      });
      return true;
    } catch {
      // YdConfirm 取消/关闭时抛出 'dialog cancelled'，规约为 resolve(false)
      return false;
    } finally {
      isConfirming.value = false;
    }
  }

  async function confirmDelete(targetName?: string): Promise<boolean> {
    const target = targetName ? `「${targetName}」` : '该数据';
    return confirm({
      message: `删除后不可恢复，确定删除${target}吗？`,
      title: '危险操作',
      confirmText: '确认删除',
      confirmButtonType: 'danger',
      icon: 'warning',
    });
  }

  return {
    isConfirming: isConfirming as Readonly<Ref<boolean>>,
    confirm,
    confirmDelete,
  };
}

export { useConfirm as default };
