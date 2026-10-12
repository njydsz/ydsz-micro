/**
 * ConfirmDialog 与 ConfirmPopup 组件的 TypeScript 类型定义。
 *
 * 覆盖确认弹窗的命令式调用参数与组件 props 两个层面：
 * ConfirmOptions 是 useConfirm().confirm() 的入参，
 * ConfirmDialogProps / ConfirmPopupProps 是声明式使用同名组件时的 props。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\confirm-dialog\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { PtOptions } from '../../pass-through';

/* ============================================================ */
/* 公共类型                                                       */
/* ============================================================ */

/** 确认按钮视觉类型 */
export type ConfirmButtonType = 'primary' | 'danger' | 'warning' | 'info';

/** 取消按钮视觉类型 */
export type RejectButtonType = 'default' | 'text';

/* ============================================================ */
/* useConfirm 入参                                                 */
/* ============================================================ */

/**
 * confirm() 方法的配置项。
 *
 * 每个字段都是可选的 —— 未传字段自动回退到组件内置默认值 + i18n 文案。
 */
export interface ConfirmOptions {
  /** 弹窗标题 */
  header?: string;
  /** 确认消息正文（必填） */
  message: string;
  /**
   * Iconify 图标名（如 'mdi:alert-circle'）。
   * 未传时根据 confirmButtonType 自动选择默认图标。
   */
  icon?: string;
  /** 确认按钮文案 @default "确认" / "Confirm"（i18n） */
  confirmLabel?: string;
  /** 取消按钮文案 @default "取消" / "Cancel"（i18n） */
  rejectLabel?: string;
  /**
   * 确认按钮视觉类型，决定颜色与图标
   * @default 'primary'
   */
  confirmButtonType?: ConfirmButtonType;
  /**
   * 取消按钮视觉类型
   * @default 'default'
   */
  rejectButtonType?: RejectButtonType;
  /** 点击遮罩是否关闭 @default true */
  closeOnOverlayClick?: boolean;
  /** ESC 是否关闭 @default true */
  closeOnEsc?: boolean;
  /** Pt 透传给内容区 */
  pt?: ConfirmPt;
}

/**
 * ConfirmDialog pt 节点集合。
 */
export interface ConfirmPt {
  /** 内容区 */
  content?: PtOptions;
  /** 头部区 */
  header?: PtOptions;
  /** 标题 */
  title?: PtOptions;
  /** 描述 */
  description?: PtOptions;
  /** footer 节点 */
  footer?: PtOptions;
}

/* ============================================================ */
/* useConfirm 返回                                                 */
/* ============================================================ */

/** useConfirm composable 对外暴露的 API */
export interface UseConfirmReturn {
  /**
   * 命令式打开一个确认对话框。
   *
   * 返回 Promise<boolean>：用户点击确认时 resolve(true)，
   * 点击取消 / 遮罩 / ESC 时 resolve(false)。
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** 关闭所有已打开的确认弹窗 */
  closeAll: () => void;
}

/* ============================================================ */
/* ConfirmDialog Props                                            */
/* ============================================================ */

/**
 * ConfirmDialog 组件 props（声明式用法）。
 *
 * 通常不需要直接使用，除非需要在模板里内嵌一个预置好的确认弹窗；
 * 大多数场景请优先使用 useConfirm composable。
 */
export interface ConfirmDialogProps {
  /** 受控开关；非受控使用时由组件内部管理 */
  open?: boolean;
  /** 弹窗标题 */
  header?: string;
  /** 确认消息正文 */
  message?: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 确认按钮文案 */
  confirmLabel?: string;
  /** 取消按钮文案 */
  rejectLabel?: string;
  /** 确认按钮类型 @default 'primary' */
  confirmButtonType?: ConfirmButtonType;
  /** 取消按钮类型 @default 'default' */
  rejectButtonType?: RejectButtonType;
  /** 点击遮罩是否关闭 @default true */
  closeOnOverlayClick?: boolean;
  /** ESC 是否关闭 @default true */
  closeOnEsc?: boolean;
}

/** ConfirmDialog 组件 emits */
export interface ConfirmDialogEmits {
  /** 开关变化 */
  (e: 'update:open', value: boolean): void;
  /** 用户确认 */
  (e: 'confirm'): void;
  /** 用户取消 / 关闭 */
  (e: 'cancel'): void;
}

/* ============================================================ */
/* ConfirmPopup Props                                             */
/* ============================================================ */

/**
 * ConfirmPopup 组件 props（锚定触发器的气泡确认框）。
 *
 * 类似 PrimeVue ConfirmPopup：点击触发器后弹出气泡，
 * 用户确认或取消后气泡关闭。
 */
export interface ConfirmPopupProps {
  /** 气泡标题 */
  header?: string;
  /** 确认消息正文 */
  message: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 确认按钮文案 @default i18n */
  confirmLabel?: string;
  /** 取消按钮文案 @default i18n */
  rejectLabel?: string;
  /** 确认按钮类型 @default 'primary' */
  confirmButtonType?: ConfirmButtonType;
  /** 取消按钮类型 @default 'default' */
  rejectButtonType?: RejectButtonType;
  /** 是否禁用 */
  disabled?: boolean;
  /** 气泡出现方向 @default 'top' */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** 对齐方式 @default 'center' */
  align?: 'start' | 'center' | 'end';
}

/** ConfirmPopup 组件 emits */
export interface ConfirmPopupEmits {
  /** 受控开关 */
  (e: 'update:open', value: boolean): void;
  /** 用户确认 */
  (e: 'confirm'): void;
  /** 用户取消 */
  (e: 'cancel'): void;
}
