/**
 * Cascader 级联选择器组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/** 级联数据项 */
export interface CascaderOption {
  /** 显示文本 */
  label: string;
  /** 值 */
  value: string | number;
  /** 子选项 */
  children?: CascaderOption[];
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否为叶子节点 */
  isLeaf?: boolean;
}

/**
 * Cascader 组件属性。
 */
export interface CascaderProps {
  /** 自定义 CSS class */
  class?: string;
  /** 级联数据 */
  options: CascaderOption[];
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否支持清除 */
  allowClear?: boolean;
  /** 选择策略：any-任意节点 | leaf-仅叶子节点 */
  strategy?: 'any' | 'leaf';
  /** 分隔符 */
  separator?: string;
}

/**
 * Cascader 组件事件。
 */
export interface CascaderEmits {
  /** 选中值变化 */
  (e: 'update:value', value: (string | number)[] | (string | number)[][]): void;
  /** 选项展开 */
  (e: 'expand', path: CascaderOption[]): void;
}
