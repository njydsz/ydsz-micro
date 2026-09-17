/**
 * 表格列的内部定义（由 YdTableColumn 注册到 YdTable）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\ColumnDef.ts
 * @author ydsz-team
 * @since 4.2.0
 */
export interface ColumnDef {
  /** 列类型：index=序号列，selection=多选框，expand=展开行 */
  type?: 'index' | 'selection' | 'expand';
  /** 对应行数据的字段名 */
  prop?: string;
  /** 表头文本 */
  label?: string;
  /** 列宽度（CSS 值） */
  width?: string;
  /** 最小宽度 */
  minWidth?: string;
  /** 固定列位置 */
  fixed?: 'left' | 'right';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 内容超长省略+tooltip */
  showOverflowTooltip?: boolean;
  /** 格式化函数 */
  formatter?: (row: any, column: ColumnDef, cellValue: unknown, index: number) => string;
  /** 是否隐藏 */
  isHidden?: boolean;
  /** 源 YdTableColumn 实例 uid（用于定位插槽） */
  _uid?: number;
  /** 多级表头子列（仅在 group 类型时使用） */
  children?: ColumnDef[];
}

/** 表头行：一行可以包含多个列（多级表头使用） */
export type HeaderRow = ColumnDef[];
