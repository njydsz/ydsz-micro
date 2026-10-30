/**
 * useDialog composable —— 动态 Dialog 弹窗的命令式 API。
 *
 * <p>与 useConfirm 互补：
 *  - useConfirm：确认弹窗（固定 header + message + 两个按钮，轻量）；
 *  - useDialog：动态组件弹窗（可渲染任意 Vue 组件，支持自定义 header/footer，重量级）。
 *
 * <p>实现为 lazy import：如业务侧不使用命令式 API，
 * use-dialog-internal 的代码不会被打包进入最终产物。
 *
 * <p>用法：
 * ```ts
 * const { dialog } = useDialog();
 * const { close, promise } = await dialog.open({
 *   header: '编辑用户',
 *   component: markRaw(UserEditForm),
 *   props: { userId: 123 },
 *   width: '640px',
 * });
 * const { data, reason } = await promise;
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\dialog\use-dialog.ts
 * @author ydsz-team
 * @since 26.10.30
 */

import type { Component } from 'vue';

/* ============================================================ */
/* 类型定义                                                       */
/* ============================================================ */

/** 关闭原因 */
export type DialogCloseReason = 'close' | 'mask' | 'esc' | 'api';

/** 命令式打开 Dialog 的入参 */
export interface DialogOptions {
  /** 弹窗标题 */
  header?: string;
  /** 要渲染的 Vue 组件（务必 markRaw） */
  component?: Component;
  /** 传给组件的 props */
  props?: Record<string, unknown>;
  /** 弹窗宽度（CSS 值，如 '600px'、'50%'），缺省自适应 */
  width?: string;
  /** 点击遮罩是否关闭；默认 true */
  closeOnOverlayClick?: boolean;
  /** 关闭回调 */
  onClose?: (reason: DialogCloseReason) => void;
}

/** 弹窗 Promise 解析回调 */
export type DialogResolve = (payload: { data?: unknown; reason: DialogCloseReason }) => void;

/** 容器暴露方法 */
export interface DialogContainerExposed {
  push: (id: string, vnode: any) => void;
  close: (id: string) => void;
  closeAll: () => void;
}

/** 打开弹窗的返回句柄 */
export interface DialogInstance {
  /** 手动关闭弹窗（可携带回传数据） */
  close: (data?: unknown) => void;
  /** Promise：弹窗关闭时解析，返回关闭原因与可选数据 */
  promise: Promise<{ data?: unknown; reason: DialogCloseReason }>;
}

/** Dialog API 对象 */
export interface DialogApi {
  /**
   * 命令式打开一个动态弹窗。
   *
   * @param options - Dialog 配置
   * @returns DialogInstance 句柄（close + promise）
   */
  open: (options: DialogOptions) => Promise<DialogInstance>;
  /** 关闭所有弹窗 */
  closeAll: () => void;
}

/** useDialog 返回 */
export interface UseDialogReturn {
  /** 命令式 Dialog API */
  dialog: DialogApi;
}

/* ============================================================ */
/* 懒加载 Wrapper                                                 */
/* ============================================================ */

/**
 * useDialog —— 动态弹窗命令式 API。
 *
 * @returns { dialog: { open, closeAll } } 控制句柄
 */
export function useDialog(): UseDialogReturn {
  return {
    dialog: {
      open: async (options: DialogOptions): Promise<DialogInstance> => {
        const { openDialog } = await import('./use-dialog-internal');
        return openDialog(options);
      },
      closeAll: () => {
        // 容器可能从未被实例化（没调用过 open），动态 import 兜底
        import('./use-dialog-internal').then(({ closeAllDialogs }) => {
          closeAllDialogs();
        }).catch(() => {
          // 容器从未存在时静默忽略
        });
      },
    },
  };
}
