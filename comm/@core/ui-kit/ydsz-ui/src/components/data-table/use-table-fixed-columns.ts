/**
 * use-table-fixed-columns —— 表格列固定（sticky）组合式 API。
 *
 * <p>根据列定义中的 {@link ColumnFixedConfig.fixed} 字段，将列拆分为
 * 左固定 / 右固定 / 不固定三个分组，并提供 sticky 定位样式计算。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-fixed-columns.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import { computed, toValue } from 'vue';

import type { ComputedRef, MaybeRefOrGetter } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 列固定配置 */
export interface ColumnFixedConfig {
  /** 列唯一 key */
  key: string;
  /** 列宽度（px），用于 sticky 累加定位 */
  width?: number;
  /** 固定位置 */
  fixed?: 'left' | 'right';
}

/** 固定列分组结果 */
export interface FixedColumnsResult {
  /** 左固定列（保持原始顺序） */
  leftFixedColumns: ComputedRef<ReadonlyArray<ColumnFixedConfig>>;
  /** 右固定列（保持原始顺序） */
  rightFixedColumns: ComputedRef<ReadonlyArray<ColumnFixedConfig>>;
  /** 不固定列 */
  unfixedColumns: ComputedRef<ReadonlyArray<ColumnFixedConfig>>;
}

/** 固定列样式 */
export interface FixedColumnStyle {
  position: 'sticky';
  left?: string;
  right?: string;
  zIndex: number;
}

/* ============================================================ */
/* useFixedColumns                                               */
/* ============================================================ */

/**
 * useFixedColumns —— 将响应式列定义拆分为左/右/不固定三组。
 *
 * @param columns - 列定义响应式源（支持 ref / getter / 静态数组）
 * @returns 拆分后的列分组
 *
 * @example
 * ```ts
 * const columns = ref([
 *   { key: 'name', width: 120, fixed: 'left' },
 *   { key: 'age', width: 80 },
 *   { key: 'action', width: 160, fixed: 'right' },
 * ]);
 *
 * const { leftFixedColumns, rightFixedColumns, unfixedColumns } = useFixedColumns(columns);
 * ```
 */
export function useFixedColumns(
  columns: MaybeRefOrGetter<ColumnFixedConfig[]>,
): FixedColumnsResult {
  /** 原始列（只读包装） */
  const readonlyColumns = computed<ReadonlyArray<ColumnFixedConfig>>(() => {
    const raw = toValue(columns);
    return Object.freeze(raw.map((col) => Object.freeze({ ...col })));
  });

  /** 左固定列 */
  const leftFixedColumns = computed<ReadonlyArray<ColumnFixedConfig>>(() =>
    readonlyColumns.value.filter((col) => col.fixed === 'left'),
  );

  /** 右固定列 */
  const rightFixedColumns = computed<ReadonlyArray<ColumnFixedConfig>>(() =>
    readonlyColumns.value.filter((col) => col.fixed === 'right'),
  );

  /** 不固定列 */
  const unfixedColumns = computed<ReadonlyArray<ColumnFixedConfig>>(() =>
    readonlyColumns.value.filter((col) => !col.fixed),
  );

  return {
    leftFixedColumns,
    rightFixedColumns,
    unfixedColumns,
  };
}

/* ============================================================ */
/* fixedColumnStyle                                              */
/* ============================================================ */

/** 固定列 z-index 基准值 */
const FIXED_Z_INDEX = 2;

/**
 * 根据列在固定组中的位置计算 sticky 定位样式。
 *
 * @param column - 列配置（必须含 fixed 字段）
 * @param position - 固定侧（'left' | 'right'）
 * @param peerColumns - 同侧所有列（用于累加计算偏移量）
 * @returns 行内样式对象
 *
 * @example
 * ```ts
 * // 计算左起第 2 列（前序列宽 120 + 80）
 * const style = fixedColumnStyle(ageCol, 'left', leftCols);
 * // { position: 'sticky', left: '120px', zIndex: 2 }
 * ```
 */
export function fixedColumnStyle(
  column: ColumnFixedConfig,
  position: 'left' | 'right',
  peerColumns: ReadonlyArray<ColumnFixedConfig>,
): FixedColumnStyle {
  const side: 'left' | 'right' = column.fixed ?? position;

  // 找到当前列在同侧列中的索引
  const idx = peerColumns.findIndex((c) => c.key === column.key);
  if (idx <= 0) {
    return { position: 'sticky', [side]: '0px', zIndex: FIXED_Z_INDEX };
  }

  // 累加前面同侧列的宽度
  let offset = 0;
  for (let i = 0; i < idx; i++) {
    offset += peerColumns[i].width ?? 100;
  }

  return {
    position: 'sticky',
    [side]: `${offset}px`,
    zIndex: FIXED_Z_INDEX,
  };
}
