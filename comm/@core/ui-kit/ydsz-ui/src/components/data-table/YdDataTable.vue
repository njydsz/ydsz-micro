<!--
 * YdDataTable —— 在 YdTable 基础上增加行选择 / 列排序 / 筛选 / 树形 / 汇总。
 *
 * 设计目标：
 *  - 包装 YdTable primitives，提供开箱即用的数据层能力；
 *  - 复用 useTableData 数据状态机；
 *  - 受控 / 非受控双模式；
 *  - 服务端场景传入 isRemote，本地排序/筛选关闭。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTable.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script lang="ts">
import type { TableColumnDef } from '../../composables/use-table-data';

/** 列定义（复用） */
export type { TableColumnDef };

/** 汇总行函数类型 */
export type SummaryRowFn<T> = (data: T[]) => Record<string, string | number>;
</script>

<script lang="ts" setup generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  useTableData,
  type RowSelectionConfig,
} from '../../composables/use-table-data';
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

/** 组件 props */
interface Props {
  /** 数据源 */
  dataSource: T[];
  /** 列定义 */
  columns: TableColumnDef<T>[];
  /** 行 key 获取 */
  rowKey?: (row: T, index: number) => string;
  /** 是否开启行选择 */
  isSelectable?: boolean;
  /** 选择类型 */
  selectType?: 'checkbox' | 'radio';
  /** 是否远程模式 */
  isRemote?: boolean;
  /** 当前排序状态（受控） */
  sortState?: SortState;
  /** 汇总行 */
  summary?: SummaryRowFn<T>;
  /** 类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
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

const selectedKeysRef = ref<Set<string>>(new Set());

// 行选择配置
const rowSelectionConfig = computed<RowSelectionConfig<T> | undefined>(() => {
  if (!props.isSelectable) return undefined;
  return {
    rowKey: props.rowKey,
    selectedKeys: selectedKeysRef,
    type: props.selectType,
  };
});

const table = useTableData({
  data: () => props.dataSource,
  columns: () => props.columns,
  isRemote: props.isRemote,
  rowSelection: rowSelectionConfig.value,
});

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

const viewRows = computed(() => table.viewRows.value);
const allKeys = computed(() => viewRows.value.map((row, idx) => props.rowKey(row, idx)));
const isAllSelected = computed(() => {
  if (allKeys.value.length === 0) return false;
  return allKeys.value.every((k) => table.selection.value.has(k));
});
const someSelected = computed(() => {
  return allKeys.value.some((k) => table.selection.value.has(k)) && !isAllSelected.value;
});

defineExpose({
  clearFilters: table.clearFilters,
  selection: table.selection,
  sortState: table.sortState,
});
</script>

<template>
  <YdTable
    :class="cn('w-full border-collapse', props.class)"
    role="grid"
  >
    <YdTableHeader>
      <YdTableRow class="bg-muted/50 border-b">
        <!-- 选择列 -->
        <YdTableHead v-if="isSelectable" class="w-10 px-2">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="someSelected"
            class="size-4"
            :aria-label="t('table.selectAll')"
            @change="handleSelectAll"
          />
        </YdTableHead>

        <!-- 数据列头 -->
        <YdTableHead
          v-for="col in columns"
          :key="col.key"
          :class="cn(
            'whitespace-nowrap font-medium',
            col.isSortable && 'cursor-pointer select-none hover:bg-accent/50',
          )"
          @click="col.isSortable && handleSort(col.key)"
        >
          <span class="inline-flex items-center gap-1">
            {{ col.key }}
            <span v-if="col.isSortable" class="text-xs text-muted-foreground/50">
              {{
                sortState?.prop === col.key
                  ? sortState.order === 'asc'
                    ? '↑'
                    : sortState.order === 'desc'
                      ? '↓'
                      : '↕'
                  : '↕'
              }}
            </span>
          </span>
        </YdTableHead>
      </YdTableRow>
    </YdTableHeader>

    <YdTableBody>
      <!-- 空态 -->
      <YdTableRow v-if="viewRows.length === 0">
        <YdTableCell :colspan="columns.length + (isSelectable ? 1 : 0)" class="py-12 text-center text-muted-foreground">
          {{ t('table.empty') }}
        </YdTableCell>
      </YdTableRow>

      <!-- 数据行 -->
      <YdTableRow
        v-for="(row, idx) in viewRows"
        :key="rowKey(row, idx)"
        class="border-b transition-colors hover:bg-muted/25"
      >
        <!-- 选择列 -->
        <YdTableCell v-if="isSelectable" class="px-2">
          <input
            :type="selectType === 'radio' ? 'radio' : 'checkbox'"
            :checked="table.selection.value.has(rowKey(row, idx))"
            class="size-4"
            :aria-label="t('table.selectRow')"
            @change="handleSelect(rowKey(row, idx))"
          />
        </YdTableCell>

        <!-- 数据单元格 -->
        <YdTableCell v-for="col in columns" :key="col.key">
          {{ (row as Record<string, unknown>)[col.key] ?? '-' }}
        </YdTableCell>
      </YdTableRow>

      <!-- 汇总行 -->
      <YdTableRow
        v-if="summary && viewRows.length > 0"
        class="border-t-2 font-medium bg-muted/30"
      >
        <YdTableCell :colspan="columns.length + (isSelectable ? 1 : 0)">
          {{ JSON.stringify(summary(viewRows)) }}
        </YdTableCell>
      </YdTableRow>
    </YdTableBody>
  </YdTable>
</template>
