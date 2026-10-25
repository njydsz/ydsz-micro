/**
 * ydsz-ui Drawer（侧滑抽屉）类型声明。
 *
 * <p>涵盖声明式 YdDrawer props、命令式 DrawerOptions 以及
 * 内部容器使用的 DrawerInstance 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Component } from 'vue';

import type { PtOptions } from '../../pass-through';

/* ============================================================ */
/* 公共枚举                                                      */
/* ============================================================ */

/** 抽屉滑入方向 */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/* ============================================================ */
/* 声明式 Props                                                   */
/* ============================================================ */

/** YdDrawer 声明式 props */
export interface YdDrawerProps {
  /**
   * 挂载目标（Teleport to）。
   * <p>默认挂到 body 以免被祖先 transform / overflow 裁切；传 false 原地渲染。
   */
  appendTo?: 'body' | string | false;
  /** 受控开关状态（v-model:open） */
  open?: boolean;
  /** 抽屉滑入方向 */
  position?: DrawerPosition;
  /**
   * 抽屉尺寸：left/right 方向为宽度，top/bottom 方向为高度。
   * <p>支持数字（自动加 px）或 CSS 字符串。
   */
  width?: number | string;
  /**
   * 抽屉尺寸：top/bottom 方向为高度，left/right 方向无效。
   * <p>支持数字（自动加 px）或 CSS 字符串。
   */
  height?: number | string;
  /** 标题文本（优先于 #header 插槽） */
  header?: string;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** ESC 键是否关闭 */
  closeOnEsc?: boolean;
  /** 是否显示右上角关闭按钮 */
  showClose?: boolean;
  /** 是否显示遮罩层 */
  mask?: boolean;
  /** 是否在关闭时销毁子内容 */
  destroyOnClose?: boolean;
  /** className —— 透传至抽屉内容区 */
  class?: any;
  /** pt 透传：class/style 覆盖各个子节点 */
  pt?: DrawerPt;
}

/** YdDrawer emits */
export interface YdDrawerEmits {
  (e: 'update:open', value: boolean): void;
  /** 关闭请求，携带触发来源，便于命令式 API 与业务侧区分处理 */
  (e: 'close', reason: DrawerCloseReason): void;
  (e: 'opened'): void;
  (e: 'closed'): void;
}

/* ============================================================ */
/* Pass-Through                                                   */
/* ============================================================ */

/** 各子节点 pt 配置 */
export interface DrawerPt {
  overlay?: PtOptions;
  root?: PtOptions;
  header?: PtOptions;
  close?: PtOptions;
  body?: PtOptions;
  footer?: PtOptions;
}

/* ============================================================ */
/* 命令式 API                                                     */
/* ============================================================ */

/**
 * 命令式打开的选项配置。
 *
 * <p>调用方通过 `useDrawer().drawer.open(options)` 传入。
 */
export interface DrawerOptions {
  /** 抽屉标题 */
  header?: string;
  /** 滑入方向（默认 right） */
  position?: DrawerPosition;
  /** left/right 时的宽度（默认 480px） */
  width?: number | string;
  /** top/bottom 时的高度 */
  height?: number | string;
  /** 点击遮罩是否关闭（默认 true） */
  maskClosable?: boolean;
  /** ESC 关闭（默认 true） */
  closeOnEsc?: boolean;
  /** 显示关闭按钮（默认 true） */
  showClose?: boolean;
  /** 显示遮罩（默认 true） */
  mask?: boolean;
  /** 关闭时销毁内容（默认 false） */
  destroyOnClose?: boolean;
  /**
   * 要渲染的内容组件。
   *
   * <p>适用于复杂表单/详情的渲染。命令式 API 场景下只能通过此 prop 传入 Vue 组件。
   */
  component?: Component;
  /**
   * 传递给 component 的 props。
   *
   * <p>对应声明式场景下直接写在组件标签上的属性。
   */
  props?: Record<string, unknown>;
  /** 简单文本内容（命令式简化场景） */
  content?: string;
  /**
   * 命令式底部自定义渲染函数。
   *
   * <p>通过渲染函数 h 返回 VNode 数组。
   */
  footer?: () => any;
  /** 关闭回调，Promise 解析时传入关闭原因 */
  onClose?: (reason: DrawerCloseReason) => void;
}

/** 触发抽屉关闭的原因 */
export type DrawerCloseReason =
  /** 用户点击关闭按钮 */
  | 'close'
  /** 点击遮罩 */
  | 'mask'
  /** ESC 键 */
  | 'esc'
  /** 主动调用 close() */
  | 'api';

/** 命令式打开返回的句柄 */
export interface DrawerInstance {
  /**
   * 关闭当前抽屉。
   *
   * <p>可选 data 会随 Promise 一起返回，用于把表单结果交回调用方。
   */
  close: (data?: unknown) => void;
  /**
   * Promise：抽屉关闭时 resolve，携带关闭原因。
   *
   * <p>`await drawer.open(...)` 会阻塞直到用户关闭抽屉业务流。
   */
  promise: Promise<{ data?: unknown; reason: DrawerCloseReason }>;
}

/* ============================================================ */
/* 容器内部状态                                                    */
/* ============================================================ */

/** 容器管理的抽屉条目 */
export interface DrawerEntry {
  /** 唯一 id */
  id: string;
  /** 原始配置 */
  options: DrawerOptions;
}

/** useDrawer 返回的 drawer API */
export interface DrawerApi {
  /**
   * 打开一个抽屉。
   *
   * <p>返回 Promise，resolve 时带回 close 方法与阻塞 Promise。
   */
  open: (options: DrawerOptions) => Promise<DrawerInstance>;
  /** 关闭所有抽屉 */
  closeAll: () => void;
}
