<script lang="ts">
/**
 * YdDataTable —— 增强数据表格：行选择 / 单列与多列排序 / 固定列 / 多级表头 /
 * 列虚拟滚动 / 行虚拟滚动 / 行内编辑 / 单元格与表头插槽 / CSV·TSV 导出 / loading 态。
 *
 * <p>渲染序列由三个 composable 装配：useTableColumnLayout（列）、useTableRowView（行）、
 * useTableCellEdit（单元格编辑）；本文件只保留 props / 事件契约与模板编排。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTable.vue
 * @author ydsz-team
 * @since 5.6.0
 */
// @ts-nocheck
export type {
  CellEditOption,
  CellEditType,
  ColumnView,
  DataTableColumnDef,
  RowView,
  SummaryRowFn,
  TreeConfig,
  TreeFlatRow,
} from './types';
</script>

<script lang="ts" setup generic="T extends Record<string, unknown>">
import { computed, onScopeDispose, ref, useTemplateRef, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useTableData, type RowSelectionConfig } from '../../composables/use-table-data';
import type { SortOrder, SortRule, SortState } from '../../composables/use-table-data';
import { useLocale } from '../../locale/useLocale';
import { useTableColumnStorage } from '../../composables/use-table-column-storage';
import {
  YdTable,
  YdTableBody,
  YdTableCell,
  YdTableHead,
  YdTableHeader,
  YdTableRow,
} from '../table';
import { useColumnResize } from '../table/useColumnResize';
import { useTableCellEdit } from './use-table-cell-edit';
import { useTableColumnLayout } from './use-table-column-layout';
import { useTableExport } from './use-table-export';
import { useTableRowView } from './use-table-row-view';
import YdDataTableCell from './YdDataTableCell.vue';
import YdDataTableHeadCell from './YdDataTableHeadCell.vue';

import type {
  CellEditType,
  CellSlotProps,
  ColumnView,
  DataTableColumnDef,
  HeaderSlotProps,
  SummaryRowFn,
  TreeConfig,
} from './types';

/* ============================================================ */
/* props / emit / slots                                          */
/* ============================================================ */

interface Props<T extends Record<string, unknown>> {
  /** 数据源 */
  dataSource: T[];
  /** 列定义（可扩展 fixed / width / children / label / editable / formatter） */
  columns: DataTableColumnDef<T>[];
  /** 行 key 获取函数 */
  rowKey?: (row: T, index: number) => string;
  /** 是否开启行选择 */
  isSelectable?: boolean;
  /** 选择类型 */
  selectType?: 'checkbox' | 'radio';
  /** 是否远程模式（true 时关闭本地排序/筛选） */
  isRemote?: boolean;
  /** 当前排序状态（受控） */
  sortState?: SortState;
  /** 是否允许多列排序（表头 Shift+点击追加到排序链） */
  multipleSort?: boolean;
  /** 是否处于加载中（覆盖层 + aria-busy，并隐藏空态行） */
  loading?: boolean;
  /** 汇总行计算函数 */
  summary?: SummaryRowFn<T>;
  /** 自定义类名 */
  class?: string;
  /** 是否启用列固定（基于 width + fixed 字段） */
  enableFixedColumns?: boolean;
  /** 是否启用多级表头（基于 children 字段） */
  enableGroupHeader?: boolean;
  /** 是否启用列虚拟滚动（horizontal，基于 @tanstack/vue-virtual） */
  columnVirtualizer?: boolean;
  /** 列虚拟估算宽度（像素），默认 120 */
  estimateColumnWidth?: number;
  /** 是否启用行虚拟滚动（vertical，需配合 virtualHeight 限定容器高度） */
  virtual?: boolean;
  /** 行虚拟滚动可视区高度（像素），默认 480 */
  virtualHeight?: number;
  /** 行高估算值（像素），默认 40 */
  estimateRowHeight?: number;
  /** 行虚拟滚动视口外预渲染行数，默认 8 */
  virtualOverscan?: number;
  /** 是否启用列宽拖拽 */
  resizable?: boolean;
  /** 是否启用列顺序拖拽 */
  reorderable?: boolean;
  /** 导出默认文件名（不含扩展名） */
  exportFileName?: string;
  /** 树形表格配置（传值即启用树形模式） */
  treeConfig?: TreeConfig;
  /** 是否开启行内编辑模式（总开关） */
  editable?: boolean;
  /** 当前正在编辑的单元格 key 集合（受控）。key = composeCellKey(rowKey, columnKey) */
  editingKeys?: Set<string>;
  /** 单元格编辑类型映射：columnKey → editType（优先级高于列 def 上的 editType） */
  editConfig?: Map<string, CellEditType>;
  /** 是否显示工具栏（含列选择器 / 导出按钮）；默认 false */
  showToolbar?: boolean;
  /** 是否启用列选择器（仅在 showToolbar 为 true 时生效）；默认 false */
  enableColumnChooser?: boolean;
  /** 列配置持久化 key；传入则启用列宽/顺序/显隐的 localStorage 持久化 */
  storageKey?: string;
  /** 列初始可见性 map（受控模式）；不传则由组件内部管理 */
  columnVisibility?: Record<string, boolean>;
}

