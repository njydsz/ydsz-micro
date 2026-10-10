/**
 * Table 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\table-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 表格尺寸 */
export type TableSize = 'sm' | 'md' | 'lg';

/**
 * Table 组件属性。
 */
export interface TableProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
  /** 是否显示斑马纹 @default false */
  striped?: boolean;
  /** 是否显示全边框 @default true */
  bordered?: boolean;
  /** 尺寸 @default 'md' */
  size?: TableSize;
}

/**
 * Table 组件事件。
 */
export interface TableEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
