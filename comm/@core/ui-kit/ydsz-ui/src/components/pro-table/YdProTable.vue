<script setup lang="ts" generic="T extends Record<string, unknown>
/**
* YdProTable —— 一体化 CRUD 表格封装（仿 Ant Design ProTable）。
* 
 * 设计目标：
 *  - 集成搜索栏（自动生成）+ 工具栏 + 数据表格（YdDataTable）+ 分页；
 *  - 覆盖 80% 后台管理列表页场景：查询/重置/新增/编辑/删除/批量操作/列选择；
 *  - 暴露 columns/dataSource/loading/onChange 等关键接口；
 *  - 支持行选择（checkbox/radio）、服务端分页/排序/筛选；
 *  - 5.7.0 追加：searchFields 自动搜索表单、editable 行内编辑、onCreate 新增弹窗。
* 
 * 接口契约（对齐 EP ProTable / Arco ProTable）：
 *  - columns：TableColumnDef[]（已内置 sortable/filterable）
 *  - dataSource：T[]（原始数据）
 *  - rowKey：(row) => string
 *  - pagination：分页配置
 *  - rowSelection：行选择配置（可选）
 *  - searchFields：搜索字段配置（自动渲染搜索表单）
 *  - editable：行内编辑配置
 *  - onCreate / createText：内置新增弹窗
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\YdProTable.vue
 * @author ydsz-team
 * @since 5.6.0 (5.7.0 追加行内编辑 / 搜索表单 / 新增弹窗)
 */">
import {
  computed,
  reactive,
  ref,
} from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import type { TableColumnDef } from '../../composables/use-table-data';
import { useTableData } from '../../composables/use-table-data';
import { YdDataTable } from '../data-table';
import { YdSelectSmart } from '../select';

import { YdButtonSmart } from '../button';

import {
  YdInput,
} from '../../primitives/input';
import {
  YdInputNumber,
} from '../../primitives/input-number';
import {
  YdDatePicker,
} from '../../primitives/date-picker';
import {
  YdRangePicker,
} from '../../primitives/range-picker';
import {
  YdDialog,
  YdDialogContent,
  YdDialogHeader,
  YdDialogTitle,
  YdDialogFooter,
} from '../../primitives/dialog';
import {
  YdFormItem,
} from '../../primitives/form';

import type {
  ProTableProps,
  EditableConfig,
} from './pro-table-types';

/* ============================================================ */
/* props / emit                                                  */
/* ============================================================ */

const props = withDefaults(defineProps<ProTableProps<T>>(), {
  class: '',
  isRemote: false,
  isLoading: false,
  rowKey: (_row: T, idx: number) => String(idx),
});

const emit = defineEmits<{
  (e: 'change', pagination: { current: number; pageSize: number; total: number }, filters: Record<string, unknown>, sorter: { prop: string; order: string | null }): void;
  (e: 'rowSelectionChange', selectedKeys: string[]): void;
  (e: 'pageChange', page: number, pageSize: number): void;
}>();

/* ============================================================ */
/* 行选择 + useTableData                                        */
/* ============================================================ */

const selectedKeysRef = ref(new Set(props.rowSelection?.selectedKeys ?? []));

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

const sortState = computed(() => tableData.sortState.value);

/* ============================================================ */
/* 分页事件                                                     */
/* ============================================================ */

function handlePageChange(page: number, pageSize: number): void {
  emit('pageChange', page, pageSize);
  emit('change',
    { ...(props.pagination ?? { current: 1, pageSize: 10, total: 0 }), current: page, pageSize },
    {},
    { prop: sortState.value.prop ?? '', order: sortState.value.order },
  );
}

/* ============================================================ */
/* 搜索表单（自动生成）                                         */
/* ============================================================ */

/** 搜索表单内部值 */
const searchValues = reactive<Record<string, any>>(
  Object.fromEntries((props.searchFields ?? []).map((f) => [f.key, undefined])),
);

/** 搜索 */
function handleSearch(): void {
  const values = { ...searchValues };
  emit('change',
    props.pagination ?? { current: 1, pageSize: 10, total: 0 },
    values as Record<string, unknown>,
    { prop: sortState.value.prop ?? '', order: sortState.value.order },
  );
  props.onSearch?.(values);
}

