/**
 * use-table-group-header —— 多级表头（分组表头）组合式 API。
 *
 * <p>递归解析含 {@link TableColumn.children} 的嵌套列定义，输出：
 * <ul>
 *   <li>{@link flatColumnsLeaf}: 全部叶子列，用于实际渲染表头底行和单元格；</li>
 *   <li>{@link headerRows}: 二维数组，每个内层数组代表一层表头行。</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-group-header.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import { computed, toValue } from 'vue';

import type { ComputedRef, MaybeRefOrGetter } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 单个表头单元（带 rowspan/colspan） */
export interface HeaderCell {
  /** 列 key（叶子列独有，用于关联数据字段） */
  key?: string;
  /** 显示标签 */
  label: string;
  /** 行合并数 */
  rowspan: number;
  /** 列合并数 */
  colspan: number;
  /** 是否为叶子列 */
  isLeaf: boolean;
  /** 原始列引用（只读） */
  readonly column: Readonly<TableColumn>;
}

/** 表头行 */
export type HeaderRow = ReadonlyArray<HeaderCell>;

/** 多级表头列定义 */
export interface TableColumn {
  /** 列唯一 key */
  key?: string;
  /** 显示标签（渲染为表头文本） */
  label: string;
  /** 子列（含 children 的列为父节点，渲染 colspan = 子列数之和） */
  children?: TableColumn[];
}

/** 多级表头解析结果 */
export interface GroupHeaderResult {
  /** 全部叶子列（用于实际单元格渲染和表头底行） */
  flatColumnsLeaf: ComputedRef<ReadonlyArray<TableColumn>>;
  /** 分层表头行（二维数组，从上到下每一层表头对应一个 HeaderRow） */
  headerRows: ComputedRef<ReadonlyArray<HeaderRow>>;
}

/* ============================================================ */
/* 内部工具函数                                                  */
/* ============================================================ */

/**
 * 递归计算列的叶子数量（colspan 等价于叶子子列数量之和）。
 *
 * @param column - 表头列定义
 * @returns 叶子节点数
 */
function getLeafCount(column: TableColumn): number {
  if (!column.children?.length) {
    return 1;
  }
  return column.children.reduce((sum, child) => sum + getLeafCount(child), 0);
}

/**
 * 递归计算列的最大深度（用于确定 rowspan）。
 *
 * <p>叶子列 depth = 1；含子列时 depth = 1 + max(children depth)。
 *
 * @param column - 表头列定义
 * @returns 以当前节点为根的树深度
 */
function getDepth(column: TableColumn): number {
  if (!column.children?.length) {
    return 1;
  }
  return 1 + Math.max(...column.children.map(getDepth));
}

/* ============================================================ */
/* useTableGroupHeader                                           */
/* ============================================================ */

/**
 * useTableGroupHeader —— 将嵌套列定义解析为分层表头 + 叶子列。
 *
 * @param columns - 响应式嵌套列定义（支持 ref / getter / 静态数组）
 * @returns 分层表头和叶子列
 *
 * @example
 * ```ts
 * const columns = ref([
 *   { label: '基础信息', children: [
 *     { key: 'name', label: '姓名' },
 *     { key: 'age', label: '年龄' },
 *   ]},
 *   { key: 'email', label: '邮箱' },
 * ]);
 *
 * const { flatColumnsLeaf, headerRows } = useTableGroupHeader(columns);
 * // headerRows.value → [
 * //   [{ label: '基础信息', colspan: 2, rowspan: 1 }, { label: '邮箱', colspan: 1, rowspan: 2 }],
 * //   [{ key: 'name', label: '姓名', colspan: 1, rowspan: 1 }, { key: 'age', label: '年龄', colspan: 1, rowspan: 1 }],
 * // ]
 * ```
 */
export function useTableGroupHeader(
  columns: MaybeRefOrGetter<TableColumn[]>,
): GroupHeaderResult {
  /** 全部叶子列（只读） */
  const flatColumnsLeaf = computed<ReadonlyArray<TableColumn>>(() => {
    const result: TableColumn[] = [];
    collectLeaves(toValue(columns), result);
    return Object.freeze(result);
  });

  /** 分层表头行（只读二维数组） */
  const headerRows = computed<ReadonlyArray<HeaderRow>>(() => {
    const raw = toValue(columns);
    return Object.freeze(buildHeaderRows(raw));
  });

  return { flatColumnsLeaf, headerRows };
}

/* ============================================================ */
/* 内部构建逻辑                                                  */
/* ============================================================ */

/**
 * 递归收集所有叶子列到输出数组。
 *
 * @param cols - 当前层级列
 * @param out - 叶子输出数组
 */
function collectLeaves(cols: readonly TableColumn[], out: TableColumn[]): void {
  for (const col of cols) {
    if (col.children?.length) {
      collectLeaves(col.children, out);
    } else {
      out.push(col);
    }
  }
}

/**
 * 根据顶层列定义构建二维表头行。
 *
 * @param topColumns - 顶层列数组
 * @returns 二维表头
 */
function buildHeaderRows(topColumns: readonly TableColumn[]): readonly HeaderRow[] {
  const maxDepth = topColumns.reduce((max, col) => Math.max(max, getDepth(col)), 0);
  const rows: HeaderCell[][] = [];

  // 逐层构建
  for (let depth = 0; depth < maxDepth; depth++) {
    const row: HeaderCell[] = [];
    fillRowAtDepth(topColumns, depth, 0, maxDepth, row);
    if (row.length > 0) {
      rows.push(Object.freeze(row));
    }
  }

  return rows;
}

/**
 * 递归将指定深度的列信息填入当前行的 cells 数组。
 *
 * @param cols - 当前层级列
 * @param targetDepth - 目标行索引（0 开始）
 * @param currentDepth - 当前深度（递归计数）
 * @param maxDepth - 整棵树的深度（用于计算叶子 rowspan）
 * @param outRow - 输出行
 */
function fillRowAtDepth(
  cols: readonly TableColumn[],
  targetDepth: number,
  currentDepth: number,
  maxDepth: number,
  outRow: HeaderCell[],
): void {
  for (const col of cols) {
    if (currentDepth === targetDepth) {
      // 叶子或不展开到此层：写入当前行
      const leaf = !col.children?.length;
      outRow.push({
        key: col.key,
        label: col.label,
        rowspan: leaf ? maxDepth - currentDepth : 1,
        colspan: getLeafCount(col),
        isLeaf: leaf,
        column: Object.freeze({ ...col }),
      });
      continue;
    }

    // 递归进入子层
    if (col.children?.length) {
      fillRowAtDepth(col.children, targetDepth, currentDepth + 1, maxDepth, outRow);
    }
  }
}
