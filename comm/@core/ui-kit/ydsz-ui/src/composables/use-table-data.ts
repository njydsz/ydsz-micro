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
 *  - multipleSort: 是否允许多列排序（排序链按数组顺序逐位比较）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-data.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { computed, ref, watch, toValue } from 'vue';

import type { ComputedRef, MaybeRefOrGetter, Ref, WritableComputedRef } from 'vue';

import { useTableFilterStorage } from './use-table-filter-storage';

import type { UseTableFilterStorageOptions } from './use-table-filter-storage';

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

/** 排序方向 */
export type SortOrder = 'asc' | 'desc';

/** 排序状态 */
export interface SortState {
  prop: string | null;
  order: SortOrder | null;
}

/** 生效中的排序规则（排序链元素，prop / order 必定有值） */
export interface SortRule {
  prop: string;
  order: SortOrder;
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

/** 持久化写入防抖延迟（毫秒） */
const SAVE_DEBOUNCE_MS = 300;

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
  /** 是否允许多列排序（true 时 toggleSort(prop, true) 追加到排序链） */
  multipleSort?: MaybeRefOrGetter<boolean>;
  /** 初始排序链（受控恢复场景使用） */
  initialSortChain?: SortRule[];
  /** 行选择配置 */
  rowSelection?: RowSelectionConfig<T>;
  /** 默认展开全部 */
  defaultExpandAllRows?: boolean;
  /**
   * 筛选条件持久化配置。
   * 传入后自动将 filterState 保存到 localStorage，页面切换后恢复。
   * 内部透传给 useTableFilterStorage。
   */
  filterStorage?: UseTableFilterStorageOptions;
}

/**
 * useTableData 返回句柄。
 */
export interface UseTableDataReturn<T> {
  /** 视图数据（排序+筛选后的结果） */
  viewRows: ComputedRef<T[]>;
  /** 主排序状态（等价于 sortChain[0]；写入时覆盖整条排序链） */
  sortState: WritableComputedRef<SortState>;
  /** 生效中的排序链（按优先级从高到低） */
  sortChain: Ref<SortRule[]>;
  /** 触发排序（列点击）；additive=true 时追加/更新排序链中的该列 */
  toggleSort: (prop: string, additive?: boolean) => void;
  /** 直接设置排序链（覆盖式） */
  setSortChain: (chain: SortRule[]) => void;
  /** 清空排序 */
  clearSort: () => void;
  /** 读取某列当前排序方向 */
  getSortOrder: (prop: string) => SortOrder | null;
  /** 读取某列在多列排序中的次序（从 1 开始；单列或未参与排序返回 null） */
  getSortRank: (prop: string) => number | null;
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
  const { data, columns: getColumns, filterStorage: filterStorageOptions } = options;

  /* ----- 筛选条件持久化（可选） ----- */
  const filterStorage = filterStorageOptions
    ? useTableFilterStorage(filterStorageOptions)
    : null;

  const isFilterRestored = ref(false);

  /* ----- 排序状态 ----- */
  /** 生效排序链（优先级从高到低，元素必定完整） */
  const sortChain = ref<SortRule[]>([]);

  /**
   * 覆盖式写入排序链，过滤掉空规则与重复列。
   *
   * @param chain - 目标排序链
   * @returns 无
   */
  function setSortChain(chain: SortRule[]): void {
    const merged: SortRule[] = [];
    for (const rule of chain) {
      // 排序链可能来自外部受控输入（props / localStorage 恢复），只接受完整合法规则
      if (!rule?.prop || (rule.order !== 'asc' && rule.order !== 'desc')) continue;
      if (merged.some(item => item.prop === rule.prop)) continue;
      merged.push({ order: rule.order, prop: rule.prop });
    }
    sortChain.value = merged;
  }

  setSortChain(options.initialSortChain ?? []);

  /** 主排序状态：等价于排序链首元素，写入时覆盖整条链 */
  const sortState = computed<SortState>({
    get: () => {
      const primary = sortChain.value[0];
      return primary ? { order: primary.order, prop: primary.prop } : { order: null, prop: null };
    },
    set: (next) => {
      setSortChain(next.prop && next.order ? [{ order: next.order, prop: next.prop }] : []);
    },
  });

