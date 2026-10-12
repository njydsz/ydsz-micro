/**
 * Tag 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tag\tag-types.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { Component } from 'vue';

export type TagVariant = 'default' | 'outline' | 'primary' | 'success' | 'warning' | 'danger';
export type TagSize = 'small' | 'default' | 'large';

/** Tag 组件属性。 */
export interface TagProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 样式变体 */
  variant?: TagVariant;
  /** 尺寸 */
  size?: TagSize;
  /** 是否可关闭（显示关闭按钮） */
  closable?: boolean;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 自定义图标 */
  icon?: Component | string;
  /** 是否可见（受控模式） */
  open?: boolean;
}

/** Tag 组件事件。 */
export interface TagEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
  /** 关闭回调 */
  (e: 'close'): void;
}
