/**
 * YdFieldset —— 字段集组件 Props / Emits。
 *
 * 原生 fieldset 的封装，支持 legend 标题、可折叠、可禁用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\fieldset\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Fieldset 组件 Props */
export interface YdFieldsetProps {
  /** 图例文本（legend） */
  legend?: string;
  /** 是否可折叠 */
  toggleable?: boolean;
  /** 初始折叠状态 */
  collapsed?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 展开/折叠按钮位置 */
  togglePosition?: 'start' | 'end';
}

/** Fieldset 组件 Emits */
export interface YdFieldsetEmits {
  /** 折叠状态变化时触发，参数为展开后的值（true = 展开，false = 折叠） */
  (e: 'toggle', expanded: boolean): void;
}
