<!--
 * YdDataTable —— 增强数据表格：行选择 / 列排序 / 多选 / 固定列 / 多级表头 / 列虚拟滚动。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTable.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script lang="ts">
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
</script>

<script lang="ts" setup generic="T extends Record<string, unknown>">
import {
  computed,
  ref,
  useTemplateRef,
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
import { fixedColumnStyle, useFixedColumns } from './use-table-fixed-columns';
import { useTableGroupHeader } from './use-table-group-header';

import type { ComputedRef, Ref } from 'vue';

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
  rowKey: (_row: T, idx: number) => String(idx),
  selectType: 'checkbox',
});

const emit = defineEmits<{
  'sort-change': [prop: string, order: 'asc' | 'desc' | null];
  'selection-change': [keys: string[]];
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
const headerRows: ComputedRef<readonly ReadonlyArray<readonly Array<{ key?: string; label: string; rowspan: number; colspan: number; isLeaf: boolean }>>> = computed(() =>
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
/* 事件处理                                                     */
/* ============================================================ */

function handleSort(prop: string): void {
  table.toggleSort(prop);
  emit('sort-change', prop, table.sortState.value.order);
}

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
  let total = renderColumns.value.length;
  if (props.isSelectable) total += 1;
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

            <!--
              左 / 右 固定列仅在多级表头的叶行（末行）渲染一次，
              避免在非叶行重复出现导致 colspan 错位。
              -->
            <template v-if="hIdx === headerRows.length - 1 && props.enableFixedColumns">
              <YdTableHead
                v-for="(col, cIdx) in leftFixedColumns"
                :key="`fixed-left-${col.key}`"
                :style="fixedColumnStyle(col as ColumnFixedConfig, 'left', [...leftFixedColumns])"
                class="sticky-cell"
                :class="{ 'border-e': cIdx === leftFixedColumns.length - 1 }"
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
                :style="fixedColumnStyle(col as ColumnFixedConfig, 'right', [...rightFixedColumns])"
                class="sticky-cell"
                :class="{ 'border-s': cIdx === 0 }"
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

          <!-- 左固定列头（sticky left） -->
          <YdTableHead
            v-for="(col, cIdx) in leftFixedColumns"
            :key="`fixed-left-${col.key}`"
            :class="cn(
              'whitespace-nowrap font-medium',
              col.fixed === 'left' && 'sticky-cell',
            )"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'left', [...leftFixedColumns])"
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
              )"
              :style="{
                minWidth: `${props.estimateColumnWidth}px`,
                width: `${props.estimateColumnWidth}px`,
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
              v-for="(col, cIdx) in displayMiddleColumns"
              :key="col.key"
              :class="cn(
                'whitespace-nowrap font-medium',
                col.fixed === 'left' && 'sticky-cell',
              )"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.key }}
                <span v-if="getSortIcon(col)" class="text-xs text-muted-foreground/50">
                  {{ getSortIcon(col) }}
                </span>
              </span>
            </YdTableHead>
          </template>

          <!-- 右固定列头（sticky right） -->
          <YdTableHead
            v-for="(col, cIdx) in rightFixedColumns"
            :key="`fixed-right-${col.key}`"
            :class="cn(
              'whitespace-nowrap font-medium',
              col.fixed === 'right' && 'sticky-cell',
            )"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'right', [...rightFixedColumns])"
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
        <YdTableRow v-if="viewRows.length === 0">
          <YdTableCell
            :colspan="totalCellSpan"
            class="py-12 text-center text-muted-foreground"
          >
            {{ t('table.empty') }}
          </YdTableCell>
        </YdTableRow>

        <!-- 数据行 -->
        <YdTableRow
          v-for="(row, idx) in viewRows"
          :key="props.rowKey(row, idx)"
          class="border-b transition-colors hover:bg-muted/25"
        >
          <!-- 选择列 -->
          <YdTableCell v-if="props.isSelectable" class="px-2">
            <input
              :type="props.selectType === 'radio' ? 'radio' : 'checkbox'"
              :checked="table.selection.value.has(props.rowKey(row, idx))"
              class="size-4"
              :aria-label="t('table.selectRow')"
              @change="handleSelect(props.rowKey(row, idx))"
            />
          </YdTableCell>

          <!-- 左固定列单元格 -->
          <YdTableCell
            v-for="col in leftFixedColumns"
            :key="`fixed-left-${col.key}`"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'left', [...leftFixedColumns])"
            class="sticky-cell"
          >
            {{ (row as Record<string, unknown>)[col.key] ?? '-' }}
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
                width: `${props.estimateColumnWidth}px`,
              }"
            >
              {{ (row as Record<string, unknown>)[displayMiddleColumns[vItem.index]?.key] ?? '-' }}
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
              v-for="col in displayMiddleColumns"
              :key="col.key"
            >
              {{ (row as Record<string, unknown>)[col.key] ?? '-' }}
            </YdTableCell>
          </template>

          <!-- 右固定列单元格 -->
          <YdTableCell
            v-for="col in rightFixedColumns"
            :key="`fixed-right-${col.key}`"
            :style="fixedColumnStyle(col as ColumnFixedConfig, 'right', [...rightFixedColumns])"
            class="sticky-cell"
          >
            {{ (row as Record<string, unknown>)[col.key] ?? '-' }}
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
</style>
