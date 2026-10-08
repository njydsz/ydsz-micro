/**
 * useTableData Composable —— 表格数据层状态机（排序/筛选/选择/树形/聚合）。
 *
 * 设计目标：
 *  - 为 YdTable / YdDataTable 提供本地数据排序、筛选、行选择、树形展开、汇总行；
 *  - 受控 emit 模式：所有变化通过 emit 向上传达，服务端场景使用 remote prop 关闭本地状态；
 *  - 纯逻辑层，无渲染依赖，可脱离组件独立测试。
 *
 * 接口契约：
 *  - columnDef.sortable: 该列是否启用排序
 *  - columnDef.filters + filterMethod: 列筛选菜单
 *  - columnDef.sorter(a,b): 本地排序比较函数（缺省按字典序）
 *  - rowSelection: 是否启用行选择 + 当前选中 key 集合
 *  - treeData: 是否启用树形模式
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-data.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { computed, ref, watch, toValue } from 'vue';

import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';

import { useTableFilterStorage } from './use-table-filter-storage';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 列定义扩展（数据层） */
export interface TableColumnDef<T = Record<string, unknown>> {
  /** 列字段 key */
  key: string;
  /** 是否启用排序 */
  isSortable?: boolean;
  /** 是否启用筛选 */
  isFilterable?: boolean;
  /** 本地排序比较函数 */
  sorter?: (a: T, b: T) => number;
  /** 筛选选项 */
  filters?: Array<{ text: string; value: string }>;
  /** 筛选谓词 */
  filterMethod?: (value: string, row: T) => boolean;
}

/** 排序状态 */
export interface SortState {
  prop: string | null;
  order: 'asc' | 'desc' | null;
}

/** 行选择配置 */
export interface RowSelectionConfig<T> {
  /** 当前选中行 key 集合（受控） */
  selectedKeys?: Ref<Set<string>>;
  /** 行 key 获取函数 */
  rowKey: (row: T, index: number) => string;
  /** 类型：多选 / 单选 */
  type?: 'checkbox' | 'radio';
}

/* ============================================================ */
/* useTableData                                                  */
/* ============================================================ */

/**
 * 筛选条件持久化配置。
 */
export interface FilterPersistConfig {
  /** 表格唯一标识，作为 localStorage key 的一部分 */
  tableId: string;
  /** 默认筛选条件（首次进入且无持久化数据时使用） */
  defaultValue?: Record<string, unknown>;
  /** 过期时间（毫秒），默认 7 天 */
  ttl?: number;
}

/**
 * useTableData 参数。
 */
export interface UseTableDataOptions<T> {
  /** 原始数据源（getter 或数组） */
  data: MaybeRefOrGetter<T[]>;
  /** 列定义（可选，有列时才做排序/筛选） */
  columns?: MaybeRefOrGetter<TableColumnDef<T>[]>;
  /** 是否远程模式（true 时关闭本地排序/筛选） */
  isRemote?: boolean;
  /** 行选择配置 */
  rowSelection?: RowSelectionConfig<T>;
  /** 默认展开全部 */
  defaultExpandAllRows?: boolean;
  /**
   * 筛选条件持久化配置。
   * 传入后自动将 filterState 保存到 localStorage，页面切换后恢复。
   * 需同时提供 tableId 以隔离不同表格的存储。
   */
  persistFilters?: FilterPersistConfig;
}

/**
 * useTableData 返回句柄。
 */
export interface UseTableDataReturn<T> {
  /** 视图数据（排序+筛选后的结果） */
  viewRows: ComputedRef<T[]>;
  /** 当前排序状态 */
  sortState: Ref<SortState>;
  /** 触发排序（列点击） */
  toggleSort: (prop: string) => void;
  /** 当前筛选条件 -> 列 key: 已选值集合 */
  filterState: Ref<Map<string, Set<string>>>;
  /** 设置某列筛选条件 */
  setFilter: (columnKey: string, values: string[]) => void;
  /** 清除所有筛选 */
  clearFilters: () => void;
  /** 清除持久化的筛选条件（同时清空内存和 localStorage） */
  clearPersistedFilters: () => void;
  /** 是否从 localStorage 恢复了筛选条件 */
  isFilterRestored: Ref<boolean>;
  /** 选中行 key 集合（内部状态或受控态） */
  selection: Ref<Set<string>>;
  /** 设置选中行 */
  setSelected: (keys: string[]) => void;
  /** 全选/取消全选 */
  toggleSelectAll: () => void;
  /** 已展开行 key 集合 */
  expandedKeys: Ref<Set<string>>;
  /** 切换展开 */
  toggleExpand: (key: string) => void;
  /** 原始数据源（供外部引用） */
  rawRows: ComputedRef<T[]>;
}

/**
 * useTableData —— 表格数据层 Composable。
 *
 * @param options - 配置项
 * @returns 数据句柄
 */
