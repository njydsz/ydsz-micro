<script lang="ts">
/**
 * * YdDataTable —— 增强数据表格：行选择 / 列排序 / 多选 / 固定列 / 多级表头 / 列虚拟滚动。
 * *
 * * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTable.vue
 * * @author ydsz-team
 * @since 5.6.0
 */
// @ts-nocheck
import type { TableColumnDef } from '../../composables/use-table-data';
import type { ColumnFixedConfig } from './use-table-fixed-columns';
import type { TableColumn } from './use-table-group-header';

/**
 * 数据表格列定义 —— 扩展 base TableColumnDef，支持固定列 / 多级表头。
 *
 * <p>仅当启用相应特性时才需传入对应字段：
 * <ul>
 *   <li>{@link TableColumnDef} 基础属性（key / isSortable / sorter / filters / filterMethod）</li>
 *   <li>{@link fixed} / {@link width} —— 列固定定位（传给 useFixedColumns）</li>
 *   <li>{@link label} / {@link children} —— 多级表头分组（传给 useTableGroupHeader）</li>
 * </ul>
 *
 * @typeParam T - 行数据类型
 */
export type DataTableColumnDef<T = Record<string, unknown>> = TableColumnDef<T> &
  ColumnFixedConfig &
  TableColumn;

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
</script>

<script lang="ts" setup generic="T extends Record<string, unknown>">
import {
  computed,
  ref,
  useTemplateRef,
  watch,
} from 'vue';

import { useVirtualizer } from '@tanstack/vue-virtual';

import { cn } from '@ydsz-core/shared/utils';

import { useTableData, type RowSelectionConfig } from '../../composables/use-table-data';
import type { SortState } from '../../composables/use-table-data';
import { useLocale } from '../../locale/useLocale';
import {
  YdTable,
  YdTableBody,
  YdTableCell,
  YdTableHead,
  YdTableHeader,
  YdTableRow,
} from '../../primitives/table';
import { useColumnResize } from '../../primitives/table/useColumnResize';
import { useColumnDrag } from '../../composables/use-column-drag';
import { fixedColumnStyle, useFixedColumns } from './use-table-fixed-columns';
import { useTableGroupHeader, type HeaderRow } from './use-table-group-header';

import type { CSSProperties, ComputedRef, Ref } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 汇总行函数类型 */
export type SummaryRowFn<T> = (data: T[]) => Record<string, string | number>;

/** 组件 props */
interface Props<T extends Record<string, unknown>> {
  /** 数据源 */
  dataSource: T[];
  /** 列定义（可扩展 fixed / width / children / label） */
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
  /** 是否启用列宽拖拽 */
  resizable?: boolean;
  /** 是否启用列顺序拖拽 */
  reorderable?: boolean;
  /** 树形表格配置（传值即启用树形模式） */
  treeConfig?: TreeConfig;
}

/* ============================================================ */
/* props / emit                                                  */
/* ============================================================ */

const props = withDefaults(defineProps<Props<T>>(), {
  class: '',
  enableFixedColumns: false,
  enableGroupHeader: false,
  columnVirtualizer: false,
  estimateColumnWidth: 120,
  isRemote: false,
  isSelectable: false,
  resizable: false,
  reorderable: false,
  rowKey: (_row: T, idx: number) => String(idx),
  selectType: 'checkbox',
});

const emit = defineEmits<{
  'sort-change': [prop: string, order: 'asc' | 'desc' | null];
  'selection-change': [keys: string[]];
  'update:expandedKeys': [keys: string[]];
  'columnResize': [payload: { columnKey: string; newWidth: number }];
  'columnReorder': [payload: { fromIndex: number; toIndex: number; columns: DataTableColumnDef<T>[] }];
}>();

const { t } = useLocale();

/* ============================================================ */
/* 固定列（useFixedColumns）                                     */
/* ============================================================ */

/** 列作为 ColumnFixedConfig 使用（固定列功能） */
const columnsAsFixedConfig = computed<ColumnFixedConfig[]>(() =>
  props.columns.map((col) => ({
    fixed: col.fixed,
    key: col.key,
    width: col.width,
  })),
);

const fixedColumnsApi = useFixedColumns(columnsAsFixedConfig);

/** 左固定列 */
const leftFixedColumns: ComputedRef<readonly ColumnFixedConfig[]> = computed(() =>
  props.enableFixedColumns ? fixedColumnsApi.leftFixedColumns.value : [],
);

