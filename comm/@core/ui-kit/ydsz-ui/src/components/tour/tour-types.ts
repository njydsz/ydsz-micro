/**
 * YdTour（漫游引导）组件的全部类型定义。
 *
 * 对标 EP Tour / ANT Tour 的 props 体系，提供：
 * - 单个步骤配置（TourStep）
 * - 主控制器属性（YdTourProps）
 * - 事件签名（YdTourEmits）
 *
 * @module primitives/tour/tour-types
 * @author ydsz-team
 * @since 1.0.0 (26.10.10 扩展：placement / render / keyboard / resize 监听)
 */

import type { VNode } from 'vue';

/**
 * Popover 定位枚举 —— 对标 radix / ant-design 的 placement 命名。
 *
 * 格式：`<side>-<alignment>`，省略 alignment 时默认 center。
 * 例如 `top` = `top-center`，`bottom-end` = 底部右对齐。
 */
export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

/**
 * 单步引导配置。
 *
 * @property target   —— 目标元素：CSS 选择器 或 ref 函数，定位高亮区域和面板锚点
 * @property title    —— 步骤标题（可选）
 * @property description —— 步骤正文
 * @property placement —— 面板相对目标的方位，默认 'bottom'
 * @property render   —— 自定义渲染函数，优先级高于 title + description
 * @property mask     —— 是否在本步骤显示遮罩（覆盖全局 mask）
 * @property prevText —— 上一步按钮文字（覆盖全局 prevText）
 * @property nextText —— 下一步按钮文字（覆盖全局 nextText）
 * @property skipText —— 跳过按钮文字（覆盖全局 skipText）
 * @property finishText —— 完成按钮文字（覆盖全局 finishText）
 * @property closeOnClickMask —— 本步骤点击遮罩是否关闭（覆盖全局）
 */
export interface TourStep {
  /** 目标元素：CSS 选择器 或返回 HTMLElement 的函数 */
  target: string | (() => HTMLElement | null);

  /** 步骤标题（可选） */
  title?: string;

  /** 步骤正文描述 */
  description?: string;

  /** 面板相对目标的方位，默认 'bottom' */
  placement?: PopoverPlacement;

  /** 自定义渲染：优先级高于 title + description */
  render?: () => VNode;

  /** 是否显示遮罩（覆盖全局 mask），默认跟随全局 */
  mask?: boolean;

  /** 下一步按钮文字 */
  nextText?: string;

  /** 上一步按钮文字 */
  prevText?: string;

  /** 跳过按钮文字 */
  skipText?: string;

  /** 完成按钮文字 */
  finishText?: string;

  /** 点击遮罩是否关闭（覆盖全局） */
  closeOnClickMask?: boolean;
}

/**
 * YdTour 主控制器属性。
 */
export interface YdTourProps {
  /**
   * 引导步骤数据。
   * 变更数组长度时若 currentStep 将越界，自动归位到最后一步。
   */
  steps: TourStep[];

  /** 当前步骤索引（v-model） */
  modelValue?: number;

  /** 是否可见（v-model:visible） */
  visible?: boolean;

  /** 全局遮罩开关，默认 true */
  mask?: boolean;

  /** 全局点击遮罩关闭，默认 false */
  closeOnClickMask?: boolean;

  /** 全局上一步按钮文字，默认 '上一步' */
  prevText?: string;

  /** 全局下一步按钮文字，默认 '下一步' */
  nextText?: string;

  /** 全局跳过按钮文字，默认 '跳过' */
  skipText?: string;

  /** 全局完成按钮文字，默认 '完成' */
  finishText?: string;
}

/**
 * YdTour 事件签名。
 */
export interface YdTourEmits {
  /** 步骤索引变化（v-model） */
  (e: 'update:modelValue', index: number): void;

  /** 可见性变化（v-model:visible） */
  (e: 'update:visible', visible: boolean): void;

  /** 全部步骤完成 */
  (e: 'finish'): void;

  /** 用户主动关闭/跳过 */
  (e: 'close'): void;

  /** 步骤切换（每次上/下一步都会触发） */
  (e: 'change', index: number, step: TourStep): void;
}

/**
 * 面板定位结果（像素坐标 + 实际生效的 placement）。
 */
export interface TourPopoverStyle {
  left: number;
  top: number;
  actualPlacement: PopoverPlacement;
}
