/**
 * Stepper 多步骤向导 —— 公共类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\stepper\stepper-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Component } from 'vue';

/** 单步骤定义 */
export interface StepItem {
  /** 校验函数，返回 true 才允许下一步。可以是 sync 或 async */
  validate?: () => boolean | Promise<boolean>;
  /** 步骤描述（可选） */
  description?: string;
  /** 是否禁用（不允许跳转） */
  disabled?: boolean;
  /** 图标 class 或 component */
  icon?: string | Component;
  /** 步骤标识 */
  key: string;
  /** 标题 */
  title: string;
}

/** 外观样式 */
export type StepperVariant = 'default' | 'dot';

/** 方向 */
export type StepperOrientation = 'horizontal' | 'vertical';

/** 尺寸 */
export type StepperSize = 'sm' | 'md' | 'lg';

/** YdStepper 组件 props */
export interface YdStepperProps {
  /** 尺寸 */
  size?: StepperSize;
  /** 步骤定义列表 */
  steps: StepItem[];
  /** 初始激活步骤索引 */
  defaultStep?: number;
  /** 外观样式：'default'（标准）| 'dot' 点状 */
  variant?: StepperVariant;
  /** 方向 */
  orientation?: StepperOrientation;
  /** 完成图标 */
  finishIcon?: string | Component;
}

/** YdStepPanel 组件 props */
export interface YdStepPanelProps {
  /** 自定义类名 */
  class?: any;
  /** 匹配 StepItem.key */
  name: string;
}

/** Stepper 注入上下文类型 */
export interface StepperContext {
  /** 当前激活步骤索引 */
  activeStep: number;
  /** 步骤总数 */
  totalSteps: number;
}