/** 重置 */
function handleResetSearch(): void {
  for (const key of Object.keys(searchValues)) {
    searchValues[key] = undefined;
  }
  handleSearch();
}

/** 是否显示自动搜索表单（searchFields 传入且未提供 search slot） */
const showAutoSearch = computed(() => !!props.searchFields?.length);

/* ============================================================ */
/* 行内编辑                                                     */
/* ============================================================ */

/** 是否启用行内编辑 */
const isEditable = computed(() => !!props.editable);

/** 当前编辑行索引 */
const editingRowIdx = ref(-1);

/** 编辑行临时数据 */
const editRowData = reactive<Record<string, any>>({});

/** 编辑配置对象 */
const editableConfig = computed<EditableConfig>(() => {
  if (typeof props.editable === 'object') return props.editable;
  return {};
});

/** 编辑按钮文字 */
const editBtnText = computed(() => props.editText ?? '编辑');
/** 删除按钮文字 */
const deleteBtnText = computed(() => props.deleteText ?? '删除');

/** 进入编辑模式 */
function startEdit(row: T, index: number): void {
  editingRowIdx.value = index;
  Object.assign(editRowData, { ...row });
  editableConfig.value.onEdit?.(row, index);
}

/** 保存编辑 */
async function saveEdit(index: number): Promise<void> {
  const ok = await editableConfig.value.onSave?.({ ...editRowData }, index);
  if (ok !== false) {
    editingRowIdx.value = -1;
  }
}

/** 取消编辑 */
function cancelEdit(row?: T, index?: number): void {
  editingRowIdx.value = -1;
  Object.keys(editRowData).forEach((k) => delete editRowData[k]);
  const r = row ?? editingRowIdx.value;
  const i = index ?? editingRowIdx.value;
  editableConfig.value.onCancel?.(r as T, i);
}

/* ============================================================ */
/* 新增弹窗                                                     */
/* ============================================================ */

const createDialogOpen = ref(false);
const createFormValues = reactive<Record<string, any>>(
  Object.fromEntries((props.searchFields ?? []).map((f) => [f.key, undefined])),
);

function handleOpenCreate(): void {
  if (props.onCreate) {
    // 使用内置弹窗
    for (const key of Object.keys(createFormValues)) {
      createFormValues[key] = undefined;
    }
    createDialogOpen.value = true;
  } else {
    // 无 onCreate 回调，触发外部 slot/toolbar
    emit('pageChange', 1, props.pagination?.pageSize ?? 10);
  }
}

function handleCreateSubmit(): void {
  props.onCreate?.({ ...createFormValues });
  createDialogOpen.value = false;
}

/* ============================================================ */
/* 列定义：追加操作列                                           */
/* ============================================================ */

/** 渲染用的列（只读模式直接透传；编辑模式下由自定义表格自行渲染操作列） */
const renderColumns = computed<TableColumnDef<T>[]>(() => props.columns);

/* ============================================================ */
/* 暴露方法                                                     */
/* ============================================================ */

defineExpose({
  clearFilters: tableData.clearFilters,
  selection: tableData.selection,
  sortState: tableData.sortState,
  viewRows: tableData.viewRows,
});
</script>

