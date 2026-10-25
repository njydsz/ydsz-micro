/**
 * useTableColumnLayout —— 列渲染序列装配（固定列 / 多级表头 / 列虚拟滚动 / 顺序拖拽）。
 *
 * <p>把「左固定 + 中间（可能含虚拟占位）+ 右固定」压成一份 {@link ColumnView} 序列，
 * 表头、表体、汇总行共用同一份数据，保证列数与 colspan/rowspan 始终对齐。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-column-layout.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import { computed, ref, toValue, watch } from 'vue';

import { useVirtualizer } from '@tanstack/vue-virtual';

import { cn } from '@ydsz-core/shared/utils';

import { useColumnDrag } from '../../composables/use-column-drag';
import { fixedColumnStyle, useFixedColumns } from './use-table-fixed-columns';
import { useTableGroupHeader } from './use-table-group-header';

import type { CSSProperties, ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type { ColumnFixedConfig } from './use-table-fixed-columns';
import type { HeaderRow, TableColumn } from './use-table-group-header';
import type { ColumnView, DataTableColumnDef } from './types';

/** 参与列虚拟滚动的最小列数（低于该值全量渲染更划算） */
const VIRTUAL_COLUMN_THRESHOLD = 50;

/** 列虚拟滚动视口外预渲染列数 */
const COLUMN_OVERSCAN = 5;

/** 列宽缺省值（像素），列定义未声明 width 时使用 */
const DEFAULT_COLUMN_WIDTH = 120;

/** useTableColumnLayout 配置 */
export interface TableColumnLayoutOptions<T extends Record<string, unknown>> {
  /** 全量列定义（含多级表头分组） */
  columns: MaybeRefOrGetter<DataTableColumnDef<T>[]>;
  /** 是否启用列虚拟滚动 */
  columnVirtualizer?: MaybeRefOrGetter<boolean>;
  /** 行内编辑总开关（决定列视图是否标记 editable） */
  editable?: MaybeRefOrGetter<boolean>;
  /** 是否启用固定列 */
  enableFixedColumns?: MaybeRefOrGetter<boolean>;
  /** 是否启用多级表头 */
  enableGroupHeader?: MaybeRefOrGetter<boolean>;
  /** 列虚拟估算宽度（像素） */
  estimateColumnWidth?: MaybeRefOrGetter<number>;
  /** 列 key → 列定义查找（需覆盖分组叶子列） */
  findColumn: (columnKey: string) => DataTableColumnDef<T> | undefined;
  /** 列顺序拖拽完成回调 */
  onReorder?: (payload: {
    columns: DataTableColumnDef<T>[];
    fromIndex: number;
    toIndex: number;
  }) => void;
  /** 是否启用列宽拖拽 */
  resizable?: MaybeRefOrGetter<boolean>;
  /** 列宽拖拽结果（CSS 宽度值），未定制时返回 undefined */
  resizedWidth?: (columnKey: string) => string | undefined;
  /** 是否启用列顺序拖拽 */
  reorderable?: MaybeRefOrGetter<boolean>;
  /** 滚动容器（列虚拟器测量可视宽度用） */
  scrollElement: () => Element | null;
  /** 是否开启行选择（额外占用一个单元格跨度） */
  selectable?: MaybeRefOrGetter<boolean>;
  /** 列的排序元信息 */
  sortMeta: (columnKey: string) => { order: ColumnView['order']; rank: ColumnView['rank'] };
  /** 是否处于树形模式（额外占用一个单元格跨度） */
  treeMode?: MaybeRefOrGetter<boolean>;
}

