/**
 * Card 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\card\card-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 卡片内边距级别 */
export type CardPadding = 'sm' | 'md' | 'lg';

/** 卡片阴影级别 */
export type CardShadow = 'flat' | 'low' | 'medium' | 'high';

/**
 * Card 组件属性。
 */
export interface CardProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
  /** 内边距级别 @default 'md' */
  padding?: CardPadding;
  /** 阴影级别 @default 'low' */
  shadow?: CardShadow;
}

/**
 * Card 组件事件。
 */
export interface CardEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
