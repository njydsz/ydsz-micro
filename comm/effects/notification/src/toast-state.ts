/**
 * 全局 Toast 状态管理 —— 轻量级响应式队列，为 useToast 提供底层数据存储。
 *
 * <p>维护一个 module-level 的响应式数组，ToastProvider 订阅它来渲染浮层。
 * 命令式调用 `toast.success(...)` 等入口写入该数组，Provider 负责定时清理与动画。
 *
 * @path comm/effects/notification/src/toast-state.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { ref } from 'vue';

/** Toast 类型契约 */
export interface ToastItem {
  /** 唯一 ID（内部自动递增） */
  id: number;
  /** 标题（主文案） */
  title: string;
  /** 副标题 / 描述 */
  description?: string;
  /** 语义等级：info / success / warning / error / default */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  /** 自动关闭毫秒数；0 表示手动关闭 */
  duration?: number;
}

/** Toast 输入参数（创建时只需必填 title） */
export type ToastOptions = Omit<ToastItem, 'id'>;

/** 模块级状态：所有 toast 实例共享同一个队列 */
const toasts = ref<ToastItem[]>([]);

/** 自增 ID 种子 */
let toastIdSeed = 0;

/** 默认 Toast 时长（毫秒） */
const DEFAULT_DURATION = 4000;

/**
 * 模块级 Toast 状态 composable。
 *
 * @returns
 * - `toasts` —— 只读响应式数组，ToastProvider 订阅渲染
 * - `dismiss` —— 根据 id 从队列移除指定 toast
 * - `push` —— 添加一条 toast 并返回 id
 */
export function useToastState() {
  const dismiss = (id: number): void => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const push = (options: ToastOptions): number => {
    const id = toastIdSeed++;
    const merged: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'default',
      duration: options.duration ?? DEFAULT_DURATION,
    };
    toasts.value = [...toasts.value, merged];
    return id;
  };

  return {
    toasts,
    dismiss,
    push,
  };
}

/** 模块级单例订阅句柄，保证多实例调用共享同一队列 */
let stateHolder: ReturnType<typeof useToastState> | null = null;

/**
 * 获取全局 Toast 状态（单例）。
 *
 * <p>作为命令式的 `showToast` 等函数内部调用的入口。
 */
export function getGlobalToastState(): ReturnType<typeof useToastState> {
  if (!stateHolder) {
    stateHolder = useToastState();
  }
  return stateHolder;
}
