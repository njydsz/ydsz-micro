/**
 * @file useTableData.ts
 * @description 数据表格数据层状态机——排序 / 筛选 / 行选择 / 展开 / 树形 / 汇总。
 *
 * 数据流单向：业务方传入原始 data 与 columns，
 * 内部维护排序键、筛选条件、选中行集合、展开行集合、树形展开集合，
 * 产出**视图数据**（排序后 + 筛选后 + 拍平后的行数组）交给渲染层。
 *
 * 不包含：列拖拽 / 列宽调整 / 编辑单元格 / 服务端分页协议。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\useTableData.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { ComputedRef, Ref } from 'vue'

import { computed, ref } from 'vue'

import type { ColumnDef } from './ColumnDef'

/** useTableData 配置项 */
export interface UseTableDataOptions {
  /** 是否服务端模式（true 时禁用本地排序/筛选状态机，仅透传） */
  isRemote?: boolean
  /** 树形数据子节点字段名，默认 'children' */
  childrenKey?: string
  /** 行数据唯一键字段名，默认 'id' */
  rowKey?: string
}

/** 排序状态 */
export interface SortState {
  /** 当前排序列 prop，null 表示无排序 */
  prop: string | null
  /** 当前排序方向 */
  order: 'asc' | 'desc' | null
}

/** useTableData 返回句柄 */
export interface TableDataHandle<T extends Record<string, unknown>> {
  /** 视图数据（排序 + 筛选 + 树形拍平后），供渲染层消费 */
  viewRows: ComputedRef<T[]>
  /** 当前排序状态 */
  sortState: Ref<SortState>
  /** 当前选中行的 key 集合 */
  selectedKeys: Ref<Set<string | number>>
  /** 当前展开行的 key集合（树形 / 展开行） */
  expandedKeys: Ref<Set<string | number>>
  /** 切换排序（UI 点击表头时调用） */
  toggleSort: (prop: string) => void
  /** 设置筛选值（筛选菜单确认时调用） */
  setFilterValue: (prop: string, values: unknown[]) => void
  /** 切换行选中状态 */
  toggleRowSelection: (key: string | number, isSelected?: boolean) => void
  /** 全选 / 取消全选当前视图 */
  toggleAllSelection: (isSelected?: boolean) => void
  /** 设置行展开状态 */
  setRowExpanded: (key: string | number, isExpanded: boolean) => void
}

/**
 * 数据表格数据层状态机。
 *
 * @param source       原始行数据（受控）
 * @param columns      列定义（受控，含 sortable / filters 等元数据）
 * @param options      行为配置
 *
 * @example
 * ```ts
 * const { viewRows, sortState, selectedKeys, toggleSort } = useTableData(
 *   () => rawData,
 *   () => columns,
 *   { rowKey: 'id', childrenKey: 'children' },
 * )
 * ```
 */
