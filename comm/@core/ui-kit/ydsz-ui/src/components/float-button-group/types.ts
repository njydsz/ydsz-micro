/**
 * FloatButtonGroup 组件的 props / emits 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\float-button-group\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Component } from 'vue';

/** 展开方向 */
export type FloatButtonGroupDirection = 'down' | 'left' | 'right' | 'up';

/**
 * FloatButtonGroup 组件属性。
 */
export interface FloatButtonGroupProps {
  /** 自定义 CSS class */
  class?: string;
  /** 展开方向，默认 'up' */
  direction?: FloatButtonGroupDirection;
  /** 触发器图标（传入时作为默认触发器的图标） */
  icon?: Component;
  /** 是否展开（支持 v-model:open） */
  open?: boolean;
}

/**
 * FloatButtonGroup 组件事件。
 */
export interface FloatButtonGroupEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
}