/** 右固定列 */
const rightFixedColumns: ComputedRef<readonly ColumnFixedConfig[]> = computed(() =>
  props.enableFixedColumns ? fixedColumnsApi.rightFixedColumns.value : [],
);

/** 未固定列（中间区域，可能被虚拟滚动） */
const unfixedColumns: ComputedRef<readonly ColumnFixedConfig[]> = computed(() =>
  props.enableFixedColumns
    ? fixedColumnsApi.unfixedColumns.value
    : columnsAsFixedConfig.value,
);

/** 左固定列总宽度（px）—— 用于虚拟器 scrollPaddingStart */
const leftFixedTotalWidth = computed<number>(() =>
  leftFixedColumns.value.reduce((sum, col) => sum + (col.width ?? 120), 0),
);

/* ============================================================ */
/* 多级表头（useTableGroupHeader）                               */
/* ============================================================ */

/** 列作为 TableColumn 使用（多级表头功能） */
const columnsAsGroup = computed<TableColumn[]>(() =>
  props.columns.map((col) => ({
    children: col.children as TableColumn[] | undefined,
    key: col.key,
    label: col.label ?? col.key,
    ...(col.children ? { children: col.children as TableColumn[] } : {}),
  })),
);

const groupHeaderApi = useTableGroupHeader(
  () => (props.enableGroupHeader ? columnsAsGroup.value : []),
);

/** 多级表头分层行（二维数组） */
const headerRows: ComputedRef<readonly HeaderRow[]> = computed(() =>
  props.enableGroupHeader ? groupHeaderApi.headerRows.value : [],
);

/** 多级表头叶子列 */
const flatLeafColumns: ComputedRef<readonly TableColumn[]> = computed(() =>
  props.enableGroupHeader ? groupHeaderApi.flatColumnsLeaf.value : [],
);

/** 当前作为 cell 渲染的叶列（取决于是否启用 group header / fixed） */
const displayMiddleColumns = computed<readonly ColumnFixedConfig[]>(() => {
  if (props.enableGroupHeader) {
    // 多级表头下，叶子列转为 fixed config 以统一访问 .key / .width / .fixed
    return flatLeafColumns.value.map((col) => ({
      key: col.key ?? '',
      width: props.estimateColumnWidth,
    }));
  }
  return unfixedColumns.value;
});

/** 叶子列实际数量（用于虚拟器 count / shadow 判定 */
const middleColumnCount = computed<number>(() => displayMiddleColumns.value.length);

/* ============================================================ */
/* 列虚拟滚动（@tanstack/vue-virtual – horizontal）            */
/* ============================================================ */

/** 是否应启用虚拟滚动（列数超过阈值） */
const shouldVirtualizeColumns = computed<boolean>(() =>
  props.columnVirtualizer && middleColumnCount.value > 50,
);

/** 模板 ref：滚动容器 */
const tableScrollContainerRef = useTemplateRef<HTMLElement>('tableScrollContainer');

/** 虚拟列项（当前可见列区间） */
const middleVirtualItems = computed(() => {
  if (!shouldVirtualizeColumns.value) return [];
  return columnVirtualizer.value?.getVirtualItems() ?? [];
});

/** 虚拟列总宽度（用于设置 table 宽度） */
const totalMiddleVirtualWidth = computed<number>(() =>
  middleColumnCount.value * props.estimateColumnWidth,
);

/** 右固定列总宽度（px）—— 用于 spacer colspan */
const rightFixedTotalWidth = computed<number>(() =>
  rightFixedColumns.value.reduce((sum, col) => sum + (col.width ?? 120), 0),
);

/** 水平列虚拟器 */
const columnVirtualizer = useVirtualizer({
  count: () => middleColumnCount.value,
  estimateSize: () => props.estimateColumnWidth,
  getScrollElement: () => tableScrollContainerRef.value,
  get horizontal() {
    return shouldVirtualizeColumns.value;
  },
  overscan: 5,
  get scrollPaddingStart() {
    return leftFixedTotalWidth.value;
  },
});

/** 首个可见列索引（用于计算 spacer colspan） */
const firstVisibleColumnIndex = computed<number>(() =>
  middleVirtualItems.value[0]?.index ?? 0,
);