/** useTableColumnLayout 返回句柄 */
export interface TableColumnLayoutResult {
  /** 表头 / 表体 / 汇总行共用的列视图序列 */
  columnViews: ComputedRef<ColumnView[]>;
  /** 分层表头行（未启用多级表头时为空） */
  headerRows: ComputedRef<readonly HeaderRow[]>;
  /** 左固定列视图（多级表头模式下需单独跨行渲染） */
  leftFixedViews: ComputedRef<ColumnView[]>;
  /** 右固定列视图 */
  rightFixedViews: ComputedRef<ColumnView[]>;
  /** 表头列拖拽的 pointerdown 入口 */
  onHeadPointerDown: (event: PointerEvent, index: number) => void;
  /** 是否还有左侧未渲染的列（用于列阴影） */
  showColumnLeftShadow: ComputedRef<boolean>;
  /** 是否还有右侧未渲染的列 */
  showColumnRightShadow: ComputedRef<boolean>;
  /** 表格最小宽度（像素），用于横向滚动撑开 */
  tableMinWidth: ComputedRef<number>;
  /** 空态 / 汇总行 / 行虚拟占位使用的 cell-span */
  totalCellSpan: ComputedRef<number>;
}

/**
 * 装配列渲染序列。
 *
 * @param options - 列布局配置
 * @returns 列视图与跨度句柄
 */