const props = withDefaults(defineProps<Props<T>>(), {
  class: '',
  columnVirtualizer: false,
  editable: false,
  enableFixedColumns: false,
  enableGroupHeader: false,
  enableColumnChooser: false,
  estimateColumnWidth: 120,
  estimateRowHeight: 40,
  exportFileName: 'table-export',
  isRemote: false,
  isSelectable: false,
  loading: false,
  multipleSort: false,
  reorderable: false,
  resizable: false,
  rowKey: (_row: T, idx: number) => String(idx),
  selectType: 'checkbox',
  showToolbar: false,
  storageKey: undefined,
  virtual: false,
  virtualHeight: 480,
  virtualOverscan: 8,
});

const emit = defineEmits<{
  'sort-change': [prop: string, order: SortOrder | null];
  'sort-chain-change': [chain: SortRule[]];
  'selection-change': [keys: string[]];
  'update:sortState': [state: SortState];
  'update:expandedKeys': [keys: string[]];
  'update:columnVisibility': [visibility: Record<string, boolean>];
  'columnResize': [payload: { columnKey: string; newWidth: number }];
  'columnReorder': [payload: {
    columns: DataTableColumnDef<T>[];
    fromIndex: number;
    toIndex: number;
  }];
  'cell-edit-start': [rowKey: string, columnKey: string];
  'cell-edit-end': [rowKey: string, columnKey: string, value: string];
  'cell-edit': [rowKey: string, columnKey: string, value: string, row: T];
}>();

defineSlots<{
  [key: `cell-${string}`]: (props: CellSlotProps<T>) => unknown;
  cell: (props: CellSlotProps<T> & { column: ColumnView }) => unknown;
  [key: `header-${string}`]: (props: HeaderSlotProps) => unknown;
  header: (props: HeaderSlotProps) => unknown;
  [key: `summary-${string}`]: (props: { value: string | number | undefined }) => unknown;
  empty: () => unknown;
  loading: () => unknown;
  'toolbar-left': () => unknown;
  'toolbar-right': () => unknown;
}>();

const { t } = useLocale();

/** 模板 ref：滚动容器（列向、行向虚拟滚动共用） */
const tableScrollContainerRef = useTemplateRef<HTMLElement>('tableScrollContainer');

/* ============================================================ */
/* 列定义查找                                                    */
/* ============================================================ */

/** 列定义查找表（columnKey → 定义），覆盖多级表头的分组子列 */
const columnDefByKey = computed<Map<string, DataTableColumnDef<T>>>(() => {
  const map = new Map<string, DataTableColumnDef<T>>();

  /**
   * 递归收集分组子列。
   *
   * @param cols - 当前层列定义
   * @returns 无
   */
  function collect(cols: DataTableColumnDef<T>[]): void {
    for (const col of cols) {
      map.set(col.key, col);
      if (Array.isArray(col.children)) {
        collect(col.children as DataTableColumnDef<T>[]);
      }
    }
  }

  collect(props.columns);
  return map;
});

/**
 * 按 key 取列定义。
 *
 * @param columnKey - 列 key
 * @returns 列定义或 undefined
 */
function findColumn(columnKey: string): DataTableColumnDef<T> | undefined {
  return columnDefByKey.value.get(columnKey);
}

