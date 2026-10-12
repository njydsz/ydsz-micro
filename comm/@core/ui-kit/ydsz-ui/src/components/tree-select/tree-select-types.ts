/**
 * TreeSelect 组件的类型契约。
 *
 * <p>对标 Ant Design TreeSelect：
 * <ul>
 *   <li>下拉树形选择（单选/多选）</li>
 *   <li>虚拟滚动（大数据量）</li>
 *   <li>关键字搜索过滤</li>
 *   <li>多选标签展示</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree-select\tree-select-types.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { TreeNodeData } from '../tree/tree-types';

/** TreeSelect 组件属性 */
export interface TreeSelectProps<T = unknown> {
  /** 自定义 CSS class */
  class?: string;
  /** 选中的值（受控模式） */
  modelValue?: T | T[];
  /** 是否多选 */
  multiple?: boolean;
  /** 树形数据源 */
  data?: TreeNodeData[];
  /** 占位文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否显示搜索框 */
  searchable?: boolean;
  /** 搜索框占位文字 */
  searchPlaceholder?: string;
  /** 父子勾选是否独立 */
  checkStrictly?: boolean;
  /** 是否显示全选（仅多选模式） */
  showCheckAll?: boolean;
  /** 是否勾选路径展示完整标签（否则仅展示叶子节点） */
  onlyLeaf?: boolean;
  /** 自定义唯一键提取函数 */
  getKey?: (node: TreeNodeData) => string | number;
  /** 自定义显示文字提取函数 */
  getLabel?: (node: TreeNodeData) => string;
  /** 异步加载子节点的回调 */
  loadData?: (node: TreeNodeData) => Promise<TreeNodeData[]> | TreeNodeData[];
  /** 展开状态的 localStorage 键名 */
  expandedStorageKey?: string;
  /** 最大标签展示数（多选模式下超出折叠为 +N） */
  maxTagCount?: number;
  /** 是否启用虚拟滚动（大数据量） */
  virtualScroll?: boolean;
  /** 节点高度（px），用于虚拟滚动计算 */
  itemHeight?: number;
  /** 异步搜索的回调（搜索框触发） */
  searchMethod?: (keyword: string, node: TreeNodeData) => boolean;
  /** 显示方式：tag（标签），仅在多选有效 */
  tagVariant?: 'default' | 'light';
}

/** TreeSelect 组件事件 */
export interface TreeSelectEmits<T = unknown> {
  /** 选中值变化 */
  (e: 'update:modelValue', value: T | T[] | undefined): void;
  /** 选中节点变化（携带完整节点数据） */
  (e: 'change', nodes: TreeNodeData | TreeNodeData[] | undefined): void;
  /** 搜索关键字变化 */
  (e: 'search', keyword: string): void;
  /** 异步加载完成 */
  (e: 'load', node: TreeNodeData): void;
}

/** TreeSelect 暴露的方法 */
export interface TreeSelectExpose {
  /** 聚焦搜索框 */
  focus: () => void;
  /** 失焦 */
  blur: () => void;
  /** 清空选中值 */
  clear: () => void;
  /** 手动触发异步加载 */
  loadChildren: (node: TreeNodeData) => Promise<void>;
}