/** 末个可见列索引（用于计算 spacer colspan） */
const lastVisibleColumnIndex = computed<number>(() => {
  const items = middleVirtualItems.value;
  return items.length > 0 ? items[items.length - 1].index : middleColumnCount.value - 1;
});

/** 是否显示左 shadow（还有未渲染列在左方） */
const showColumnLeftShadow = computed<boolean>(() =>
  shouldVirtualizeColumns.value && firstVisibleColumnIndex.value > 0,
);

/** 是否显示右 shadow（还有未渲染列在右方） */
const showColumnRightShadow = computed<boolean>(() =>
  shouldVirtualizeColumns.value && lastVisibleColumnIndex.value < middleColumnCount.value - 1,
);

/* ============================================================ */
/* 表格数据层（useTableData）                                   */
/* ============================================================ */

const selectedKeysRef: Ref<Set<string>> = ref<Set<string>>(new Set());

const rowSelectionConfig = computed<RowSelectionConfig<T> | undefined>(() => {
  if (!props.isSelectable) return undefined;
  return {
    rowKey: props.rowKey,
    selectedKeys: selectedKeysRef,
    type: props.selectType,
  };
});

const table = useTableData<T>({
  data: () => props.dataSource,
  columns: () => props.columns,
  isRemote: props.isRemote,
  rowSelection: rowSelectionConfig.value,
});

/* ============================================================ */
/* 树形表格（TreeTable）                                        */
/* ============================================================ */

/** 树形扁平化行：附带深度与是否有子节点信息 */
interface TreeFlatRow<T> {
  row: T;
  depth: number;
  hasChildren: boolean;
  key: string;
}

/** 内部维护的展开 keys（非受控模式使用） */
const internalExpandedKeys = ref<Set<string>>(
  new Set(props.treeConfig?.defaultExpandedKeys ?? []),
);

/** 当前生效展开 keys（受控优先） */
const effectiveExpandedKeys = computed<Set<string>>(() => {
  if (props.treeConfig?.expandedKeys) {
    return new Set(props.treeConfig.expandedKeys);
  }
  return internalExpandedKeys.value;
});