/* ============================================================ */
/* 表格数据层（useTableData）                                    */
/* ============================================================ */

const selectedKeysRef = ref<Set<string>>(new Set());

const rowSelectionConfig = computed<RowSelectionConfig<T> | undefined>(() => {
  if (!props.isSelectable) return undefined;
  return {
    rowKey: props.rowKey,
    selectedKeys: selectedKeysRef,
    type: props.selectType,
  };
});

const table = useTableData<T>({
  columns: () => props.columns,
  data: () => props.dataSource,
  isRemote: props.isRemote,
  multipleSort: () => props.multipleSort,
  rowSelection: rowSelectionConfig.value,
});

/** 受控排序：外部 sortState 变化时覆盖内部排序链 */
watch(
  () => props.sortState,
  (next) => {
    if (!next) return;
    table.sortState.value = { order: next.order, prop: next.prop };
  },
  { immediate: true },
);

/* ============================================================ */
/* 排序交互                                                      */
/* ============================================================ */

/**
 * 表头点击排序：修饰键表示追加到多列排序链，否则替换当前排序。
 *
 * @param columnKey - 被点击的列 key
 * @param additive - 是否携带 Shift / Ctrl / Meta
 * @returns 无
 */
function handleSort(columnKey: string, additive: boolean): void {
  table.toggleSort(columnKey, additive);
  emitSortState();
}

/**
 * 清空排序并同步受控事件。
 *
 * @returns 无
 */
function clearSort(): void {
  table.clearSort();
  emitSortState();
}

/** 把内部排序链变化广播给受控调用方 */
function emitSortState(): void {
  const chain = table.sortChain.value;
  const primary = chain[0];
  emit('sort-change', primary?.prop ?? '', primary?.order ?? null);
  emit('sort-chain-change', [...chain]);
  emit('update:sortState', primary
    ? { order: primary.order, prop: primary.prop }
    : { order: null, prop: null });
}

/* ============================================================ */
/* 列宽持久化（统一 useTableColumnStorage）                        */
/* ============================================================ */

/**
 * 是否启用列配置持久化（列宽 / 顺序 / 显隐 / 固定位置）。
 * <p>开启后通过 useTableColumnStorage 将用户调整写入 localStorage，
 * 下次打开页面自动恢复。
 */
const columnStorage = props.storageKey
  ? useTableColumnStorage(props.storageKey)
  : null;

/** 旧 fallback 存储 key */
const RESIZE_STORAGE_KEY = 'yd-datatable-col-widths';

/**
 * 读取持久化列宽（localStorage 不可用或数据损坏时返回空表）。
 *
 * @returns 列 key → 宽度
 */
