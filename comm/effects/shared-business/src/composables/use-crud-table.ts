/**
 * use-crud-table 组合式函数 — 通用 CRUD 列表页 Hook
 *
 * @path comm\effects\shared-business\src\composables\use-crud-table.ts
 * @author ydsz-team
 * @since 1.1.0
 *
 * @remarks
 * 整合服务端分页 + 删除确认 + 刷新 + 新增/编辑弹窗控制，
 * 对标 Vben Admin useTable 的能力子集，让标准 CRUD 页面少于 200 行。
 * v4.0.1: 内置 i18n 支持，消除硬编码中文。
 */
import { computed, ref } from 'vue';

import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  useServerPagination,
  type ServerPaginationFetcher,
} from './use-server-pagination';

/**
 * 删除函数类型
 *
 * @typeParam T - 数据行类型
 * @param row - 要删除的数据行
 * @returns 删除操作的 Promise
 * @since 1.1.0
 */
export type DeleteFetcher<T = unknown> = (row: T) => Promise<unknown>;

/**
 * CRUD 列表页配置项
 *
 * @typeParam T - 数据行类型
 * @typeParam Q - 查询参数类型
 * @since 1.1.0
 */
export interface CrudTableOptions<T = unknown, Q = Record<string, unknown>> {
  /** 分页查询函数 */
  fetcher: ServerPaginationFetcher<T, Q>;
  /** 删除函数（可选，不传则不显示删除按钮） */
  deleteFetcher?: DeleteFetcher<T>;
  /** 删除确认文案，接收数据行返回提示消息 */
  deleteMessage?: (row: T) => string;
  /** 主键字段名，默认 'id' */
  rowKey?: string;
  /** 初始分页大小，默认 10 */
  pageSize?: number;
}

/**
 * 通用 CRUD 列表 Hook — 整合分页、删除、弹窗控制
 *
 * 封装了标准 CRUD 列表页的核心逻辑：服务端分页、单条/批量删除（带确认弹窗）、
 * 新增/编辑弹窗状态管理。让标准 CRUD 页面代码量大幅减少。
 *
 * @typeParam T - 数据行类型
 * @typeParam Q - 查询参数类型
 * @param options - CRUD 配置项
 * @returns CRUD 状态与操作方法的集合
 * @returns items - 当前页数据列表（Ref）
 * @returns loading - 加载中状态（Ref）
 * @returns pagination - 分页信息（Computed）
 * @returns total - 总条数（Ref）
 * @returns selectedRows - 批量选中的行（Ref）
 * @returns dialogVisible - 新增/编辑弹窗是否可见（Ref）
 * @returns editingRow - 当前编辑的数据行（Ref）
 * @returns isEdit - 是否编辑模式（Computed）
 * @returns rowKey - 主键字段名
 * @returns search - 重置页码并查询
 * @returns fetchData - 执行当前页查询
 * @returns changePage - 切换页码
 * @returns changePageSize - 切换每页条数
 * @returns openCreate - 打开新增弹窗
 * @returns openEdit - 打开编辑弹窗
 * @returns closeDialog - 关闭弹窗
 * @returns onSaved - 保存成功后关闭弹窗并刷新
 * @returns handleDelete - 单条删除（带确认）
 * @returns handleBatchDelete - 批量删除（带确认）
 *
 * @example
 * ```ts
 * const crud = useCrudTable({
 *   fetcher: (query) => getListApi(query),
 *   deleteFetcher: (row) => deleteApi(row.id),
 * });
 *
 * // 模板中：@confirm-delete="crud.handleDelete"
 * ```
 *
 * @since 1.1.0
 */
export function useCrudTable<T = unknown, Q = Record<string, unknown>>(
  options: CrudTableOptions<T, Q>,
) {
  const { t } = useI18n();
  const { fetcher, deleteFetcher, deleteMessage, rowKey = 'id', pageSize = 10 } = options;

  const {
    changePage,
    changePageSize,
    fetchData,
    items,
    loading,
    pagination,
    search,
    total,
  } = useServerPagination<T, Q>(fetcher, {} as Q, { pageSize });

  /** 弹窗状态 */
  const dialogVisible = ref(false);
  const editingRow = ref<T | null>(null);
  const isEdit = computed(() => editingRow.value !== null);

  /** 批量选择 */
  const selectedRows = ref<T[]>([]);

  /** 打开新增弹窗 */
  function openCreate() {
    editingRow.value = null;
    dialogVisible.value = true;
  }

  /** 打开编辑弹窗 */
  function openEdit(row: T) {
    editingRow.value = row;
    dialogVisible.value = true;
  }

  /** 关闭弹窗 */
  function closeDialog() {
    dialogVisible.value = false;
    editingRow.value = null;
  }

  /** 保存成功回调（关闭弹窗并刷新） */
  async function onSaved() {
    closeDialog();
    await fetchData();
  }

  /** 删除（带确认） */
  async function handleDelete(row: T) {
    if (!deleteFetcher) return;
    const msg =
      deleteMessage?.(row) ?? t('crud.confirmDeleteDefault');
    try {
      await ElMessageBox.confirm(msg, t('crud.deleteConfirmTitle'), {
        type: 'warning',
        confirmButtonText: t('crud.deleteButton'),
        cancelButtonText: t('common.cancel'),
      });
    } catch {
      return; // 用户取消
    }

    try {
      await deleteFetcher(row);
      ElMessage.success(t('crud.deleteSuccess'));
      // 若当前页删空且不是第一页，回退一页
      if (items.value.length === 1 && pagination.value.current > 1) {
        changePage(pagination.value.current - 1);
      } else {
        await fetchData();
      }
    } catch (error) {
      ElMessage.error(t('crud.deleteFailed'));
      throw error;
    }
  }

  /** 批量删除 */
  async function handleBatchDelete() {
    if (!deleteFetcher || selectedRows.value.length === 0) return;
    try {
      await ElMessageBox.confirm(
        t('crud.batchDeleteConfirm', { count: selectedRows.value.length }),
        t('crud.batchDeleteTitle'),
        { type: 'warning' },
      );
    } catch {
      return;
    }
    await Promise.all(selectedRows.value.map((row) => deleteFetcher(row)));
    ElMessage.success(t('crud.batchDeleteSuccess'));
    selectedRows.value = [];
    await fetchData();
  }

  return {
    changePage,
    changePageSize,
    closeDialog,
    dialogVisible,
    editingRow,
    fetchData,
    handleBatchDelete,
    handleDelete,
    isEdit,
    items,
    loading,
    onSaved,
    openCreate,
    openEdit,
    pagination,
    rowKey,
    search,
    selectedRows,
    total,
  };
}
