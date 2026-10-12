/**
 * Toast 组件的 TypeScript 类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\types.ts
 * @author ydsz-team
 * @since 26.10.11
 */

/* ============================================================ */
/* 基础类型                                                       */
/* ============================================================ */

/** Toast 严重级别 */
export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

/** Toast 展示位置 */
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

/* ============================================================ */
/* 消息项                                                         */
/* ============================================================ */

/** 完整的 Toast 消息项（内部使用，附加运行时数据） */
export interface ToastMessage {
  /** 唯一标识 */
  id: string;
  /** 严重级别 */
  severity: ToastSeverity;
  /** 标题 */
  summary?: string;
  /** 内容详情 */
  detail?: string;
  /** 自定义图标（Lucide 组件名或 SVG 字符串） */
  icon?: string;
  /** 展示位置 */
  position: ToastPosition;
  /** 持续时长（毫秒），0 表示常驻 */
  life: number;
  /** 是否可关闭 */
  closable: boolean;
  /** 分组标识 */
  group?: string;
  /** 创建时间戳 */
  createdAt: number;
}

/* ============================================================ */
/* 公共	options                                                    */
/* ============================================================ */

/** 调用 add 时传入的 options */
export interface ToastOptions {
  /** 严重级别 */
  severity?: ToastSeverity;
  /** 标题 */
  summary?: string;
  /** 内容详情 */
  detail?: string;
  /** 自定义图标 */
  icon?: string;
  /** 展示位置，默认 top-right */
  position?: ToastPosition;
  /** 持续时长（毫秒），0 表示常驻 */
  life?: number;
  /** 可关闭，默认 true */
  closable?: boolean;
  /** 分组标识 */
  group?: string;
}

/* ============================================================ */
/* 返回值                                                         */
/* ============================================================ */

/** 单条 Toast 操作句柄 */
export interface ToastHandle {
  /** 关闭此条 Toast */
  close: () => void;
}

/* ============================================================ */
/* useToast 返回                                                   */
/* ============================================================ */

/** useToast composable 返回句柄 */
export interface UseToastReturn {
  /** 程序化添加 Toast */
  add: (options: ToastOptions) => ToastHandle;
  /** 快捷：弹出成功 Toast */
  success: (message: string, options?: Partial<ToastOptions>) => ToastHandle;
  /** 快捷：弹出信息 Toast */
  info: (message: string, options?: Partial<ToastOptions>) => ToastHandle;
  /** 快捷：弹出警告 Toast */
  warning: (message: string, options?: Partial<ToastOptions>) => ToastHandle;
  /** 快捷：弹出错误 Toast */
  error: (message: string, options?: Partial<ToastOptions>) => ToastHandle;
  /** 关闭指定 id 的 Toast */
  remove: (id: string) => void;
  /** 关闭某一位置的所有 Toast */
  removeGroup: (position: ToastPosition) => void;
  /** 关闭全部 Toast */
  removeAll: () => void;
}
