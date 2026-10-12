/**
 * Cascader 级联选择器类型定义。
 *
 * @module primitives/cascader/types
 * @author ydsz-team
 * @since 1.0.0
 */

/** 级联选项节点 */
export interface CascaderOption {
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否叶节点（无 children 即为叶节点，此属性可强制指定） */
  isLeaf?: boolean;
  /** 子节点 */
  children?: CascaderOption[];
  /** 显示标签 */
  label: string;
  /** 值 */
  value: string | number;
  /** 自定义数据 */
  [key: string]: unknown;
}

/** 搜索策略 */
export type CascaderShowSearch =
  | boolean
  | {
      filter?: (inputValue: string, path: CascaderOption[]) => boolean;
      render?: (inputValue: string, path: CascaderOption[]) => any;
      sort?: (a: CascaderOption[], b: CascaderOption[], inputValue: string) => number;
    };

/** 级联选择器 props */
export interface CascaderProps {
  /** 自定义类名 */
  class?: any;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 是否支持多选 */
  multiple?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 数据源 */
  options: CascaderOption[];
  /** 占位符 */
  placeholder?: string;
  /** 尺寸 */
  size?: 'default' | 'large' | 'small';
  /** 展开触发方式 */
  expandTrigger?: 'click' | 'hover';
  /** 是否显示搜索框 */
  showSearch?: CascaderShowSearch;
  /** 选中值（受控） */
  modelValue?: (string | number)[] | (string | number)[][];
  /** 分隔符 */
  separator?: string;
  /** 仅显示末级标签 */
  displayRender?: (labels: string[]) => string;
  /** 自定义标签渲染 */
  tagRender?: (option: { label: string; value: string | number; closable: boolean }) => any;
  /** 自定义下拉容器 */
  getPopupContainer?: () => HTMLElement;
  /** 是否支持半选状态 */
  checkStrictly?: boolean;
  /** 加载数据异步回调 */
  loadData?: (selectedOptions: CascaderOption[]) => Promise<void>;
  /** 最大标签数（多选模式） */
  maxTagCount?: number;
}
