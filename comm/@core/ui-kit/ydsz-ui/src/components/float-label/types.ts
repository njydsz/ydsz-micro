/**
 * YdFloatLabel —— 浮动标签组件 Props。
 *
 * 三种变体：on（永远浮动）、in（输入时浮动）、over（未输入时盖在输入框上）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\float-label\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** FloatLabel 组件 Props */
export interface YdFloatLabelProps {
  /** 浮动模式：on=永远浮动 | in=输入/聚焦时浮动 | over=未输入时盖在输入框上 */
  variant?: 'on' | 'in' | 'over';
  /** 是否禁用 */
  disabled?: boolean;
}