export function useTableData<T extends Record<string, unknown>>(
  source: () => T[],
  columns: () => ColumnDef[],
  options: UseTableDataOptions = {},
): TableDataHandle<T> {
  const {
    isRemote = false,
    childrenKey = 'children',
    rowKey = 'id',
  } = options

  /** 排序状态（本地模式），受远程列 sortOrder 覆盖 */
  const sortState = ref<SortState>(computeInitialSortState(columns()))

  /** 列 prop → 筛选值集合 */
  const filterValues = ref<Map<string, unknown[]>>(new Map())

  /** 选中行 key 集合 */
  const selectedKeys = ref<Set<string | number>>(new Set())

  /** 展开行 key 集合 */
  const expandedKeys = ref<Set<string | number>>(new Set())

  /** 计算初始排序状态：优先读 columns 中的 sortOrder */
  function computeInitialSortState(cols: ColumnDef[]): SortState {
    const sorted = cols.find((col): boolean => col.sortOrder != null && col.sortOrder !== null)
    if (sorted?.prop && sorted.sortOrder)
      return { prop: sorted.prop, order: sorted.sortOrder }
    return { prop: null, order: null }
  }

  /** 应用排序 */
  function applySort(rows: T[]): T[] {
    if (isRemote)
      return rows

    const sortCol = activeSortColumn.value
    if (!sortCol?.prop || !sortCol.sortOrder)
      return rows

    const { prop, order } = sortCol
    const comparator = sortCol.sorter ?? defaultComparator

    return [...rows].sort((a: T, b: T): number => {
      const result = comparator(a, b, prop)
      return order === 'desc' ? -result : result
    })
  }

  /** 应用筛选 */
  function applyFilters(rows: T[]): T[] {
    if (isRemote)
      return rows

    const cols = columns()
    let result = rows

    for (const col of cols) {
      const activeFilters = filterValues.value.get(col.prop ?? '')
      if (!activeFilters || activeFilters.length === 0)
        continue
      if (!col.prop)
        continue

      const filterMethod = col.filterMethod ?? defaultFilterMethod
      result = result.filter((row): boolean =>
        activeFilters.some((filterValue: unknown): boolean => filterMethod(filterValue, row, col.prop!)),
      )
    }

    return result
  }

  /** 树形 + 展开行拍平 */
  function flattenTree(rows: T[]): T[] {
    const result: T[] = []

    function walk(node: T): void {
      const key = node[rowKey] as string | number
      result.push(node)

      if (expandedKeys.value.has(key)) {
        const children = (node[childrenKey] as T[] | undefined) ?? []
        children.forEach(walk)
      }
    }

    rows.forEach(walk)
    return result
  }

  /** 视图数据 = 原始 → 筛选 → 排序 → 树形拍平 */
  const viewRows = computed<T[]>(() => {
    const data = source()
    const filtered = applyFilters(data)
    const sorted = applySort(filtered)
    return flattenTree(sorted)
  })

  // ========== 公开操作方法 ==========

  /**
   * 切换排序列。
   * 禁止重复读取 state 做三分态判定（YDIZ-OOP-006：用 isAsc/isDesc 而非 sortOrder 字符串对比）。
   */
  function toggleSort(prop: string): void {
    if (isRemote)
      return

    const current = sortState.value
    if (current.prop !== prop) {
      sortState.value = { prop, order: 'asc' }
    } else {
      // 三分态：null → asc → desc → null
      let nextOrder: 'asc' | 'desc' | null
      if (current.order === null)
        nextOrder = 'asc'
      else if (current.order === 'asc')
        nextOrder = 'desc'
      else nextOrder = null

      sortState.value = { prop, order: nextOrder }
    }
  }

  /** 设置某列筛选值 */
  function setFilterValue(prop: string, values: unknown[]): void {
    if (isRemote)
      return
    filterValues.value.set(prop, values)
    // 触发响应式（Map 替换为浅拷贝）
    filterValues.value = new Map(filterValues.value)
  }

  /** 切换行选中状态 */
  function toggleRowSelection(key: string | number, isSelected?: boolean): void {
    const next = new Set(selectedKeys.value)
    const shouldSelect = isSelected ?? !next.has(key)
    if (shouldSelect)
      next.add(key)
    else next.delete(key)
    selectedKeys.value = next
  }

  /** 全选 / 取消全选 */
  function toggleAllSelection(isSelected?: boolean): void {
    const allKeys = viewRows.value.map((row): string | number => row[rowKey] as string | number)
    const shouldSelect = isSelected ?? selectedKeys.value.size !== allKeys.length
    selectedKeys.value = shouldSelect ? new Set(allKeys) : new Set()
  }

  /** 设置行展开状态 */
  function setRowExpanded(key: string | number, isExpanded: boolean): void {
    const next = new Set(expandedKeys.value)
    if (isExpanded)
      next.add(key)
    else next.delete(key)
    expandedKeys.value = next
  }

  return {
    viewRows,
    sortState,
    selectedKeys,
    expandedKeys,
    toggleSort,
    setFilterValue,
    toggleRowSelection,
    toggleAllSelection,
    setRowExpanded,
  }
}

/** 默认比较函数（按字段字典序） */
function defaultComparator<T extends Record<string, unknown>>(
  a: T,
  b: T,
  prop: string,
): number {
  const va = a[prop] ?? ''
  const vb = b[prop] ?? ''
  if (va < vb)
    return -1
  if (va > vb)
    return 1
  return 0
}

/** 默认筛选谓词（值相等） */
function defaultFilterMethod(
  filterValue: unknown,
  row: Record<string, unknown>,
  prop: string,
): boolean {
  return row[prop] === filterValue
}
