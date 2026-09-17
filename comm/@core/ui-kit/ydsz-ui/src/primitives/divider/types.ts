/**
 * Divider 分隔线类型定义。
 *
 * @module primitives/divider/types
 * @author ydsz-team
 * @since 1.0.0
 */

/** Divider 属性 */
export interface DividerProps {
  /** 自定义类名 */
  class?: any;
  /** 是否虚线 */
  dashed?: boolean;
  /** 标签位置（仅带标签时生效） */
  orientation?: 'center' | 'left' | 'right';
  /** 方向 */
  type?: 'horizontal' | 'vertical';
}
