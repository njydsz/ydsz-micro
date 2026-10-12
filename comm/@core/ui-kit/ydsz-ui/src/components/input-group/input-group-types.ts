/**
 * YdInputGroup / YdInputAddon 的共享类型定义。
 *
 * 单独抽出类型文件，是为了让外部可以从同一个入口拿到两类 prop 的类型，
 * 而不必关心组件各自的实现细节。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\input-group\input-group-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 输入框组合的尺寸档位 */
export type InputGroupSize = 'sm' | 'md' | 'lg';

/** YdInputGroup 的 props */
export interface YdInputGroupProps {
  /** 是否紧凑模式：相邻子元素边框合并，类似 ANT compact */
  compact?: boolean;
  /** 尺寸 */
  size?: InputGroupSize;
  /** 自定义类名 */
  class?: any;
}

/** YdInputAddon 的 props */
export interface YdInputAddonProps {
  /** 是否裸边模式：去除内边距前缀，紧贴输入框 */
  isPlain?: boolean;
  /** 自定义类名 */
  class?: any;
}
