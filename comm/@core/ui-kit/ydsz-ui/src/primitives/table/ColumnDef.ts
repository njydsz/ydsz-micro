/**
 * 表格列的内部定义（由 YdTableColumn 注册到 YdTable）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\ColumnDef.ts
 * @author ydsz-team
 * @since 4.2.0 (26.09.17 增强：拖拽/显隐/排序/固定)
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
  /** 最大宽度（可拖拽拉宽场景使用） */
  maxWidth?: string;
  /** 固定列位置 */
  fixed?: 'left' | 'right';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 内容超长省略+tooltip */
  showOverflowTooltip?: boolean;
  /** 格式化函数 */
  formatter?: (row: any, column: ColumnDef, cellValue: unknown, index: number) => string;
  /** 是否隐藏（可被列设置面板控制） */
  isHidden?: boolean;
  /** 是否允许用户通过列设置面板隐藏，默认 true */
  hideable?: boolean;
  /** 是否允许列拖拽排序，默认 true */
  draggable?: boolean;
  /** 是否允许通过表头点击排序（仅数据列生效） */
  isSortable?: boolean;
  /** 当前排序方向（asc / desc / null） */
  sortOrder?: 'asc' | 'desc' | null;
  /** 列拖拽顺序权重（越小越靠前，持久化恢复用） */
  sort?: number;
  /** 源 YdTableColumn 实例 uid（用于定位插槽） */
  _uid?: number;
  /** 多级表头子列（仅在 group 类型时使用） */
  children?: ColumnDef[];
}

/** 表头行：一行可以包含多个列（多级表头使用） */
export type HeaderRow = ColumnDef[];
