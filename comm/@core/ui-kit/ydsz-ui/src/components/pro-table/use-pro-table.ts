/**
 * useProTable —— YdProTable 脚本核心逻辑（行选择 / 分页 / 搜索表单 / 行内编辑 / 新增弹窗）。
 *
 * <p>从 {@link YdProTable.vue} 提取：
 * <ul>
 *   <li>行选择 ref 与 useTableData 装配、排序状态回传</li>
 *   <li>分页事件（pageChange / change）</li>
 *   <li>搜索表单状态（searchValues / handleSearch / handleResetSearch / showAutoSearch）</li>
 *   <li>行内编辑状态与协调（startEdit / saveEdit / cancelEdit / 按钮文案）</li>
 *   <li>新增弹窗状态（createDialogOpen / createFormValues / handleOpenCreate / handleCreateSubmit）</li>
 * </ul>
 *
 * <p>组件侧只保留：props / emit 声明、i18n、列定义透传、表格句柄委派与模板渲染，
 * 行为契约（props / emits / slots / expose）完全不变。
 *
 * <p><b>类型说明</b>：表单值容器沿用原组件的 `Record<string, any>`（搜索字段类型由
 * {@link SearchField.type} 运行时决定，无法在编译期收窄），保持与拆分前完全一致。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\use-pro-table.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import {
  computed,
  reactive,
  ref,
} from 'vue';

import type { ComputedRef, Ref } from 'vue';

import type { SortState, TableColumnDef } from '../../composables/use-table-data';
import { useTableData } from '../../composables/use-table-data';
import type { TableExportApi } from '../data-table';
import { useLocale } from '../../locale/useLocale';

import type {
  EditableConfig,
  ProTableProps,
} from './pro-table-types';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** useProTable 配置 */
export interface UseProTableOptions<T extends Record<string, unknown>> {
  /**
   * 组件 props（响应式，由 defineProps 返回）。
   *
   * <p>`rowKey` 在 SFC 中经 `withDefaults` 必有值，故此处标为必填。
   */
  props: ProTableProps<T> & { rowKey: (row: T, index: number) => string };
  /** 组件 emits 触发器 */
  emit: ProTableEmits;
}

/** ProTable 对外 emit 事件签名（与 SFC 声明保持一致） */
export interface ProTableEmits {
  (e: 'change', pagination: { current: number; pageSize: number; total: number }, filters: Record<string, unknown>, sorter: { prop: string; order: string | null }): void;
  (e: 'rowSelectionChange', selectedKeys: string[]): void;
  (e: 'pageChange', page: number, pageSize: number): void;
}

/** useProTable 返回句柄 */
export interface UseProTableReturn<T extends Record<string, unknown>> {
  /* ----- 行选择 + useTableData ----- */
  /** 选中行 key 集合 */
  selectedKeys: Ref<Set<string>>;
  /** 表格数据层句柄（viewRows / sortState / selection / clearFilters） */
  tableData: ReturnType<typeof useTableData<T>>;
  /** 主排序状态（透传给 YdDataTable） */
  sortState: ComputedRef<SortState>;
  /** 表头排序回传 */
  handleSortStateChange: (next: SortState) => void;
  /** 分页事件 */
  handlePageChange: (page: number, pageSize: number) => void;

  /* ----- 搜索表单 ----- */
  /** 搜索表单内部值 */
  searchValues: Record<string, any>;
  /** 触发搜索 */
  handleSearch: () => void;
  /** 重置搜索 */
  handleResetSearch: () => void;
  /** 是否显示自动搜索表单 */
  showAutoSearch: ComputedRef<boolean>;

  /* ----- 行内编辑 ----- */
  /** 是否启用行内编辑 */
  isEditable: ComputedRef<boolean>;
  /** 当前编辑行索引 */
  editingRowIdx: Ref<number>;
  /** 编辑行临时数据 */
  editRowData: Record<string, any>;
  /** 编辑配置对象 */
  editableConfig: ComputedRef<EditableConfig>;
  /** 编辑按钮文字 */
  editBtnText: ComputedRef<string>;
  /** 删除按钮文字 */
  deleteBtnText: ComputedRef<string>;
  /** 新建按钮/弹窗标题文字 */
  createBtnText: ComputedRef<string>;
  /** 进入编辑模式 */
  startEdit: (row: T, index: number) => void;
  /** 保存编辑 */
  saveEdit: (index: number) => Promise<void>;
  /** 取消编辑 */
  cancelEdit: (row?: T, index?: number) => void;