<template>
  <div :class="cn('flex flex-col gap-3', props.class)">
    <!-- ==================================================== -->
    <!-- 搜索表单（自动模式）                                  -->
    <!-- ==================================================== -->
    <div
      v-if="showAutoSearch || $slots.search"
      class="rounded-lg border bg-card p-3"
    >
      <!-- 自定义 search slot 优先 -->
      <slot v-if="$slots.search" name="search" />

      <!-- 自动生成搜索表单 -->
      <div v-else class="flex flex-wrap items-end gap-3">
        <!-- 字段控件 -->
        <div
          v-for="field in props.searchFields"
          :key="field.key"
          class="flex flex-col gap-1"
          :style="{ minWidth: field.width ? (typeof field.width === 'number' ? `${field.width}px` : field.width) : '180px' }"
        >
          <label class="text-xs font-medium text-muted-foreground">
            {{ field.label }}
          </label>

          <!-- text -->
          <YdInput
            v-if="!field.type || field.type === 'text'"
            v-model="searchValues[field.key]"
            :placeholder="field.placeholder ?? `请输入${field.label}`"
            size="sm"
            class="h-8"
          />

          <!-- select -->
          <YdSelectSmart
            v-else-if="field.type === 'select'"
            v-model="searchValues[field.key]"
            :options="field.options ?? []"
            :placeholder="field.placeholder ?? `请选择${field.label}`"
            class="h-8"
          />

          <!-- number -->
          <YdInputNumber
            v-else-if="field.type === 'number'"
            v-model="searchValues[field.key]"
            :placeholder="field.placeholder ?? `请输入${field.label}`"
            size="small"
            class="h-8"
          />

          <!-- date -->
          <YdDatePicker
            v-else-if="field.type === 'date'"
            v-model="searchValues[field.key]"
            :placeholder="field.placeholder ?? `请选择${field.label}`"
          />

          <!-- dateRange -->
          <YdRangePicker
            v-else-if="field.type === 'dateRange'"
            v-model="searchValues[field.key]"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2 ml-auto">
          <YdButtonSmart variant="default" size="sm" @click="handleSearch">
            搜索
          </YdButtonSmart>
          <YdButtonSmart variant="outline" size="sm" @click="handleResetSearch">
            重置
          </YdButtonSmart>
        </div>
      </div>
    </div>

    <!-- ==================================================== -->
    <!-- 工具栏                                                  -->
    <!-- ==================================================== -->
    <div
      v-if="$slots.toolbar || props.createText || props.onCreate"
      class="flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <!-- 新建按钮 -->
        <YdButtonSmart
          v-if="props.createText || props.onCreate"
          variant="default"
          size="sm"
          @click="handleOpenCreate"
        >
          {{ props.createText ?? '新建' }}
        </YdButtonSmart>
        <!-- 工具栏左侧 slot -->
        <slot name="toolbar-left" />
      </div>

      <!-- 工具栏右侧 slot -->
      <slot
        name="toolbar"
        :selected-count="tableData.selection.value.size"
        :loading="props.isLoading"
      />
    </div>

    <!-- ==================================================== -->
    <!-- 数据表格                                                -->
    <!-- ==================================================== -->
    <div v-if="!isEditable">
      <!-- 只读模式：使用 YdDataTable -->
      <YdDataTable
        :data-source="tableData.viewRows.value"
        :columns="(renderColumns as unknown) as any"
        :row-key="props.rowKey"
        :is-selectable="!!props.rowSelection"
        :select-type="props.rowSelection?.type ?? 'checkbox'"
        :is-remote="props.isRemote"
        :sort-state="sortState"
        :summary="props.summary"
      />
    </div>

    <!-- 行内编辑模式：使用自定义表格 -->
    <div
      v-else
      class="relative w-full overflow-x-auto border rounded-md"
      role="grid"
    >
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-muted/50 border-b">
            <!-- 行选择列 -->
            <th v-if="props.rowSelection" class="w-10 px-2 py-2">
              <slot name="select-all" />
            </th>

            <!-- 表头 -->
            <th
              v-for="col in props.columns"
              :key="col.key"
              class="whitespace-nowrap font-medium text-start px-3 py-2"
            >
              {{ col.key }}
            </th>

            <!-- 操作列表头 -->
            <th class="whitespace-nowrap font-medium text-start px-3 py-2 w-[140px]">
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- 空态 -->
          <tr v-if="tableData.viewRows.value.length === 0">
            <td
              :colspan="props.columns.length + (props.rowSelection ? 2 : 1)"
              class="py-12 text-center text-muted-foreground"
            >
              暂无数据
            </td>
          </tr>

          <!-- 数据行 -->
          <tr
            v-for="(row, rowIdx) in tableData.viewRows.value"
            :key="props.rowKey(row as T, rowIdx)"
            class="border-b transition-colors hover:bg-muted/25"
          >
            <!-- 行选择 -->
            <td v-if="props.rowSelection" class="px-2">
              <slot name="select-cell" :row="row" :index="rowIdx" />
            </td>

            <!-- 数据单元格 -->
            <td
              v-for="col in props.columns"
              :key="col.key"
              class="px-3 py-2"
            >
              <template v-if="editingRowIdx === rowIdx">
                <!-- 编辑态：根据列的字段名渲染输入 -->
                <YdInput
                  v-if="col.key"
                  v-model="editRowData[col.key]"
                  size="sm"
                  class="h-7 w-full min-w-[100px]"
                />
              </template>
              <template v-else>
                <slot
                  name="cell"
                  :row="row"
                  :index="rowIdx"
                  :column="col"
                  :value="(row as Record<string, unknown>)[col.key]"
                >
                  {{ (row as Record<string, unknown>)[col.key] ?? '-' }}
                </slot>
              </template>
            </td>

            <!-- 操作列 -->
            <td class="px-3 py-2">
              <div class="flex items-center gap-1">
                <template v-if="editingRowIdx === rowIdx">
                  <button
                    type="button"
                    class="text-xs text-primary hover:underline px-1"
                    @click="saveEdit(rowIdx)"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    class="text-xs text-muted-foreground hover:underline px-1"
                    @click="cancelEdit(row as T, rowIdx)"
                  >
                    取消
                  </button>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="text-xs text-primary hover:underline px-1"
                    @click="startEdit(row as T, rowIdx)"
                  >
                    {{ editBtnText }}
                  </button>
                  <button
                    type="button"
                    class="text-xs text-destructive hover:underline px-1"
                  >
                    {{ deleteBtnText }}
                  </button>
                </template>
              </div>
            </td>
          </tr>

          <!-- 汇总行 -->
          <tr
            v-if="props.summary && tableData.viewRows.value.length > 0"
            class="border-t-2 font-medium bg-muted/30"
          >
            <td :colspan="props.columns.length + (props.rowSelection ? 2 : 1)" class="px-3 py-2">
              {{ JSON.stringify(props.summary(tableData.viewRows.value)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================================================== -->
    <!-- 分页                                                    -->
    <!-- ==================================================== -->
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

    <!-- ==================================================== -->
    <!-- 新增弹窗                                                -->
    <!-- ==================================================== -->
    <YdDialog v-if="props.onCreate" v-model:open="createDialogOpen">
      <YdDialogContent class="sm:max-w-[480px]">
        <YdDialogHeader>
          <YdDialogTitle>{{ props.createText ?? '新建' }}</YdDialogTitle>
        </YdDialogHeader>

        <div class="grid gap-4 py-4">
          <template v-if="props.searchFields">
            <YdFormItem
              v-for="field in props.searchFields"
              :key="field.key"
              class="flex flex-col gap-1"
            >
              <label class="text-sm font-medium">
                {{ field.label }}
              </label>

              <!-- text -->
              <YdInput
                v-if="!field.type || field.type === 'text'"
                v-model="createFormValues[field.key]"
                :placeholder="field.placeholder ?? `请输入${field.label}`"
                size="sm"
              />

              <!-- select -->
              <YdSelectSmart
                v-else-if="field.type === 'select'"
                :model-value="createFormValues[field.key]"
                :options="field.options ?? []"
                :placeholder="field.placeholder ?? `请选择${field.label}`"
                @update:model-value="createFormValues[field.key] = $event"
              />

              <!-- number -->
              <YdInputNumber
                v-else-if="field.type === 'number'"
                :model-value="createFormValues[field.key]"
                :placeholder="field.placeholder ?? `请输入${field.label}`"
                size="small"
                @update:model-value="createFormValues[field.key] = $event"
              />

              <!-- date -->
              <YdDatePicker
                v-else-if="field.type === 'date'"
                :model-value="createFormValues[field.key]"
                :placeholder="field.placeholder ?? `请选择${field.label}`"
                @update:model-value="createFormValues[field.key] = $event"
              />

              <!-- dateRange -->
              <YdRangePicker
                v-else-if="field.type === 'dateRange'"
                :model-value="createFormValues[field.key]"
              />
            </YdFormItem>
          </template>
        </div>

        <YdDialogFooter>
          <YdButtonSmart variant="outline" size="sm" @click="createDialogOpen = false">
            取消
          </YdButtonSmart>
          <YdButtonSmart variant="default" size="sm" @click="handleCreateSubmit">
            确定
          </YdButtonSmart>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>

    <!-- 自定义 create-modal slot（外部覆盖内置弹窗） -->
    <slot name="create-modal" :opened="createDialogOpen" />
  </div>
</template>

<style scoped>
/* 行内编辑模式下的输入框样式调整 */
:deep(input:focus) {
  outline: none;
  box-shadow: 0 0 0 1px hsl(var(--primary));
}
</style>
