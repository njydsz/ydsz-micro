/**
 * useToast —— 命令式 Toast API，提供非阻塞轻提示。
 *
 * <p>提供给业务代码的命令式轻提示 API，内部写入全局 toast 队列，
 * 由 ToastProvider 组件渲染，支持自动关闭、手动关闭、语义等级四套风格。
 *
 * <p>用法对齐 ElMessage：
 * ```ts
 * import { showToast } from '@ydsz/notification';
 * showToast.success('保存成功');
 * showToast.error('删除失败');
 * showToast.warning('注意检查');
 * showToast.info('加载中...', 6000);
 * ```
 *
 * @path comm/effects/notification/src/use-toast.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ToastOptions } from './toast-state';
import { getGlobalToastState } from './toast-state';

/** Toast 输出函数签名 */
type ToastFunction = {
  (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>): number;
};

/** useToast 返回值 */
export interface UseToastReturn {
  /** 默认风格 */
  (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>): number;
  /** 信息（蓝色） */
  info: ToastFunction;
  /** 成功（绿色） */
  success: ToastFunction;
  /** 警告（橙色） */
  warning: ToastFunction;
  /** 错误（红色） */
  error: ToastFunction;
  /** 手动关闭指定 id */
  dismiss: (id: number) => void;
}

/**
 * 创建指定 variant 的 toast 发送函数。
 *
 * @param variant —— 语义等级
 * @returns 携带 variant 的 toast 发送函数
 */
function createVariantFn(
  variant: 'default' | 'info' | 'success' | 'warning' | 'error',
): ToastFunction {
  return (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) => {
    const state = getGlobalToastState();
    return state.push({
      title,
      variant,
      description: options?.description,
      duration: options?.duration,
    });
  };
}

/**
 * 全局命令式 toast API。
 *
 * <p>不依赖组件实例，可在任意 JS/TS 上下文调用（包括 router interceptor、store action 等）。
 * 内部调用 getGlobalToastState 获取全局队列；需要确保应用已挂载 <ToastProvider /> 才会渲染。
 */
export function showToast(title: string, options?: Omit<ToastOptions, 'title' | 'variant'>): number;
export function showToast(title: string, options?: Omit<ToastOptions, 'title' | 'variant'>): number {
  const state = getGlobalToastState();
  return state.push({ title, ...options });
}

/** 语义便捷方法（挂载在 showToast 函数对象上） */
showToast.info = createVariantFn('info');
showToast.success = createVariantFn('success');
showToast.warning = createVariantFn('warning');
showToast.error = createVariantFn('error');
showToast.dismiss = (id: number): void => {
  getGlobalToastState().dismiss(id);
};
