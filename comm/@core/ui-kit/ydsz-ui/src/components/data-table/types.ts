/**
 * YdDataTable 类型契约 —— 列定义 / 树形配置 / 插槽作用域。
 *
 * <p>从 YdDataTable.vue 抽离，供表头单元格、表体单元格子组件与主组件共用，
 * 避免组件之间形成类型循环依赖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\types.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { SortOrder, TableColumnDef } from '../../composables/use-table-data';
import type { CellEditOption, CellEditType } from '../../composables/use-table-editing';
import type { ColumnFixedConfig } from './use-table-fixed-columns';
import type { TableColumn } from './use-table-group-header';

import type { CSSProperties } from 'vue';

export type { CellEditOption, CellEditType };

/**
 * 数据表格列定义 —— 扩展 base TableColumnDef，支持固定列 / 多级表头 / 行内编辑 / 格式化。
 *
 * <p>仅当启用相应特性时才需传入对应字段：
 * <ul>
 *   <li>{@link TableColumnDef} 基础属性（key / isSortable / sorter / filters / filterMethod）</li>
 *   <li>{@link fixed} / {@link width} —— 列固定定位（传给 useFixedColumns）</li>
 *   <li>{@link label} / {@link children} —— 多级表头分组（传给 useTableGroupHeader）</li>
 *   <li>{@link editable} / {@link editType} / {@link editOptions} / {@link editValidator} —— 行内编辑</li>
 *   <li>{@link formatter} —— 单元格文本格式化（插槽优先级更高）</li>
 * </ul>
 *
 * @typeParam T - 行数据类型
 */
export type DataTableColumnDef<T = Record<string, unknown>> = TableColumnDef<T> &
  ColumnFixedConfig &
  TableColumn & {
    /** 该列是否可编辑（editable=true 时生效，默认 false 不参与编辑） */
    editable?: boolean;
    /** 编辑类型（默认 'input'） */
    editType?: CellEditType;
    /** 编辑选项（仅 select 类型使用） */
    editOptions?: CellEditOption[];
    /** 单元格对齐方式（透传给 YdTableCell / YdTableHead） */
    align?: 'left' | 'center' | 'right';
    /**
     * 单元格文本格式化，返回值直接用于展示与导出。
     *
     * @param row - 当前行数据
     * @param value - 当前列原始值
     * @param rowIndex - 当前行在视图数据中的下标
     * @returns 展示文本
     */
    formatter?: (row: T, value: unknown, rowIndex: number) => string | number;
    /**
     * 自定义编辑校验。
     *
     * @param value - 当前输入字符串
     * @param row - 行数据
     * @returns null 表示通过，否则返回错误文案
     */
    editValidator?: (value: string, row: T) => string | null;
  };

/**
 * 树形表格配置。
 */
export interface TreeConfig {
  /** 子节点的 key 字段名（默认 'children'） */
  childrenKey?: string;
  /** 默认展开的 key 列表 */
  defaultExpandedKeys?: string[];
  /** 展开行的 key（受控模式） */
  expandedKeys?: string[];
  /** 是否有子节点的判断字段（可选） */
  hasChildrenKey?: string;
}

/**
 * 树形扁平化行：附带深度与是否有子节点信息。
 *
 * @typeParam T - 行数据类型
 */
export interface TreeFlatRow<T> {
  /** 原始行数据 */
  row: T;
  /** 层级深度（根节点为 0） */
  depth: number;
  /** 是否存在子节点 */
  hasChildren: boolean;
  /** 行唯一 key */
  key: string;
}

/**
 * 单元格插槽作用域（`#cell-{columnKey}` / `#cell` 可接收的参数）。
 *
 * @typeParam T - 行数据类型
 */
export interface CellSlotProps<T> {
  /** 当前行数据 */
  row: T;
  /** 当前列 key */
  columnKey: string;
  /** 原始值（未格式化） */
  value: unknown;
  /** 展示文本（formatter 之后、空值兜底 '-' 之前的结果） */
  text: string | number;
  /** 行下标 */
  rowIndex: number;
}

/**
 * 表头插槽作用域（`#header-{columnKey}` / `#header` 可接收的参数）。
 */
export interface HeaderSlotProps {
  /** 当前列 key */
  columnKey: string;
  /** 表头文本 */
  label: string;
  /** 排序方向（未启用排序时为 null） */
  order: 'asc' | 'desc' | null;
  /** 多列排序中的次序（从 1 开始；单列排序或未参与排序为 null） */
  rank: number | null;
}

/** 汇总行函数类型 */
export type SummaryRowFn<T> = (data: T[]) => Record<string, string | number>;

/**
 * 列视图 —— 把「左固定 / 中间 / 右固定 + 列虚拟占位」压平成表头与表体共用的渲染序列。
 *
 * <p>表头、表体、汇总行都遍历同一份 ColumnView 数组，从根上保证列数与 colspan 对齐。
 */
export interface ColumnView {
  /** 列 key（占位列使用合成 key） */
  key: string;
  /** 表头文本 */
  label: string;
  /** 对齐方式 */
  align: 'left' | 'center' | 'right';
  /** 是否可排序 */
  sortable: boolean;
  /** 是否可编辑 */
  editable: boolean;
  /** 当前排序方向 */
  order: SortOrder | null;
  /** 多列排序中的次序 */
  rank: number | null;
  /** 列顺序拖拽下标（-1 表示不参与拖拽） */
  dragIndex: number;
  /** 是否列虚拟滚动占位 */
  isSpacer: boolean;
  /** 占位列跨越列数 */
  colspan: number;
  /** 跨越的表头行数（多级表头下的固定列） */
  rowspan: number;
  /** 表头与单元格共用样式（列宽 / 固定偏移） */
  style?: CSSProperties;
  /** 表头附加类名 */
  headClass: string;
  /** 单元格附加类名 */
  cellClass: string;
}

/**
 * 行视图 —— 行虚拟滚动后的可见行。
 *
 * @typeParam T - 行数据类型
 */
export interface RowView<T> {
  /** 行在渲染序列中的下标 */
  index: number;
  /** 行唯一 key */
  key: string;
  /** 行数据（树形模式下为扁平化后的原始行） */
  row: T;
  /** 树形节点信息（非树形模式为 undefined） */
  node?: TreeFlatRow<T>;
}
