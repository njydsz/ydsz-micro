/**
 * tree-table-utils —— YdTreeTable 纯函数工具集。
 *
 * <p>包含无副作用的纯函数：列对齐 class、单元格取值 / 格式化、缩进 style、
 * 列定义 → 渲染视图转换等。从 use-tree-table-core 提取，供组合入口与各子模块复用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\tree-table-utils.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeTableCellColumn, TreeTableRenderColumn } from './tree-table-shared-types';
import type { YdTreeTableColumnDef } from './types';
import type { CSSProperties } from 'vue';

/* ============================================================ */
/* 纯函数                                                        */
/* ============================================================ */

/**
 * 列对齐 class。
 *
 * @param align - 列对齐方式
 */
export function alignClass(align?: string): string {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
}

/**
 * 获取单元格值（优先使用 formatter）。
 *
 * @param row - 原始行数据
 * @param col - 单元格列描述
 * @returns 单元格值
 */
export function getCellValue<T extends Record<string, unknown>>(
  row: T,
  col: TreeTableCellColumn<T>,
): unknown {
  if (col.formatter) {
    const raw = (row as Record<string, unknown>)[col.key];
    return col.formatter(row, { key: col.key } as YdTreeTableColumnDef<T>, raw, 0);
  }
  return (row as Record<string, unknown>)[col.key];
}

/**
 * 格式化单元格显示文本。
 *
 * @param row - 原始行数据
 * @param col - 单元格列描述
 * @returns 格式化后的字符串（null / undefined 返回空串）
 */
export function formatCellValue<T extends Record<string, unknown>>(
  row: T,
  col: TreeTableCellColumn<T>,
): string {
  const value = getCellValue(row, col);
  return value === null || value === undefined ? '' : String(value);
}

/**
 * 缩进 style：根据 depth 计算 paddingLeft。
 *
 * @param depth - 节点层级深度
 * @param indentSize - 缩进单位（px）
 * @returns CSSProperties
 */
export function indentStyle(depth: number, indentSize: number): CSSProperties {
  const baseIndent = depth * indentSize;
  return {
    paddingLeft: `${baseIndent}px`,
  };
}

/**
 * 将列定义转换为渲染视图。
 *
 * @param columns - 列定义数组
 * @returns 渲染用列视图数组
 */
export function toRenderColumns<T extends Record<string, unknown>>(
  columns: YdTreeTableColumnDef<T>[],
): TreeTableRenderColumn<T>[] {
  return columns.map((col) => ({
    align: col.align,
    formatter: col.formatter,
    key: col.key,
    label: col.label ?? col.key,
    width: col.width,
  }));
}