export function useTableColumnLayout<T extends Record<string, unknown>>(
  options: TableColumnLayoutOptions<T>,
): TableColumnLayoutResult {
  const estimateWidth = computed<number>(() =>
    toValue(options.estimateColumnWidth) ?? DEFAULT_COLUMN_WIDTH,
  );

  /* ---------------- 固定列分组 ---------------- */

  /** 列作为 ColumnFixedConfig 使用 */
  const columnsAsFixedConfig = computed<ColumnFixedConfig[]>(() =>
    toValue(options.columns).map(col => ({
      fixed: col.fixed,
      key: col.key,
      width: col.width,
    })),
  );

  const fixedApi = useFixedColumns(columnsAsFixedConfig);

  const enableFixed = computed<boolean>(() => toValue(options.enableFixedColumns) ?? false);

  const leftFixedColumns = computed<readonly ColumnFixedConfig[]>(() =>
    enableFixed.value ? fixedApi.leftFixedColumns.value : [],
  );

  const rightFixedColumns = computed<readonly ColumnFixedConfig[]>(() =>
    enableFixed.value ? fixedApi.rightFixedColumns.value : [],
  );

  /** 中间区列（未固定，可能被虚拟滚动） */
  const unfixedColumns = computed<readonly ColumnFixedConfig[]>(() =>
    enableFixed.value ? fixedApi.unfixedColumns.value : columnsAsFixedConfig.value,
  );

  /** 左固定列总宽（px）—— 虚拟器 scrollPaddingStart */
  const leftFixedTotalWidth = computed<number>(() =>
    leftFixedColumns.value.reduce((sum, col) => sum + (col.width ?? DEFAULT_COLUMN_WIDTH), 0),
  );

  /** 右固定列总宽（px） */
  const rightFixedTotalWidth = computed<number>(() =>
    rightFixedColumns.value.reduce((sum, col) => sum + (col.width ?? DEFAULT_COLUMN_WIDTH), 0),
  );

  /* ---------------- 多级表头 ---------------- */

  const columnsAsGroup = computed<TableColumn[]>(() =>
    toValue(options.columns).map(col => ({
      ...(col.children ? { children: col.children as TableColumn[] } : {}),
      key: col.key,
      label: col.label ?? col.key,
    })),
  );

  const enableGroup = computed<boolean>(() => toValue(options.enableGroupHeader) ?? false);

  const groupApi = useTableGroupHeader(() => (enableGroup.value ? columnsAsGroup.value : []));

  /** 表头层数（多级表头下固定列需跨这么多行） */
  const headerDepth = computed<number>(() =>
    enableGroup.value ? groupApi.headerRows.value.length : 1,
  );

  /** 多级表头叶子列 */
  const leafColumns = computed<readonly TableColumn[]>(() =>
    enableGroup.value ? groupApi.flatColumnsLeaf.value : [],
  );

  /** 当前作为 cell 渲染的中间列 */
  const displayMiddleColumns = computed<readonly ColumnFixedConfig[]>(() => {
    if (enableGroup.value) {
      return leafColumns.value.map(col => ({
        key: col.key ?? '',
        width: estimateWidth.value,
      }));
    }
    return unfixedColumns.value;
  });

  /* ---------------- 列顺序拖拽 ---------------- */

  const reorderable = computed<boolean>(() => toValue(options.reorderable) ?? false);

  /** 拖拽重排后的本地列顺序 */
  const reorderedColumns: Ref<DataTableColumnDef<T>[]> = ref([...toValue(options.columns)]);

  watch(
    () => toValue(options.columns),
    cols => {
      reorderedColumns.value = [...cols];
    },
    { deep: true },
  );

  const dragApi = useColumnDrag<DataTableColumnDef<T>>(
    () => reorderedColumns.value,
    (fromIndex, toIndex) => {
      const next = [...reorderedColumns.value];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved!);
      reorderedColumns.value = next;
      options.onReorder?.({ columns: next, fromIndex, toIndex });
    },
  );

  /** 中间区参与渲染的列（拖拽模式下取本地顺序） */
  const middleSourceColumns = computed<readonly ColumnFixedConfig[]>(() => {
    if (reorderable.value) {
      return reorderedColumns.value.map(col => ({
        fixed: col.fixed,
        key: col.key,
        width: col.width,
      }));
    }
    return displayMiddleColumns.value;
  });

  const middleColumnCount = computed<number>(() => middleSourceColumns.value.length);

  /* ---------------- 列虚拟滚动 ---------------- */

  const shouldVirtualizeColumns = computed<boolean>(
    () => (toValue(options.columnVirtualizer) ?? false)
      && middleColumnCount.value > VIRTUAL_COLUMN_THRESHOLD,
  );

  const columnVirtualizer = useVirtualizer(
    computed(() => ({
      count: middleColumnCount.value,
      enabled: shouldVirtualizeColumns.value,
      estimateSize: () => estimateWidth.value,
      getScrollElement: () => options.scrollElement(),
      horizontal: true,
      overscan: COLUMN_OVERSCAN,
      scrollPaddingStart: leftFixedTotalWidth.value,
    })),
  );

  /** 当前可见列区间 */
  const virtualColumns = computed(() =>
    shouldVirtualizeColumns.value ? columnVirtualizer.value.getVirtualItems() : [],
  );

  /** 左侧未渲染列数 */
  const spacerLeftSpan = computed<number>(() => virtualColumns.value[0]?.index ?? 0);

  /** 右侧未渲染列数 */
  const spacerRightSpan = computed<number>(() => {
    const items = virtualColumns.value;
    if (items.length === 0) return 0;
    return middleColumnCount.value - 1 - items[items.length - 1]!.index;
  });

  const showColumnLeftShadow = computed<boolean>(
    () => shouldVirtualizeColumns.value && spacerLeftSpan.value > 0,
  );

  const showColumnRightShadow = computed<boolean>(
    () => shouldVirtualizeColumns.value && spacerRightSpan.value > 0,
  );

  const tableMinWidth = computed<number>(
    () => middleColumnCount.value * estimateWidth.value
      + leftFixedTotalWidth.value
      + rightFixedTotalWidth.value,
  );

  /* ---------------- 列视图装配 ---------------- */

  const editableMode = computed<boolean>(() => toValue(options.editable) ?? false);

  const resizable = computed<boolean>(() => toValue(options.resizable) ?? false);

  /**
   * 构造列视图的公共字段（表头文本 / 排序态 / 编辑性）。
   *
   * @param key - 列 key
   * @param extra - 差异化字段
   * @returns 完整列视图
   */
  function makeView(key: string, extra: Partial<ColumnView> = {}): ColumnView {
    const def = options.findColumn(key);
    const meta = options.sortMeta(key);
    return {
      align: def?.align ?? 'left',
      cellClass: '',
      colspan: 1,
      dragIndex: -1,
      editable: Boolean(editableMode.value && def?.editable),
      headClass: '',
      isSpacer: false,
      key,
      label: def?.label ?? key,
      order: meta.order,
      rank: meta.rank,
      rowspan: headerDepth.value,
      sortable: Boolean(def?.isSortable),
      style: undefined,
      ...extra,
    };
  }

  /**
   * 虚拟列宽度样式：拖拽结果优先，估算宽度兜底。
   *
   * @param columnKey - 列 key
   * @returns 表头与单元格共用样式
   */
  function virtualColumnStyle(columnKey: string): CSSProperties {
    const estimate = `${estimateWidth.value}px`;
    const resized = resizable.value ? options.resizedWidth?.(columnKey) : undefined;
    return { minWidth: estimate, width: resized ?? estimate };
  }

  /**
   * 非虚拟列的宽度样式（仅在列宽被拖拽后产生）。
   *
   * @param columnKey - 列 key
   * @returns 样式对象或 undefined
   */
  function resizedWidthStyle(columnKey: string): CSSProperties | undefined {
    if (!resizable.value) return undefined;
    const width = options.resizedWidth?.(columnKey);
    return width ? { width } : undefined;
  }

  /** 中间区列视图（含列虚拟滚动的左右占位） */
  const middleViews = computed<ColumnView[]>(() => {
    if (!shouldVirtualizeColumns.value) {
      return middleSourceColumns.value.map((col, idx) => makeView(col.key, {
        cellClass: col.fixed === 'left' ? 'sticky-cell' : '',
        dragIndex: reorderable.value ? idx : -1,
        headClass: cn(
          col.fixed === 'left' && 'sticky-cell',
          resizable.value && 'relative',
          reorderable.value && 'cursor-grab select-none',
        ),
        rowspan: 1,
        style: resizedWidthStyle(col.key),
      }));
    }

    const list: ColumnView[] = [];
    if (spacerLeftSpan.value > 0) {
      list.push(makeView(`spacer-left-${spacerLeftSpan.value}`, {
        colspan: spacerLeftSpan.value,
        isSpacer: true,
      }));
    }
    for (const item of virtualColumns.value) {
      const col = middleSourceColumns.value[item.index];
      if (!col) continue;
      list.push(makeView(col.key, {
        cellClass: col.fixed === 'left' ? 'sticky-cell' : '',
        headClass: cn(col.fixed === 'left' && 'sticky-cell', resizable.value && 'relative'),
        style: virtualColumnStyle(col.key),
      }));
    }
    if (spacerRightSpan.value > 0) {
      list.push(makeView(`spacer-right-${spacerRightSpan.value}`, {
        colspan: spacerRightSpan.value,
        isSpacer: true,
      }));
    }
    return list;
  });

  const leftFixedViews = computed<ColumnView[]>(() =>
    leftFixedColumns.value.map(col => makeView(col.key, {
      cellClass: 'sticky-cell',
      headClass: 'sticky-cell',
      style: fixedColumnStyle(col, 'left', [...leftFixedColumns.value]) as CSSProperties,
    })),
  );

  const rightFixedViews = computed<ColumnView[]>(() =>
    rightFixedColumns.value.map(col => makeView(col.key, {
      cellClass: 'sticky-cell',
      headClass: 'sticky-cell',
      style: fixedColumnStyle(col, 'right', [...rightFixedColumns.value]) as CSSProperties,
    })),
  );

  const columnViews = computed<ColumnView[]>(() => [
    ...leftFixedViews.value,
    ...middleViews.value,
    ...rightFixedViews.value,
  ]);

  /** 真实列数（不含占位列） */
  const realColumnCount = computed<number>(
    () => columnViews.value.filter(view => !view.isSpacer).length,
  );

  const totalCellSpan = computed<number>(
    () => realColumnCount.value
      + (toValue(options.selectable) ? 1 : 0)
      + (toValue(options.treeMode) ? 1 : 0),
  );

  return {
    columnViews,
    headerRows: groupApi.headerRows,
    leftFixedViews,
    onHeadPointerDown: dragApi.onPointerDown,
    rightFixedViews,
    showColumnLeftShadow,
    showColumnRightShadow,
    tableMinWidth,
    totalCellSpan,
  };
}