export function useTableData<T extends Record<string, unknown>>(
  options: UseTableDataOptions<T>,
): UseTableDataReturn<T> {
  const { data, columns: getColumns, persistFilters } = options;

  /* ----- 筛选条件持久化（可选） ----- */
  const filterStorage = persistFilters
    ? useTableFilterStorage({
        defaultValue: persistFilters.defaultValue ?? {},
        tableId: persistFilters.tableId,
        ttl: persistFilters.ttl,
      })
    : null;

  const isFilterRestored = filterStorage?.isRestored ?? ref(false);

  /* ----- 排序状态 ----- */
  const sortState = ref<SortState>({ order: null, prop: null });

  function toggleSort(prop: string): void {
    const current = sortState.value;
    if (current.prop !== prop) {
      sortState.value = { order: 'asc', prop };
    } else if (current.order === 'asc') {
      sortState.value = { order: 'desc', prop };
    } else if (current.order === 'desc') {
      sortState.value = { order: null, prop: null };
    } else {
      sortState.value = { order: 'asc', prop };
    }
  }

  /* ----- 筛选状态 ----- */
  // 若启用了初始化持久化，尝试从 storage 恢复初始值
  function getInitialFilterState(): Map<string, Set<string>> {
    if (filterStorage) {
      const restored = filterStorage.filters.value;
      if (restored && Object.keys(restored).length > 0) {
        const map = new Map<string, Set<string>>();
        for (const [key, val] of Object.entries(restored)) {
          if (Array.isArray(val)) {
            map.set(key, new Set(val));
          }
        }
        return map;
      }
    }
    return new Map();
  }

  const filterState = ref<Map<string, Set<string>>>(getInitialFilterState());

  function setFilter(columnKey: string, values: string[]): void {
    if (values.length === 0) {
      filterState.value.delete(columnKey);
    } else {
      filterState.value.set(columnKey, new Set(values));
    }
  }

  function clearFilters(): void {
    filterState.value.clear();
  }

  /**
   * 清除持久化的筛选条件（同时清空内存和 localStorage）。
   */
  function clearPersistedFilters(): void {
    clearFilters();
    filterStorage?.clearFilters();
  }

  /* ----- 行选择状态 ----- */
  const innerSelection = ref<Set<string>>(new Set());
  const selection = options.rowSelection?.selectedKeys ?? innerSelection;

  function setSelected(keys: string[]): void {
    selection.value = new Set(keys);
  }

  function toggleSelectAll(): void {
    const allKeys = viewRows.value.map((row, idx) =>
      options.rowSelection
        ? options.rowSelection.rowKey(row, idx)
        : String(idx),
    );
    const isAllSelected = allKeys.every((k) => selection.value.has(k));
    selection.value = isAllSelected ? new Set() : new Set(allKeys);
  }

  /* ----- 树形展开 ----- */
  const expandedKeys = ref<Set<string>>(new Set());

  function toggleExpand(key: string): void {
    if (expandedKeys.value.has(key)) {
      expandedKeys.value.delete(key);
    } else {
      expandedKeys.value.add(key);
    }
  }

  /* ----- 排序后数据 ----- */
  const rawRows = computed(() => toValue(data) ?? []);

  const sortedRows = computed<T[]>(() => {
    if (options.isRemote) return rawRows.value;
    const { prop, order } = sortState.value;
    if (!prop || !order) return rawRows.value;

    const colDefs = getColumns ? toValue(getColumns) ?? [] : [];
    const matched = colDefs.find((c) => c.key === prop);
    const compare = matched?.sorter;

    const dir = order === 'asc' ? 1 : -1;
    return [...rawRows.value].sort((a, b) => {
      if (compare) return compare(a, b) * dir;
      const av = String(a[prop] ?? '');
      const bv = String(b[prop] ?? '');
      return av.localeCompare(bv) * dir;
    });
  });

  /* ----- 筛选后数据 ----- */
  const viewRows = computed<T[]>(() => {
    if (options.isRemote) return sortedRows.value;
    if (filterState.value.size === 0) return sortedRows.value;

    const colDefs = getColumns ? toValue(getColumns) ?? [] : [];
    return sortedRows.value.filter((row) => {
      for (const [colKey, values] of filterState.value) {
        const col = colDefs.find((c) => c.key === colKey);
        if (!col) continue;
        if (col.filterMethod) {
          const isAnyMatch = Array.from(values).some((v) => col.filterMethod!(v, row));
          if (!isAnyMatch) return false;
        }
      }
      return true;
    });
  });

  /* ----- 持久化自动同步：filterState 变化时写入 storage ----- */
  if (filterStorage) {
    watch(
      filterState,
      (newState) => {
        const obj: Record<string, unknown> = {};
        for (const [key, set] of newState) {
          if (set.size > 0) {
            obj[key] = Array.from(set);
          }
        }
        if (Object.keys(obj).length > 0) {
          filterStorage.saveFilters(obj);
        } else {
          // 筛选全部清空时也同步写入空对象
          filterStorage.saveFilters({});
        }
      },
      { deep: true },
    );
  }

  return {
    clearFilters,
    clearPersistedFilters,
    expandedKeys,
    filterState,
    isFilterRestored,
    rawRows,
    selection,
    setFilter,
    setSelected,
    sortState,
    toggleExpand,
    toggleSelectAll,
    toggleSort,
    viewRows,
  };
}