  /** 单列在排序链中的下一状态：asc → desc → 移除 */
  function nextOrderFor(current: SortOrder | undefined): SortOrder | null {
    if (current === 'asc') return 'desc';
    if (current === 'desc') return null;
    return 'asc';
  }

  function toggleSort(prop: string, additive = false): void {
    const allowMulti = toValue(options.multipleSort ?? false);
    // 追加模式保留整条链；否则只保留同列规则，使 asc → desc → 取消 的循环可继续
    const next = allowMulti && additive
      ? [...sortChain.value]
      : sortChain.value.filter(rule => rule.prop === prop);
    const index = next.findIndex(rule => rule.prop === prop);
    const order = nextOrderFor(index >= 0 ? next[index]?.order : undefined);
    if (index >= 0) {
      if (order) next[index] = { order, prop };
      else next.splice(index, 1);
    } else if (order) {
      next.push({ order, prop });
    }
    sortChain.value = next;
  }

  function clearSort(): void {
    sortChain.value = [];
  }

  function getSortOrder(prop: string): SortOrder | null {
    return sortChain.value.find(rule => rule.prop === prop)?.order ?? null;
  }

  function getSortRank(prop: string): number | null {
    if (!toValue(options.multipleSort ?? false)) return null;
    const index = sortChain.value.findIndex(rule => rule.prop === prop);
    return index >= 0 ? index + 1 : null;
  }

  /* ----- 筛选状态 ----- */
  // 若启用了持久化，尝试从 storage 恢复初始值
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
  // 标记是否从 localStorage 恢复了数据
  if (filterStorage && Object.keys(filterStorage.filters.value).length > 0) {
    isFilterRestored.value = true;
  }

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
    filterStorage?.clear();
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

  /**
   * 构造单列比较器：优先使用列自定义 sorter，缺省按字符串字典序。
   *
   * @param defs - 列定义集合
   * @param rule - 排序规则
   * @returns 比较函数
   */
  function buildComparator<TDef extends TableColumnDef<T>>(
    defs: TDef[],
    rule: SortRule,
  ): (a: T, b: T) => number {
    const dir = rule.order === 'asc' ? 1 : -1;
    const compare = defs.find(c => c.key === rule.prop)?.sorter;
    return (a, b) => {
      if (compare) return compare(a, b) * dir;
      return String(a[rule.prop] ?? '').localeCompare(String(b[rule.prop] ?? '')) * dir;
    };
  }

  const sortedRows = computed<T[]>(() => {
    if (options.isRemote) return rawRows.value;
    const chain = sortChain.value;
    if (chain.length === 0) return rawRows.value;

    const colDefs = getColumns ? toValue(getColumns) ?? [] : [];
    const comparators = chain.map(rule => buildComparator(colDefs, rule));

    return [...rawRows.value].sort((a, b) => {
      for (const compare of comparators) {
        const result = compare(a, b);
        if (result !== 0) return result;
      }
      return 0;
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

  /* ----- 持久化自动同步：filterState 变化时防抖写入 storage ----- */
  if (filterStorage) {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    watch(
      filterState,
      (newState) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          const obj: Record<string, unknown> = {};
          for (const [key, set] of newState) {
            if (set.size > 0) {
              obj[key] = Array.from(set);
            }
          }
          filterStorage!.save(obj);
          debounceTimer = null;
        }, SAVE_DEBOUNCE_MS);
      },
      { deep: true },
    );
  }

  return {
    clearFilters,
    clearPersistedFilters,
    clearSort,
    expandedKeys,
    filterState,
    getSortOrder,
    getSortRank,
    isFilterRestored,
    rawRows,
    selection,
    setFilter,
    setSortChain,
    setSelected,
    sortChain,
    sortState,
    toggleExpand,
    toggleSelectAll,
    toggleSort,
    viewRows,
  };
}