function loadPersistedWidths(): Record<string, number> {
  if (columnStorage) {
    // 统一存储路径：从 useTableColumnStorage 加载
    const configs = columnStorage.loadColumnConfig();
    const result: Record<string, number> = {};
    for (const cfg of configs) {
      if (cfg.width) {
        const parsed = parseInt(cfg.width, 10);
        if (!Number.isNaN(parsed))
          result[cfg.key] = parsed;
      }
    }
    return result;
  }
  // 兼容旧行为（无 storageKey 时降级到旧 key）
  try {
    const raw = localStorage.getItem(RESIZE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * 写回持久化列宽。
 */
function persistWidths(widths: Record<string, number>): void {
  if (columnStorage) {
    // 统一存储路径：合并到 useTableColumnStorage
    const existing = columnStorage.loadColumnConfig();
    const existingMap = new Map(existing.map((c) => [c.key, c]));
    const merged = Object.entries(widths).map(([key, width]) => {
      const prev = existingMap.get(key);
      return {
        fixed: prev?.fixed,
        isHidden: prev?.isHidden,
        key,
        sort: prev?.sort,
        width: String(width),
      };
    });
    // 补充未在 widths 中的列
    for (const cfg of existing) {
      if (!widths[cfg.key])
        merged.push(cfg);
    }
    columnStorage.saveColumnConfig(merged);
    return;
  }
  // 兼容旧行为
  try {
    localStorage.setItem(RESIZE_STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // 隐私模式 / 配额溢出时静默降级，不影响拖拽本身
  }
}

const columnResizeApi = useColumnResize({
  defaultMinWidth: 60,
  initialWidths: loadPersistedWidths(),
});

/** 列宽拖拽的 document 监听句柄，pointerup 与组件卸载都要回收 */
let resizeMoveHandler: ((event: PointerEvent) => void) | null = null;
let resizeUpHandler: (() => void) | null = null;

/** 回收列宽拖拽的 document 监听（pointerup 与组件卸载共用） */
function detachResizeListeners(): void {
  if (resizeMoveHandler) document.removeEventListener('pointermove', resizeMoveHandler);
  if (resizeUpHandler) document.removeEventListener('pointerup', resizeUpHandler);
  resizeMoveHandler = null;
  resizeUpHandler = null;
}

/**
 * 开始列宽拖拽，并在 pointerup 时回收 document 监听。
 *
 * @param columnKey - 列 key
 * @param event - 原生指针事件
 * @returns 无
 */
function handleResizeStart(columnKey: string, event: PointerEvent): void {
  if (!props.resizable) return;
  columnResizeApi.onResizeStart(columnKey, event);

  resizeMoveHandler = (moveEvent: PointerEvent) => {
    columnResizeApi.onResizeMove(moveEvent);
    persistWidths({ ...columnResizeApi.columnWidths.value });
    emit('columnResize', {
      columnKey,
      newWidth: columnResizeApi.columnWidths.value[columnKey] ?? 0,
    });
  };
  resizeUpHandler = () => {
    columnResizeApi.onResizeEnd();
    detachResizeListeners();
  };
  document.addEventListener('pointermove', resizeMoveHandler);
  document.addEventListener('pointerup', resizeUpHandler, { once: true });
}

onScopeDispose(detachResizeListeners);

/* ============================================================ */
/* 列渲染序列（useTableColumnLayout）                            */
/* ============================================================ */

const layout = useTableColumnLayout<T>({
  columnVirtualizer: () => props.columnVirtualizer,
  columns: () => props.columns,
  editable: () => props.editable,
  enableFixedColumns: () => props.enableFixedColumns,
  enableGroupHeader: () => props.enableGroupHeader,
  estimateColumnWidth: () => props.estimateColumnWidth,
  findColumn,
  onReorder: payload => emit('columnReorder', payload),
  resizable: () => props.resizable,
  resizedWidth: columnKey => columnResizeApi.getColumnWidthStyle(columnKey),
  reorderable: () => props.reorderable,
  scrollElement: () => tableScrollContainerRef.value ?? null,
  selectable: () => props.isSelectable,
  sortMeta: columnKey => ({
    order: table.getSortOrder(columnKey),
    rank: table.getSortRank(columnKey),
  }),
  treeMode: () => props.treeConfig !== undefined,
});

const {
  columnViews,
  headerRows,
  leftFixedViews,
  onHeadPointerDown,
  rightFixedViews,
  showColumnLeftShadow,
  showColumnRightShadow,
  tableMinWidth,
  totalCellSpan,
} = layout;

/* ============================================================ */
/* 行渲染序列（useTableRowView）                                 */
/* ============================================================ */

const rowView = useTableRowView<T>({
  estimateRowHeight: () => props.estimateRowHeight,
  expandedKeys: () => props.treeConfig?.expandedKeys,
  onExpandedKeysChange: keys => emit('update:expandedKeys', keys),
  overscan: () => props.virtualOverscan,
  rowKey: props.rowKey,
  rows: () => table.viewRows.value,
  scrollElement: () => tableScrollContainerRef.value ?? null,
  treeConfig: () => props.treeConfig,
  virtual: () => props.virtual,
});

const {
  bottomSpacerHeight,
  dataRows,
  expandedKeys,
  rowCount,
  rowViews,
  toggleExpand,
  topSpacerHeight,
  virtualized,
} = rowView;

/**
 * 按 rowKey 反查行数据（取消编辑等兜底场景）。
 *
 * @param targetRowKey - 行 key
 * @returns 行数据，未命中时返回空对象
 */
function resolveRowByKey(targetRowKey: string): T {
  const found = dataRows.value.find((row, idx) => props.rowKey(row, idx) === targetRowKey);
  return found ?? ({} as T);
}

/* ============================================================ */
/* 行内编辑（useTableCellEdit）                                  */
/* ============================================================ */

const cellEdit = useTableCellEdit<T>({
  editConfig: () => props.editConfig,
  editable: () => props.editable,
  editingKeys: () => props.editingKeys,
  findColumn,
  onEdit: (rowKey, columnKey, value, row) => emit('cell-edit', rowKey, columnKey, value, row),
  onEditEnd: (rowKey, columnKey, value) => emit('cell-edit-end', rowKey, columnKey, value),
  onEditStart: (rowKey, columnKey) => emit('cell-edit-start', rowKey, columnKey),
  resolveRow: resolveRowByKey,
});

/* ============================================================ */
/* 行选择 / 汇总行                                               */
/* ============================================================ */

/** 视图行 key 列表 */
const rowKeys = computed<string[]>(() =>
  dataRows.value.map((row, idx) => props.rowKey(row, idx)),
);

/** 是否全选 */
const isAllSelected = computed<boolean>(
  () => rowKeys.value.length > 0
    && rowKeys.value.every(key => table.selection.value.has(key)),
);

/** 是否部分选中 */
const someSelected = computed<boolean>(
  () => rowKeys.value.some(key => table.selection.value.has(key)) && !isAllSelected.value,
);

/** 汇总行取值（按列 key 索引） */
const summaryValues = computed<Record<string, string | number>>(() =>
  props.summary && dataRows.value.length > 0 ? props.summary(dataRows.value) : {},
);

/**
 * 全选 / 取消全选。
 *
 * @returns 无
 */
function handleSelectAll(): void {
  table.toggleSelectAll();
  emit('selection-change', Array.from(table.selection.value));
}

/**
 * 切换单行选中态。
 *
 * @param key - 行 key
 * @returns 无
 */
function handleSelect(key: string): void {
  const set = table.selection.value;
  const next = new Set(set);
  if (next.has(key))
    next.delete(key);
  else
    next.add(key);
  table.setSelected(next);
  emit('selection-change', Array.from(next));
}

/* ============================================================ */
/* 列选择器                                                       */
/* ============================================================ */

/** 列选择器 popover 开关 */
const columnChooserOpen = ref(false);

/** 列选择器所需的列定义 */
const columnChooserColumns = computed(() =>
  props.columns.map((col) => ({
    hideable: col.fixed !== 'left' && col.fixed !== 'right',
    key: col.key,
    label: col.label ?? col.key,
  })),
);

function onColumnVisibilityChange(visibleKeys: string[]): void {
  const vis: Record<string, boolean> = {};
  for (const col of props.columns)
    vis[col.key] = visibleKeys.includes(col.key);
  emit('update:columnVisibility', vis);
}

function onColumnVisibilityReset(): void {
  emit('update:columnVisibility', {});
}

/** 导出仅选中行 */
function exportSelected(): void {
  if (!exportApi.exportSelectedCsv) return;
  exportApi.exportSelectedCsv(table.selection.value, (row: T) =>
    String(props.rowKey ? props.rowKey(row, 0) : ''),
  );
}

/* ============================================================ */
/* 数据导出                                                      */
/* ============================================================ */

const exportApi = useTableExport<T>({
  columns: () => columnViews.value
    .filter(view => !view.isSpacer)
    .map(view => ({ key: view.key, label: view.label })),
  fileName: () => props.exportFileName,
  rowKeyExtractor: (row: T) => String(props.rowKey ? props.rowKey(row, 0) : ''),
  rows: () => dataRows.value,
  valueResolver: (row, column, index) =>
    findColumn(column.key)?.formatter?.(row, row[column.key], index),
});

defineExpose({
  clearFilters: table.clearFilters,
  clearSort,
  selection: table.selection,
  setSelected: table.setSelected,
  sortChain: table.sortChain,
  sortState: table.sortState,
  /** 编辑句柄：外部可直接 startEdit / save / cancel 某个单元格 */
  editing: {
    cancelCellEdit: cellEdit.cancel,
    cellKeys: cellEdit.editingCellKeys,
    saveCellEdit: cellEdit.save,
    startCellEdit: cellEdit.startEdit,
  },
  /** 排序句柄 */
  sorting: {
    clearSort,
    getSortOrder: table.getSortOrder,
    getSortRank: table.getSortRank,
    toggleSort: handleSort,
  },
  /** 导出句柄（CSV / TSV / 纯文本） */
  exporting: exportApi,
});
</script>

<template>
  <!-- 工具栏：列选择器 / Excel 导出 / 已选行导出（showToolbar=true 时显示） -->
  <div
    v-if="props.showToolbar"
    class="flex items-center justify-between gap-2 rounded-t-md border border-b-0 bg-muted/20 px-3 py-2"
  >
    <slot name="toolbar-left">
      <span class="text-sm text-muted-foreground">
        {{ dataRows.length }} {{ t('table.columns') }}
      </span>
    </slot>
    <div class="flex items-center gap-1">
      <slot name="toolbar-right">
        <!-- 列选择器 Popover 触发器 -->
        <button
          v-if="props.enableColumnChooser"
          type="button"
          class="inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent"
          :aria-label="t('table.columnSetting')"
          @click="columnChooserOpen = !columnChooserOpen"
        >
          ⚙ {{ t('table.columnSetting') }}
        </button>
        <!-- Excel 导出 -->
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent"
          @click="exportApi.exportExcel()"
        >
          {{ t('table.exportExcel') }}
        </button>
        <!-- 已选行导出 -->
        <button
          v-if="props.isSelectable"
          type="button"
          class="inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent"
          @click="exportSelected()"
        >
          {{ t('table.exportSelected') }}
        </button>
      </slot>
    </div>
  </div>

  <!-- 列选择器 Popover -->
  <div
    v-if="columnChooserOpen && props.enableColumnChooser"
    class="absolute right-2 top-12 z-30 rounded-md border bg-popover p-1 shadow-md"
  >
    <YdColumnChooser
      :columns="columnChooserColumns"
      @change="onColumnVisibilityChange"
      @reset="onColumnVisibilityReset"
    />
  </div>

  <div
    ref="tableScrollContainer"
    :class="cn(
      'relative w-full overflow-x-auto border rounded-md',
      virtualized && 'overflow-y-auto yd-body-virtual',
      !(props.showToolbar) && 'rounded-t-md',
      props.class,
    )"
    :style="virtualized ? { height: `${props.virtualHeight}px` } : undefined"
    role="grid"
    :aria-busy="props.loading"
    :aria-rowcount="rowCount"
  >
    <div
      v-if="showColumnLeftShadow"
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 start-0 top-0 z-10 w-3"
      style="background: linear-gradient(to right, hsl(var(--foreground) / 8%), transparent);"
    />

    <!-- 列阴影哨兵：右侧仍有未渲染列 -->
    <div
      v-if="showColumnRightShadow"
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 end-0 top-0 z-10 w-3"
      style="background: linear-gradient(to left, hsl(var(--foreground) / 8%), transparent);"
    />

    <!-- 加载覆盖层 -->
    <div
      v-if="props.loading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-background/60"
      role="status"
      aria-live="polite"
    >
      <slot name="loading">
        <span class="yd-loading-spinner" aria-hidden="true" />
        <span class="ms-2 text-sm text-muted-foreground">{{ t('table.loading') }}</span>
      </slot>
    </div>

    <YdTable
      class="w-full border-collapse"
      :style="{ minWidth: `${tableMinWidth}px` }"
    >
      <YdTableHeader>
        <!-- 多级表头模式 -->
        <template v-if="props.enableGroupHeader && headerRows.length > 0">
          <YdTableRow
            v-for="(hRow, hIdx) in headerRows"
            :key="`group-head-${hIdx}`"
            class="bg-muted/50"
          >
            <YdTableHead
              v-if="props.isSelectable && hIdx === 0"
              :rowspan="headerRows.length"
              class="w-10 px-2"
            >
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="someSelected"
                class="size-4"
                :aria-label="t('table.selectAll')"
                @change="handleSelectAll"
              />
            </YdTableHead>

            <YdTableHead
              v-if="props.treeConfig && hIdx === 0"
              :rowspan="headerRows.length"
              class="w-10 px-2"
            />

            <!-- 固定列跨全部表头行，与表体列视图序列同位 -->
            <template v-if="hIdx === 0">
              <YdDataTableHeadCell
                v-for="view in leftFixedViews"
                :key="`group-fixed-left-${view.key}`"
                :column-key="view.key"
                :label="view.label"
                :align="view.align"
                :head-class="view.headClass"
                :head-style="view.style"
                :rowspan="view.rowspan"
              />
            </template>

            <YdTableHead
              v-for="(cell, cellIdx) in hRow"
              :key="`group-cell-${cell.key ?? `${hIdx}-${cellIdx}`}`"
              :colspan="cell.colspan"
              :rowspan="cell.rowspan"
              class="whitespace-nowrap font-medium text-start"
            >
              <slot
                :name="`header-${cell.key}`"
                :column-key="cell.key ?? ''"
                :label="cell.label"
                :order="null"
                :rank="null"
              >
                <slot
                  name="header"
                  :column-key="cell.key ?? ''"
                  :label="cell.label"
                  :order="null"
                  :rank="null"
                >
                  {{ cell.label }}
                </slot>
              </slot>
            </YdTableHead>

            <template v-if="hIdx === 0">
              <YdDataTableHeadCell
                v-for="view in rightFixedViews"
                :key="`group-fixed-right-${view.key}`"
                :column-key="view.key"
                :label="view.label"
                :align="view.align"
                :head-class="view.headClass"
                :head-style="view.style"
                :rowspan="view.rowspan"
              />
            </template>
          </YdTableRow>
        </template>

        <!-- 单行表头：与表体共用列视图序列（含列虚拟占位列） -->
        <YdTableRow v-else class="bg-muted/50 border-b">
          <YdTableHead v-if="props.isSelectable" class="w-10 px-2">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="someSelected"
              class="size-4"
              :aria-label="t('table.selectAll')"
              @change="handleSelectAll"
            />
          </YdTableHead>

          <YdTableHead v-if="props.treeConfig" class="w-10 px-2" />

          <template v-for="view in columnViews" :key="`head-${view.key}`">
            <YdTableHead
              v-if="view.isSpacer"
              :colspan="view.colspan"
              aria-hidden="true"
              class="p-0"
            />
            <YdDataTableHeadCell
              v-else
              :column-key="view.key"
              :label="view.label"
              :align="view.align"
              :sortable="view.sortable"
              :order="view.order"
              :rank="view.rank"
              :resizable="props.resizable"
              :reorderable="props.reorderable"
              :drag-index="view.dragIndex"
              :resizing="columnResizeApi.resizingProp.value === view.key"
              :head-class="view.headClass"
              :head-style="view.style"
              :rowspan="view.rowspan"
              @sort="handleSort"
              @resize-start="handleResizeStart"
              @drag-start="onHeadPointerDown"
            >
              <template #default="headScope">
                <slot :name="`header-${view.key}`" v-bind="headScope">
                  <slot name="header" v-bind="{ ...headScope, column: view }">
                    {{ headScope.label }}
                  </slot>
                </slot>
              </template>
            </YdDataTableHeadCell>
          </template>
        </YdTableRow>
      </YdTableHeader>

      <YdTableBody>
        <!-- 空态（加载中不展示，避免与覆盖层重复） -->
        <YdTableRow v-if="rowCount === 0 && !props.loading">
          <YdTableCell
            :colspan="totalCellSpan"
            class="py-12 text-center text-muted-foreground"
          >
            <slot name="empty">{{ t('table.empty') }}</slot>
          </YdTableCell>
        </YdTableRow>

        <!-- 行虚拟滚动：顶部占位 -->
        <YdTableRow
          v-if="topSpacerHeight > 0"
          :style="{ height: `${topSpacerHeight}px` }"
          aria-hidden="true"
          class="border-0"
        >
          <YdTableCell :colspan="totalCellSpan" class="p-0" />
        </YdTableRow>

        <!-- 数据行 -->
        <YdTableRow
          v-for="{ index, key, row, node } in rowViews"
          :key="key"
          class="border-b transition-colors hover:bg-muted/25"
          :selected="props.isSelectable && table.selection.value.has(key)"
        >
          <YdTableCell v-if="props.isSelectable" class="px-2">
            <input
              :type="props.selectType === 'radio' ? 'radio' : 'checkbox'"
              :checked="table.selection.value.has(key)"
              class="size-4"
              :aria-label="t('table.selectRow')"
              @change="handleSelect(key)"
            />
          </YdTableCell>

          <!-- 树形展开/折叠列 -->
          <YdTableCell v-if="props.treeConfig" class="px-2">
            <span
              class="inline-flex items-center"
              :style="{ paddingLeft: `${(node?.depth ?? 0) * 16}px` }"
            >
              <button
                v-if="node?.hasChildren"
                type="button"
                class="yd-tree-toggle size-4 flex items-center justify-center text-xs hover:text-primary cursor-pointer select-none"
                :aria-expanded="expandedKeys.has(key)"
                :aria-label="expandedKeys.has(key)
                  ? t('table.collapseRow')
                  : t('table.expandedRow')"
                @click="toggleExpand(key)"
              >
                {{ expandedKeys.has(key) ? '▼' : '▶' }}
              </button>
              <span v-else class="inline-block size-4" />
            </span>
          </YdTableCell>

          <template v-for="view in columnViews" :key="`cell-${view.key}-${key}`">
            <YdTableCell
              v-if="view.isSpacer"
              :colspan="view.colspan"
              aria-hidden="true"
              class="p-0"
            />
            <YdDataTableCell
              v-else
              :row="row"
              :row-key="key"
              :row-index="index"
              :column-key="view.key"
              :align="view.align"
              :editable="view.editable"
              :editing="cellEdit.isCellEditing(key, view.key)"
              :edit-type="cellEdit.resolveEditType(view.key)"
              :edit-options="cellEdit.resolveEditOptions(view.key)"
              :value="cellEdit.resolveCellValue(row, view.key, key, index)"
              :cell-class="cn(view.cellClass, view.editable && 'yd-cell-editable')"
              :cell-style="view.style"
              @edit-start="cellEdit.startEdit"
              @edit-draft="cellEdit.setDraft"
              @edit-save="cellEdit.save"
              @edit-cancel="cellEdit.cancel"
            >
              <template #default="cellScope">
                <slot :name="`cell-${view.key}`" v-bind="cellScope">
                  <slot name="cell" v-bind="{ ...cellScope, column: view }">
                    {{ cellScope.text }}
                  </slot>
                </slot>
              </template>
            </YdDataTableCell>
          </template>
        </YdTableRow>

        <!-- 行虚拟滚动：底部占位 -->
        <YdTableRow
          v-if="bottomSpacerHeight > 0"
          :style="{ height: `${bottomSpacerHeight}px` }"
          aria-hidden="true"
          class="border-0"
        >
          <YdTableCell :colspan="totalCellSpan" class="p-0" />
        </YdTableRow>

        <!-- 汇总行：按列展开，与表体列视图同序 -->
        <YdTableRow
          v-if="props.summary && dataRows.length > 0"
          class="border-t-2 font-medium bg-muted/30"
        >
          <YdTableCell v-if="props.isSelectable" class="px-2" />
          <YdTableCell v-if="props.treeConfig" class="px-2" />
          <template v-for="view in columnViews" :key="`summary-${view.key}`">
            <YdTableCell
              v-if="view.isSpacer"
              :colspan="view.colspan"
              aria-hidden="true"
              class="p-0"
            />
            <YdTableCell
              v-else
              :align="view.align"
              :class="view.cellClass"
              :style="view.style"
            >
              <slot :name="`summary-${view.key}`" :value="summaryValues[view.key]">
                {{ summaryValues[view.key] ?? '' }}
              </slot>
            </YdTableCell>
          </template>
        </YdTableRow>
      </YdTableBody>
    </YdTable>
  </div>
</template>

<style scoped>
.sticky-cell {
  position: sticky;
  z-index: 1;
  background: hsl(var(--background, 255 255 255));
}

/* 树形展开按钮 */
.yd-tree-toggle {
  background: transparent;
  border: none;
  padding: 0;
  line-height: 1;
}

/* 可编辑单元格：光标提示可进入编辑 */
.yd-cell-editable {
  cursor: cell;
}

/* 行虚拟滚动时列头吸顶，保证滚动过程中列语义不丢失 */
.yd-body-virtual :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: hsl(var(--background, 255 255 255));
}

.yd-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid hsl(var(--primary) / 30%);
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: yd-spin 0.8s linear infinite;
}

@keyframes yd-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
