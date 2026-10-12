/**
 * YdTreeTable 树形表格复合组件的 Props / Emits / Ref 类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\types.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TableColumnDef } from '../../composables/use-table-data';

/* ============================================================ */
/* Column                                                         */
/* ============================================================ */

/** YdTreeTable 列定义（扩展 TableColumnDef） */
export interface YdTreeTableColumnDef<T = Record<string, unknown>>
  extends TableColumnDef<T> {
  /** 列标题（显示于表头） */
  label?: string;
  /** 列宽度（px 或 css 字符串如 '120px' / '10%'） */
  width?: number | string;
  /** 列对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 自定义单元格格式化函数 */
  formatter?: (row: T, column: YdTreeTableColumnDef<T>, cellValue: unknown, index: number) => unknown;
}

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

/** YdTreeTable 组件 Props */
export interface YdTreeTableProps<T extends Record<string, unknown>> {
  /** 树形数据源 */
  dataSource: T[];
  /** 列定义（普通列定义，无需关心 tree 列如何渲染） */
  columns: YdTreeTableColumnDef<T>[];
  /** 子节点字段名 @default 'children' */
  childrenKey?: string;
  /** 节点 key 字段名 @default 'id' */
  rowKey?: string;
  /** 默认展开的 key 列表 */
  defaultExpandedKeys?: string[];
  /** 是否显示连接线 @default true */
  showLine?: boolean;
  /** 缩进单位（px）@default 24 */
  indentSize?: number;
  /** 展开图标放在第几列，从 0 开始 @default 0（即第一列） */
  treeColumnIndex?: number;
  /** 是否可拖拽排序行 @default false */
  draggable?: boolean;
  /** **流式** 异步加载函数（仅 lazy=true 时生效）：展开无子节点的节点时自动调用 */
  loadData?: (node: T) => Promise<T[]>;
  /** 是否懒加载（展开空节点时调用 loadData）@default false */
  lazy?: boolean;
  /** 正在加载中的节点 key 集合（外部可传入以指示加载态） */
  loadingKeys?: string[];
  /** 是否启用复选框（父子级联选择）@default false */
  checkable?: boolean;
  /** 是否严格模式（父子选择互不影响）@default false */
  checkStrictly?: boolean;
  /** 默认已勾选 keys */
  defaultCheckedKeys?: string[];
  /** 自定义 props 透传类名 */
  class?: string;
}

/* ============================================================ */
/* Emits                                                          */
/* ============================================================ */

/** YdTreeTable 组件 Emits */
export interface YdTreeTableEmits {
  /** 展开/收起 keys 变化（受控模式：v-model:expandedKeys） */
  (e: 'update:expandedKeys', keys: string[]): void;
  /** 节点勾选变化 */
  (e: 'check-change', checkedKeys: string[], halfCheckedKeys: string[]): void;
  /** 单个节点展开 */
  (e: 'expand', key: string, row: Record<string, unknown>): void;
  /** 单个节点收起 */
  (e: 'collapse', key: string, row: Record<string, unknown>): void;
  /** 节点异步加载完成 */
  (e: 'load-success', key: string, children: Record<string, unknown>[]): void;
  /** 拖拽结束 */
  (e: 'drag-end', fromIndex: number, toIndex: number): void;
}

/* ============================================================ */
/* Ref Handle                                                     */
/* ============================================================ */

/** YdTreeTable 命令式 API（通过 ref 调用） */
export interface YdTreeTableRef<T extends Record<string, unknown> = Record<string, unknown>> {
  /** 展开全部节点 */
  expandAll: () => void;
  /** 收起全部节点 */
  collapseAll: () => void;
  /** 展开指定 key 节点 */
  expandNode: (key: string) => void;
  /** 收起指定 key 节点 */
  collapseNode: (key: string) => void;
  /** 获取当前所有已勾选节点（包含半选节点的全选场景） */
  getCheckedNodes: () => T[];
  /** 获取当前处于半选状态（子节点部分选中）的节点 */
  getHalfCheckedNodes: () => T[];
}

/* ============================================================ */
/* Internal                                                       */
/* ============================================================ */

/** 扁平化树节点（内部渲染模型） */
export interface TreeFlatRow<T extends Record<string, unknown>> {
  /** 原始行数据 */
  row: T;
  /** 层级深度（root 节点为 0） */
  depth: number;
  /** 是否有子节点 */
  hasChildren: boolean;
  /** 节点 rowKey 值 */
  key: string;
  /** 父节点 rowKey 值 */
  parentKey: string | null;
  /** 祖先节点 rowKey 路径（从 root 到 parent） */
  ancestorKeys: string[];
}
