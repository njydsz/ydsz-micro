/**
 * YdTable 组件相关的公共类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\table.types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 列定义：上层业务层描述列头、渲染内容与交互 */
export interface ColumnDef<T = unknown> {
  /** 唯一键（必须保证行内唯一，用作 v-for :key） */
  id: string;
  /** 表头显示文本 */
  header: string;
  /** 单元格渲染的 prop 字段名（从行数据取值） */
  accessorKey?: string;
  /** 单元格宽度（CSS width 值） */
  width?: string;
  /** 对齐方式，默认 'left' */
  align?: 'left' | 'center' | 'right';
  /** 是否允许排序，默认 false */
  sortable?: boolean;
  /** 自定义单元格渲染函数（优先级高于 accessorKey） */
  cell?: (row: T, index: number) => string;
  /** 自定义表头渲染函数（优先级高于 header） */
  headerCell?: () => string;
  /** 列固定位置（需要父容器 overflow 且定宽） */
  fixed?: 'left' | 'right';
}

/** YdTableEmpty 组件的 props：空数据占位展示 */
export interface TableEmptyProps {
  /** 空数据提示文本，默认 '暂无数据' */
  description?: string;
  /** 展示图标区域 slot 名称 */
  colspan?: number;
}