  /* ----- 新增弹窗 ----- */
  /** 新增弹窗可见 */
  createDialogOpen: Ref<boolean>;
  /** 新增弹窗表单值 */
  createFormValues: Record<string, any>;
  /** 打开新增弹窗 */
  handleOpenCreate: () => void;
  /** 提交新增 */
  handleCreateSubmit: () => void;

  /* ----- 列定义 ----- */
  /** 渲染用列（只读分支透传） */
  renderColumns: ComputedRef<TableColumnDef<T>[]>;

  /* ----- 表格句柄委派 ----- */
  /** 内部 YdDataTable 句柄（编辑分支未挂载时为 null） */
  dataTableRef: Ref<DataTableExposeHandle | null>;
  /** 导出句柄（委派内部表格） */
  exportingApi: ComputedRef<TableExportApi | undefined>;
}

/** YdDataTable defineExpose 句柄中被 ProTable 委派的部分 */
export interface DataTableExposeHandle {
  exporting: TableExportApi;
}

/* ============================================================ */
/* 主入口                                                        */
/* ============================================================ */

/**
 * 装配 YdProTable 的核心逻辑。
 *
 * @param options - props / emit
 * @returns ProTable 核心句柄
 */
export function useProTable<T extends Record<string, unknown>>(
  options: UseProTableOptions<T>,
): UseProTableReturn<T> {
  const { props, emit } = options;

  const { t } = useLocale();

  /* ============================================================ */
  /* 行选择 + useTableData                                        */
  /* ============================================================ */

  const selectedKeys: Ref<Set<string>> = ref(new Set(props.rowSelection?.selectedKeys ?? []));

  const tableData = useTableData<T>({
    data: () => props.dataSource,
    columns: () => props.columns,
    isRemote: props.isRemote,
    rowSelection: props.rowSelection
      ? {
          rowKey: props.rowKey,
          selectedKeys,
          type: props.rowSelection.type ?? 'checkbox',
        }
      : undefined,
  });

  const sortState = computed(() => tableData.sortState.value);

  /**
   * 表头排序回传：写回本组件的 useTableData，让 dataSource 的排序与表头状态一致，
   * 同时作为受控值下发给 YdDataTable，避免父子两份排序状态漂移。
   *
   * @param next - 子组件当前排序状态
   * @returns 无
   */
  function handleSortStateChange(next: SortState): void {
    tableData.sortState.value = next;
  }

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
  const editBtnText = computed(() => props.editText ?? t('common.edit'));
  /** 删除按钮文字 */
  const deleteBtnText = computed(() => props.deleteText ?? t('common.delete'));
  /** 新建按钮/弹窗标题文字 */
  const createBtnText = computed(() => props.createText ?? t('proTable.create'));

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
  /* 表格句柄委派                                                 */
  /* ============================================================ */

  /** 只读分支下的 YdDataTable 实例（行内编辑分支不挂载，故可能为 null） */
  const dataTableRef = ref<DataTableExposeHandle | null>(null);

  /** 内部表格句柄：编辑分支未挂载时为 undefined */
  const exportingApi = computed(() => dataTableRef.value?.exporting);

  return {
    /* 行选择 + useTableData */
    handlePageChange,
    handleSortStateChange,
    selectedKeys,
    sortState,
    tableData,
    /* 搜索表单 */
    handleResetSearch,
    handleSearch,
    searchValues,
    showAutoSearch,
    /* 行内编辑 */
    cancelEdit,
    deleteBtnText,
    editBtnText,
    editRowData,
    editableConfig,
    editingRowIdx,
    isEditable,
    saveEdit,
    startEdit,
    /* 新增弹窗 */
    createBtnText,
    createDialogOpen,
    createFormValues,
    handleCreateSubmit,
    handleOpenCreate,
    /* 列定义 */
    renderColumns,
    /* 表格句柄委派 */
    dataTableRef,
    exportingApi,
  };
}