/** 切换展开/收起 */
function toggleExpand(key: string): void {
  const next = new Set(internalExpandedKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  internalExpandedKeys.value = next;
  emit('update:expandedKeys', Array.from(next));
}

/** 树形扁平化计算 */
const treeFlatRows = computed<TreeFlatRow<T>[]>(() => {
  if (!props.treeConfig) return [];
  const result: TreeFlatRow<T>[] = [];
  const rows = viewRows.value;
  const childrenKey = props.treeConfig.childrenKey ?? 'children';

  function flatten(list: T[], depth: number): void {
    for (let i = 0; i < list.length; i++) {
      const r = list[i]!;
      const key = props.rowKey(r, result.length);
      const kids = (r as Record<string, unknown>)[childrenKey] as T[] | undefined;
      const hasChild = Array.isArray(kids) && kids.length > 0;
      result.push({ row: r, depth, hasChildren: hasChild, key });
      if (hasChild && effectiveExpandedKeys.value.has(key)) {
        flatten(kids!, depth + 1);
      }
    }
  }

  flatten(rows, 0);
  return result;
});

/** 实际渲染行（树形模式下为扁平化列表） */
const renderRows = computed<TreeFlatRow<T>[] | T[]>(() =>
  props.treeConfig ? treeFlatRows.value : viewRows.value,
);

/* ============================================================ */
/* 列宽拖拽（Column Resize）                                    */
/* ============================================================ */

const RESIZE_STORAGE_KEY = 'yd-datatable-col-widths';

/** 加载持久化列宽 */
function loadPersistedWidths(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RESIZE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 持久化列宽 */
function persistWidths(widths: Record<string, number>): void {
  try {
    localStorage.setItem(RESIZE_STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // noop
  }
}

const columnResizeApi = useColumnResize({
  initialWidths: loadPersistedWidths(),
  defaultMinWidth: 60,
});

/** 列宽拖拽：move handler 需要在组件内声明以便后续移除 */
let resizeMoveHandler: ((e: PointerEvent) => void) | null = null;
let resizeUpHandler: (() => void) | null = null;

function handleResizeStart(prop: string, event: PointerEvent): void {
  if (!props.resizable) return;
  columnResizeApi.onResizeStart(prop, event);

  resizeMoveHandler = (e: PointerEvent) => {
    columnResizeApi.onResizeMove(e);
    // 拖拽过程中实时持久化
    persistWidths({ ...columnResizeApi.columnWidths.value });
    // 实时 emit
    emit('columnResize', {
      columnKey: prop,
      newWidth: columnResizeApi.columnWidths.value[prop] ?? 0,
    });
  };
  resizeUpHandler = () => {
    columnResizeApi.onResizeEnd();
    document.removeEventListener('pointermove', resizeMoveHandler!);
    document.removeEventListener('pointerup', resizeUpHandler!);
    resizeMoveHandler = null;
    resizeUpHandler = null;
  };
  document.addEventListener('pointermove', resizeMoveHandler);
  document.addEventListener('pointerup', resizeUpHandler, { once: true });
}

/* ============================================================ */
/* 列顺序拖拽（Column Reorder）                                 */
/* ============================================================ */

/** 当前列顺序（支持拖拽重排时的本地副本） */
const reorderedColumns = ref<DataTableColumnDef<T>[]>([...props.columns]);

watch(
  () => props.columns,
  (cols) => {
    reorderedColumns.value = [...cols];
  },
  { deep: true },
);

const columnDragApi = useColumnDrag<DataTableColumnDef<T>>(
  () => reorderedColumns.value,
  (fromIndex, toIndex) => {
    const newCols = [...reorderedColumns.value];
    const [moved] = newCols.splice(fromIndex, 1);
    newCols.splice(toIndex, 0, moved!);
    reorderedColumns.value = newCols;
    emit('columnReorder', { fromIndex, toIndex, columns: newCols });
  },
);

/** 实际渲染列（支持拖拽重排） */
const effectiveRenderColumns = computed<readonly ColumnFixedConfig[]>(() => {
  if (props.reorderable) {
    return reorderedColumns.value.map((col) => ({
      key: col.key,
      width: col.width,
      fixed: col.fixed,
    }));
  }
  return renderColumns.value;
});

/* ============================================================ */
/* 事件处理                                                     */
/* ============================================================ */

function handleSelectAll(): void {
  table.toggleSelectAll();
  emit('selection-change', Array.from(table.selection.value));
}

function handleSelect(key: string): void {
  const set = table.selection.value;
  if (set.has(key)) {
    set.delete(key);
  } else {
    set.add(key);
  }
  emit('selection-change', Array.from(set));
}

/* ============================================================ */
/* 视图计算                                                     */
/* ============================================================ */

/** 渲染用叶列（多级表头模式下统一通过 displayMiddleColumns 访问） */
const renderColumns = computed<readonly ColumnFixedConfig[]>(() => {
  if (props.enableFixedColumns) return displayMiddleColumns.value;
  if (props.enableGroupHeader) return displayMiddleColumns.value;
  return columnsAsFixedConfig.value;
});

/** 视图行 */
const viewRows = computed<T[]>(() => table.viewRows.value);

/** 全量 keys */
const allKeys = computed<string[]>(() =>
  viewRows.value.map((row, idx) => props.rowKey(row, idx)),
);

/** 是否全选 */
const isAllSelected = computed<boolean>(() => {
  if (allKeys.value.length === 0) return false;
  return allKeys.value.every((k) => table.selection.value.has(k));
});

/** 是否部分选中 */
const someSelected = computed<boolean>(
  () => allKeys.value.some((k) => table.selection.value.has(k)) && !isAllSelected.value,
);

/** 当前列 cell-span（空态 / 汇总行使用） */
const totalCellSpan = computed<number>(() => {
  let total = effectiveRenderColumns.value.length;
  if (props.isSelectable) total += 1;
  if (props.treeConfig) total += 1;
  return total;
});

/** 获取列排序状态图标 */
function getSortIcon(col: Readonly<ColumnFixedConfig>): string {
  if (!table.sortState.value || table.sortState.value.prop !== col.key) return '';
  const order = table.sortState.value.order;
  return order === 'asc' ? '↑' : order === 'desc' ? '↓' : '';
}

defineExpose({
  clearFilters: table.clearFilters,
  selection: table.selection,
  sortState: table.sortState,
});
</script>

<template>
  <div
    ref="tableScrollContainer"
    :class="cn('relative w-full overflow-x-auto border rounded-md', props.class)"
    role="grid"
  >
    <!-- 列阴影哨兵：左侧 shadow -->
    <div
      v-if="showColumnLeftShadow"
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 start-0 top-0 z-10 w-3"
      style="background: linear-gradient(to right, hsl(var(--foreground) / 0.08), transparent);"
    />

    <!-- 列阴影哨兵：右侧 shadow -->
    <div
      v-if="showColumnRightShadow"
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 end-0 top-0 z-10 w-3"
      style="background: linear-gradient(to left, hsl(var(--foreground) / 0.08), transparent);"
    />

    <YdTable
      class="w-full border-collapse"
      :style="{ minWidth: `${totalMiddleVirtualWidth + leftFixedTotalWidth + rightFixedTotalWidth}px` }"
    >
      <!-- ====================================================== -->
      <!-- 表头                                                    -->
      <!-- ====================================================== -->
      <YdTableHeader>
        <!-- 多级表头模式 -->
        <template v-if="props.enableGroupHeader && headerRows.length > 0">
          <YdTableRow
            v-for="(hRow, hIdx) in headerRows"
            :key="hIdx"
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

            <!-- 树形展开列头（多级表头模式，仅首行 rowspan） -->
            <YdTableHead
              v-if="props.treeConfig && hIdx === 0"
              :rowspan="headerRows.length"
              class="w-10 px-2"
            />

            <!--
              左 / 右 固定列仅在多级表头的叶行（末行）渲染一次，
              避免在非叶行重复出现导致 colspan 错位。
              -->
            <template v-if="hIdx === headerRows.length - 1 && props.enableFixedColumns">
              <YdTableHead
                v-for="(col, cIdx) in leftFixedColumns"
                :key="`fixed-left-${col.key}`"
                :style="fixedColumnStyle(col as ColumnFixedConfig, 'left', [...leftFixedColumns]) as CSSProperties"
                :class="cn('sticky-cell', { 'border-e': cIdx === leftFixedColumns.length - 1 })"
              >
                {{ col.key }}
              </YdTableHead>
            </template>

            <!-- 分层表头列 -->
            <YdTableHead
              v-for="(cell, cellIdx) in hRow"
              :key="cell.key ?? `${hIdx}-${cellIdx}`"
              :colspan="cell.colspan"
              :rowspan="cell.rowspan"
              class="whitespace-nowrap font-medium text-start"
            >
              {{ cell.label }}
            </YdTableHead>

            <template v-if="hIdx === headerRows.length - 1 && props.enableFixedColumns">
              <YdTableHead
                v-for="(col, cIdx) in rightFixedColumns"
                :key="`fixed-right-${col.key}`"
                :style="fixedColumnStyle(col as ColumnFixedConfig, 'right', [...rightFixedColumns]) as CSSProperties"
                :class="cn('sticky-cell', { 'border-s': cIdx === 0 })"
              >
                {{ col.key }}
              </YdTableHead>
            </template>
          </YdTableRow>
        </template>

        <!-- 普通单行表头 -->
        <YdTableRow v-else class="bg-muted/50 border-b">
          <!-- 选择列 -->
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

          <!-- 树形展开列头（仅 treeConfig 开启） -->
          <YdTableHead v-if="props.treeConfig" class="w-10 px-2" />

          <!-- 左固定列头（sticky left） -->
          <YdTableHead
            v-for="(col, _cIdx) in leftFixedColumns"
            :key="`fixed-left-${col.key}`"
            :class="cn(
              'whitespace-nowrap font-medium',
              col.fixed === 'left' && 'sticky-cell',
            )"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'left', [...leftFixedColumns]) as CSSProperties"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.key }}
              <span v-if="getSortIcon(col)" class="text-xs text-muted-foreground/50">
                {{ getSortIcon(col) }}
              </span>
            </span>
          </YdTableHead>

          <!-- 中间列头（虚拟滚动 / 全量显示） -->
          <template v-if="shouldVirtualizeColumns">
            <!-- spacer cell 占位（隐藏列前的空白） -->
            <YdTableHead
              v-if="firstVisibleColumnIndex > 0"
              :colspan="firstVisibleColumnIndex"
              aria-hidden="true"
              class="p-0"
            />
            <!-- 可见虚拟列 -->
            <YdTableHead
              v-for="vItem in middleVirtualItems"
              :key="`virtual-col-${vItem.key}`"
              :class="cn(
                'whitespace-nowrap font-medium',
                displayMiddleColumns[vItem.index]?.fixed === 'left' && 'sticky-cell',
                props.resizable && 'relative',
              )"
              :style="{
                minWidth: `${props.estimateColumnWidth}px`,
                width: props.resizable && columnResizeApi.getColumnWidthStyle(displayMiddleColumns[vItem.index]?.key ?? '')
                  ? columnResizeApi.getColumnWidthStyle(displayMiddleColumns[vItem.index]?.key ?? '')!
                  : `${props.estimateColumnWidth}px`,
              }"
            >
              <span class="inline-flex items-center gap-1">
                {{ displayMiddleColumns[vItem.index]?.key }}
                <span
                  v-if="getSortIcon(displayMiddleColumns[vItem.index]!)"
                  class="text-xs text-muted-foreground/50"
                >
                  {{ getSortIcon(displayMiddleColumns[vItem.index]!) }}
                </span>
              </span>
              <!-- 列宽拖拽手柄 -->
              <div
                v-if="props.resizable"
                class="yd-resize-handle absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-primary/30"
                role="separator"
                @pointerdown="handleResizeStart(displayMiddleColumns[vItem.index]?.key ?? '', $event)"
              />
            </YdTableHead>
            <!-- spacer cell 占位（隐藏列后的空白） -->
            <YdTableHead
              v-if="lastVisibleColumnIndex < middleColumnCount - 1"
              :colspan="middleColumnCount - 1 - lastVisibleColumnIndex"
              aria-hidden="true"
              class="p-0"
            />
          </template>

          <!-- 中间列头（无虚拟滚动） -->
          <template v-else>
            <YdTableHead
              v-for="(col, cIdx) in effectiveRenderColumns"
              :key="col.key"
              :data-col-drag="props.reorderable ? cIdx : undefined"
              :class="cn(
                'whitespace-nowrap font-medium',
                col.fixed === 'left' && 'sticky-cell',
                props.resizable && 'relative',
                props.reorderable && 'cursor-grab select-none',
              )"
              :style="props.resizable ? columnResizeApi.getColumnWidthStyle(col.key) ? { width: columnResizeApi.getColumnWidthStyle(col.key) } : undefined : undefined"
              @pointerdown="props.reorderable && columnDragApi.onPointerDown($event, cIdx)"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.key }}
                <span v-if="getSortIcon(col)" class="text-xs text-muted-foreground/50">
                  {{ getSortIcon(col) }}
                </span>
              </span>
              <!-- 列宽拖拽手柄 -->
              <div
                v-if="props.resizable"
                class="yd-resize-handle absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-primary/30"
                :class="{ 'bg-primary/50': columnResizeApi.resizingProp.value === col.key }"
                role="separator"
                :aria-label="`resize-${col.key}`"
                @pointerdown="handleResizeStart(col.key, $event)"
              />
            </YdTableHead>
          </template>

          <!-- 右固定列头（sticky right） -->
          <YdTableHead
            v-for="(col, _cIdx) in rightFixedColumns"
            :key="`fixed-right-${col.key}`"
            :class="cn(
              'whitespace-nowrap font-medium',
              col.fixed === 'right' && 'sticky-cell',
            )"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'right', [...rightFixedColumns]) as CSSProperties"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.key }}
              <span v-if="getSortIcon(col)" class="text-xs text-muted-foreground/50">
                {{ getSortIcon(col) }}
              </span>
            </span>
          </YdTableHead>
        </YdTableRow>
      </YdTableHeader>

      <!-- ====================================================== -->
      <!-- 表体                                                    -->
      <!-- ====================================================== -->
      <YdTableBody>
        <!-- 空态 -->
        <YdTableRow v-if="(props.treeConfig ? treeFlatRows.length === 0 : viewRows.length === 0)">
          <YdTableCell
            :colspan="totalCellSpan"
            class="py-12 text-center text-muted-foreground"
          >
            {{ t('table.empty') }}
          </YdTableCell>
        </YdTableRow>

        <!-- 数据行 -->
        <YdTableRow
          v-for="(item, idx) in renderRows"
          :key="props.treeConfig ? (item as TreeFlatRow<T>).key : props.rowKey(item as T, idx)"
          class="border-b transition-colors hover:bg-muted/25"
        >
          <!-- 选择列 -->
          <YdTableCell v-if="props.isSelectable" class="px-2">
            <input
              :type="props.selectType === 'radio' ? 'radio' : 'checkbox'"
              :checked="table.selection.value.has(
                props.treeConfig
                  ? (item as TreeFlatRow<T>).key
                  : props.rowKey(item as T, idx),
              )"
              class="size-4"
              :aria-label="t('table.selectRow')"
              @change="handleSelect(
                props.treeConfig
                  ? (item as TreeFlatRow<T>).key
                  : props.rowKey(item as T, idx),
              )"
            />
          </YdTableCell>

          <!-- 树形展开/折叠列（仅 treeConfig 开启时渲染） -->
          <YdTableCell v-if="props.treeConfig" class="px-2">
            <span
              class="inline-flex items-center"
              :style="{ paddingLeft: `${((item as TreeFlatRow<T>).depth) * 16}px` }"
            >
              <button
                v-if="(item as TreeFlatRow<T>).hasChildren"
                class="yd-tree-toggle size-4 flex items-center justify-center text-xs hover:text-primary cursor-pointer select-none"
                :aria-expanded="effectiveExpandedKeys.has((item as TreeFlatRow<T>).key)"
                @click="toggleExpand((item as TreeFlatRow<T>).key)"
              >
                {{ effectiveExpandedKeys.has((item as TreeFlatRow<T>).key) ? '▼' : '▶' }}
              </button>
              <span v-else class="inline-block size-4" />
            </span>
          </YdTableCell>

          <!-- 左固定列单元格 -->
          <YdTableCell
            v-for="col in leftFixedColumns"
            :key="`fixed-left-${col.key}`"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'left', [...leftFixedColumns]) as CSSProperties"
            class="sticky-cell"
          >
            {{ ((props.treeConfig ? (item as TreeFlatRow<T>).row : item as T) as Record<string, unknown>)[col.key] ?? '-' }}
          </YdTableCell>

          <!-- 中间列单元格（虚拟 / 全量） -->
          <template v-if="shouldVirtualizeColumns">
            <YdTableCell
              v-if="firstVisibleColumnIndex > 0"
              :colspan="firstVisibleColumnIndex"
              aria-hidden="true"
              class="p-0"
            />
            <YdTableCell
              v-for="vItem in middleVirtualItems"
              :key="`virtual-cell-${vItem.key}`"
              :style="{
                minWidth: `${props.estimateColumnWidth}px`,
                width: props.resizable && columnResizeApi.getColumnWidthStyle(displayMiddleColumns[vItem.index]?.key ?? '')
                  ? columnResizeApi.getColumnWidthStyle(displayMiddleColumns[vItem.index]?.key ?? '')!
                  : `${props.estimateColumnWidth}px`,
              }"
            >
              {{ ((props.treeConfig ? (item as TreeFlatRow<T>).row : item as T) as Record<string, unknown>)[displayMiddleColumns[vItem.index]?.key ?? ''] ?? '-' }}
            </YdTableCell>
            <YdTableCell
              v-if="lastVisibleColumnIndex < middleColumnCount - 1"
              :colspan="middleColumnCount - 1 - lastVisibleColumnIndex"
              aria-hidden="true"
              class="p-0"
            />
          </template>

          <!-- 中间列单元格（无虚拟滚动） -->
          <template v-else>
            <YdTableCell
              v-for="col in effectiveRenderColumns"
              :key="col.key"
            >
              {{ ((props.treeConfig ? (item as TreeFlatRow<T>).row : item as T) as Record<string, unknown>)[col.key] ?? '-' }}
            </YdTableCell>
          </template>

          <!-- 右固定列单元格 -->
          <YdTableCell
            v-for="col in rightFixedColumns"
            :key="`fixed-right-${col.key}`"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'right', [...rightFixedColumns]) as CSSProperties"
            class="sticky-cell"
          >
            {{ ((props.treeConfig ? (item as TreeFlatRow<T>).row : item as T) as Record<string, unknown>)[col.key] ?? '-' }}
          </YdTableCell>
        </YdTableRow>

        <!-- 汇总行 -->
        <YdTableRow
          v-if="props.summary && viewRows.length > 0"
          class="border-t-2 font-medium bg-muted/30"
        >
          <YdTableCell :colspan="totalCellSpan">
            {{ JSON.stringify(props.summary(viewRows)) }}
          </YdTableCell>
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

/* 列宽拖拽手柄 */
.yd-resize-handle {
  touch-action: none;
  user-select: none;
}

/* 树形展开按钮 */
.yd-tree-toggle {
  background: transparent;
  border: none;
  padding: 0;
  line-height: 1;
}
</style>
