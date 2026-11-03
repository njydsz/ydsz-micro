/**
 * tree-table-shared-types —— YdTreeTable 内部模块间共享类型。
 *
 * <p>存放各子 composable / 工具模块之间共享的类型定义，
 * 避免 use-tree-table-core 与各子模块之间的循环依赖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\tree-table-shared-types.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeFlatRow, YdTreeTableColumnDef, YdTreeTableEmits, YdTreeTableProps } from './types';
import type { CSSProperties, ComputedRef, Ref } from 'vue';

/* ============================================================ */
/* 类型定义                                                      */
/* ============================================================ */

/** 渲染用列视图 */
export interface TreeTableRenderColumn<T extends Record<string, unknown>> {
  key: string;
  label?: string;
  width?: number | string;
  align?: string;
  formatter?: YdTreeTableColumnDef<T>['formatter'];
}

/** 单元格取值列描述 */
export interface TreeTableCellColumn<T extends Record<string, unknown>> {
  key: string;
  formatter?: YdTreeTableColumnDef<T>['formatter'];
}

/**
 * 已解析默认值的 Props（组件内 withDefaults 后的等价类型）。
 *
 * <p>composable 接收的是 withDefaults 处理后的 props，
 * 可选字段已有默认值，此处收窄为必填以便内部安全访问。
 */
export type ResolvedTreeTableProps<T extends Record<string, unknown>> =
  Required<Pick<YdTreeTableProps<T>, 'childrenKey' | 'rowKey' | 'indentSize' | 'showLine' | 'treeColumnIndex' | 'checkable' | 'checkStrictly' | 'draggable' | 'lazy' | 'defaultExpandedKeys' | 'defaultCheckedKeys'>>
  & YdTreeTableProps<T>;

/** useTreeTableCore 配置 */
export interface UseTreeTableCoreOptions<T extends Record<string, unknown>> {
  /** 组件 props（响应式，已含默认值） */
  props: ResolvedTreeTableProps<T>;
  /** 组件 emits 触发器 */
  emit: YdTreeTableEmits;
}

/** useTreeTableCore 返回句柄 */
export interface UseTreeTableCoreReturn<T extends Record<string, unknown>> {
  /** 当前可见扁平行 */
  flatRows: ComputedRef<TreeFlatRow<T>[]>;
  /** 渲染用列视图 */
  renderColumns: ComputedRef<TreeTableRenderColumn<T>[]>;
  /** 内部展开 keys */
  internalExpandedKeys: Ref<Set<string>>;
  /** 是否正在拖拽（供模板判定 data 属性） */
  isDragging: () => boolean;
  /** 当前拖拽起始索引 */
  fromIndex: () => number;
  /** 当前拖拽落点索引 */
  toIndex: () => number;
  /** 展开指定 key */
  expandKey: (key: string) => void;
  /** 收起指定 key */
  collapseKey: (key: string) => void;
  /** 切换展开 / 收起 */
  toggleExpand: (key: string) => void;
  /** 展开全部 */
  expandAll: () => void;
  /** 收起全部 */
  collapseAll: () => void;
  /** 展开指定节点（expose 别名） */
  expandNode: (key: string) => void;
  /** 收起指定节点（expose 别名） */
  collapseNode: (key: string) => void;
  /** 点击展开 / 折叠图标（含懒加载） */
  handleToggleExpand: (flatRow: TreeFlatRow<T>) => void;
  /** 懒加载节点 */
  handleLazyLoad: (key: string) => Promise<void>;
  /** 是否已勾选 */
  isChecked: (key: string) => boolean;
  /** 是否半选 */
  isHalfChecked: (key: string) => boolean;
  /** 节点是否加载中 */
  isNodeLoading: (key: string) => boolean;
  /** 切换复选框（含级联） */
  toggleCheckbox: (flatRow: TreeFlatRow<T>) => void;
  /** 单元格 pointerdown（仅 root 行开启拖拽） */
  onCellPointerDown: (event: PointerEvent, index: number) => void;
  /** 缩进 style */
  indentStyle: (flatRow: TreeFlatRow<T>) => CSSProperties;
  /** 某一层祖先是否还有后续兄弟（决定是否画竖线） */
  hasAncestorSibling: (flatRow: TreeFlatRow<T>, depthLevel: number) => boolean;
  /** 列对齐 class */
  alignClass: (align?: string) => string;
  /** 获取单元格值 */
  getCellValue: (row: T, col: TreeTableCellColumn<T>) => unknown;
  /** 格式化单元格显示文本 */
  formatCellValue: (row: T, col: TreeTableCellColumn<T>) => string;
  /** 获取已勾选节点 */
  getCheckedNodes: () => T[];
  /** 获取半选节点 */
  getHalfCheckedNodes: () => T[];
}
