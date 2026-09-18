<!--
 * YdProTable —— 一体化 CRUD 表格封装（仿 Ant Design ProTable）。
 *
 * 设计目标：
 *  - 集成搜索栏（YdAdvancedFilterBar）+ 工具栏 + 数据表格（YdDataTable）+ 分页；
 *  - 覆盖 80% 后台管理列表页场景：查询/重置/新增/批量操作/列选择；
 *  - 暴露 columns/dataSource/loading/onChange 等关键接口；
 *  - 支持行选择（checkbox/radio）、服务端分页/排序/筛选。
 *
 * 接口契约（对齐 EP ProTable / Arco ProTable）：
 *  - columns：TableColumnDef[]（已内置 sortable/filterable）
 *  - dataSource：T[]（原始数据）
 *  - loading：boolean
 *  - rowKey：(row) => string
 *  - pagination：分页配置
 *  - rowSelection：行选择配置（可选）
 *  - toolbar：工具栏按钮区插槽（新增/导出/批量操作）
 *  - search：搜索表单插槽（字段筛选/关键词搜索）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\YdProTable.vue
 * @author ydsz-team
 * @since 5.6.0
 -->

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import type { TableColumnDef } from '../../composables/use-table-data';
import { useTableData } from '../../composables/use-table-data';
import { YdDataTable } from '../data-table';

/** 分页配置 */
interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
}

/** 行选择配置 */
interface RowSelectionConfig {
  selectedKeys?: string[];
  type?: 'checkbox' | 'radio';
}

export interface ProTableProps<T> {
  /** 列定义（含排序/筛选配置） */
  columns: TableColumnDef<T>[];
  /** 数据源 */
  dataSource: T[];
  /** 行唯一 key 获取函数 */
  rowKey?: (row: T, index: number) => string;
  /** 加载状态 */
  isLoading?: boolean;
  /** 分页配置（传 null 则隐藏分页） */
  pagination?: PaginationConfig | null;
  /** 行选择配置（不传则不启用行选择） */
  rowSelection?: RowSelectionConfig;
  /** 是否远程模式（关闭本地排序/筛选） */
  isRemote?: boolean;
  /** 容器类名 */
  class?: string;
  /** 汇总行计算函数 */
  summary?: (data: T[]) => Record<string, string | number>;
}

const props = withDefaults(defineProps<ProTableProps<T>>(), {
  class: '',
  isRemote: false,
  isLoading: false,
  rowKey: (_row: T, idx: number) => String(idx),
});

const emit = defineEmits<{
  (e: 'change', pagination: PaginationConfig, filters: Record<string, unknown>, sorter: { prop: string; order: string | null }): void;
  (e: 'rowSelectionChange', selectedKeys: string[]): void;
  (e: 'pageChange', page: number, pageSize: number): void;
}>();

// 行选择：使用受控态 ref 让 useTableData 能读到
const selectedKeysRef = ref(new Set(props.rowSelection?.selectedKeys ?? []));

/** 注入 useTableData 数据层状态机 */
const tableData = useTableData<T>({
  data: () => props.dataSource,
  columns: () => props.columns,
  isRemote: props.isRemote,
  rowSelection: props.rowSelection
    ? {
        rowKey: props.rowKey,
        selectedKeys: selectedKeysRef,
        type: props.rowSelection.type ?? 'checkbox',
      }
    : undefined,
});

/** 当前排序状态 */
const sortState = computed(() => tableData.sortState.value);

/** 当前筛选状态 */
const filterState = computed(() => tableData.filterState.value);

/** 处理页码变更 */
function handlePageChange(page: number, pageSize: number): void {
  emit('pageChange', page, pageSize);
  emit('change',
    { ...(props.pagination ?? { current: 1, pageSize: 10, total: 0 }), current: page, pageSize },
    {},
    { prop: sortState.value.prop ?? '', order: sortState.value.order },
  );
}

/** 处理排序变更 */
function handleSortChange(prop: string): void {
  tableData.toggleSort(prop);
  emit('change',
    props.pagination ?? { current: 1, pageSize: 10, total: 0 },
    {},
    { prop, order: sortState.value.order },
  );
}

defineExpose({
  clearFilters: tableData.clearFilters,
  selection: tableData.selection,
  sortState: tableData.sortState,
  viewRows: tableData.viewRows,
});
</script>

<template>
  <div :class="cn('flex flex-col gap-3', props.class)">
    <!-- 搜索/筛选栏插槽 -->
    <div v-if="$slots.search" class="rounded-lg border bg-card p-3">
      <slot name="search" />
    </div>

    <!-- 工具栏插槽 -->
    <div v-if="$slots.toolbar" class="flex items-center justify-between">
      <slot
        name="toolbar"
        :selected-count="tableData.selection.value.size"
        :loading="props.isLoading"
      />
    </div>

    <!-- 数据表格 -->
    <YdDataTable
      :data-source="tableData.viewRows.value"
      :columns="props.columns as TableColumnDef<Record<string, unknown>>[]"
      :row-key="props.rowKey"
      :is-selectable="!!props.rowSelection"
      :select-type="props.rowSelection?.type ?? 'checkbox'"
      :is-remote="props.isRemote"
      :sort-state="sortState"
      :summary="props.summary"
    />

    <!-- 分页 -->
    <div
      v-if="props.pagination"
      class="flex items-center justify-end gap-2"
    >
      <span class="text-sm text-muted-foreground">
        共 {{ props.pagination.total }} 条
      </span>
      <div class="flex gap-1">
        <button
          type="button"
          class="rounded border px-2 py-1 text-sm disabled:opacity-50"
          :disabled="props.pagination.current <= 1"
          @click="handlePageChange(props.pagination.current - 1, props.pagination.pageSize)"
        >
          上一页
        </button>
        <span class="rounded border px-3 py-1 text-sm">
          {{ props.pagination.current }}
        </span>
        <button
          type="button"
          class="rounded border px-2 py-1 text-sm disabled:opacity-50"
          @click="handlePageChange(props.pagination.current + 1, props.pagination.pageSize)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
