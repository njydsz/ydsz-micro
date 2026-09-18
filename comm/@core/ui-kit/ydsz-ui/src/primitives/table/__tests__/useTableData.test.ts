/**
 * @file useTableData.test.ts
 * @description useTableData composable 行为测试——排序 / 筛选 / 选择 / 展开 四个状态机。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\__tests__\useTableData.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest'

import type { ColumnDef } from '../ColumnDef'
import { useTableData } from '../useTableData'

interface TestRow {
  id: number
  name: string
  age: number
  dept?: string
  children?: TestRow[]
}

const sampleRows: TestRow[] = [
  { id: 1, name: '张三', age: 30, dept: 'tech' },
  { id: 2, name: '李四', age: 25, dept: 'product' },
  { id: 3, name: '王五', age: 35, dept: 'tech' },
  { id: 4, name: '赵六', age: 28, dept: 'design' },
]

const sampleColumns: ColumnDef[] = [
  { prop: 'id', label: 'ID', isSortable: true },
  { prop: 'name', label: '姓名', isSortable: true },
  { prop: 'age', label: '年龄', isSortable: true },
  {
    prop: 'dept',
    label: '部门',
    isSortable: true,
    filters: [
      { text: '技术部', value: 'tech' },
      { text: '产品部', value: 'product' },
      { text: '设计部', value: 'design' },
    ],
  },
]

describe('useTableData', () => {
  describe('默认状态', () => {
    it('初始视图数据与原始数据一致（无排序无筛选）', () => {
      const { viewRows } = useTableData(() => sampleRows, () => sampleColumns)
      expect(viewRows.value).toHaveLength(4)
      expect(viewRows.value[0]!.id).toBe(1)
    })

    it('初始选中集合为空', () => {
      const { selectedKeys } = useTableData(() => sampleRows, () => sampleColumns)
      expect(selectedKeys.value.size).toBe(0)
    })

    it('初始展开集合为空', () => {
      const { expandedKeys } = useTableData(() => sampleRows, () => sampleColumns)
      expect(expandedKeys.value.size).toBe(0)
    })
  })

  describe('排序状态机', () => {
    it('首次点击排序列 → asc', () => {
      const { sortState, toggleSort } = useTableData(() => sampleRows, () => sampleColumns)
      toggleSort('age')
      expect(sortState.value).toEqual({ prop: 'age', order: 'asc' })
    })

    it('第二次点击同列 → desc', () => {
      const { sortState, toggleSort } = useTableData(() => sampleRows, () => sampleColumns)
      toggleSort('age')
      toggleSort('age')
      expect(sortState.value.order).toBe('desc')
    })

    it('第三次点击同列 → 取消排序 (null)', () => {
      const { sortState, toggleSort } = useTableData(() => sampleRows, () => sampleColumns)
      toggleSort('age')
      toggleSort('age')
      toggleSort('age')
      expect(sortState.value.order).toBeNull()
    })

    it('asc 升序排列正确', () => {
      const { viewRows, toggleSort } = useTableData(() => sampleRows, () => sampleColumns)
      toggleSort('age')
      expect(viewRows.value.map((r): number => r.age)).toEqual([25, 28, 30, 35])
    })

    it('desc 降序排列正确', () => {
      const { viewRows, toggleSort } = useTableData(() => sampleRows, () => sampleColumns)
      toggleSort('age')
      toggleSort('age')
      expect(viewRows.value.map((r): number => r.age)).toEqual([35, 30, 28, 25])
    })
  })

  describe('筛选状态机', () => {
    it('单值筛选：仅返回匹配行', () => {
      const { viewRows, setFilterValue } = useTableData(() => sampleRows, () => sampleColumns)
      setFilterValue('dept', ['tech'])
      expect(viewRows.value).toHaveLength(2)
      expect(viewRows.value.every((r): boolean => r.dept === 'tech')).toBe(true)
    })

    it('多值筛选：并集匹配', () => {
      const { viewRows, setFilterValue } = useTableData(() => sampleRows, () => sampleColumns)
      setFilterValue('dept', ['tech', 'design'])
      expect(viewRows.value).toHaveLength(3)
    })

    it('空筛选值 = 无筛选效应', () => {
      const { viewRows, setFilterValue } = useTableData(() => sampleRows, () => sampleColumns)
      setFilterValue('dept', [])
      expect(viewRows.value).toHaveLength(4)
    })

    it('自定义 filterMethod：按 age ≥ 阈值筛选', () => {
      const columns: ColumnDef[] = [
        {
          prop: 'age',
          label: '年龄',
          filterMethod: (value: unknown, row: Record<string, unknown>): boolean => row.age as number >= (value as number),
        },
      ]
      const { viewRows, setFilterValue } = useTableData<TestRow>(() => sampleRows, () => columns)
      setFilterValue('age', [30])
      expect(viewRows.value.map((r): number => r.age)).toEqual([30, 35])
    })
  })

  describe('行选择状态机', () => {
    it('toggleRowSelection：单行切换选中', () => {
      const { selectedKeys, toggleRowSelection } = useTableData(() => sampleRows, () => sampleColumns, { rowKey: 'id' })
      toggleRowSelection(1)
      expect(selectedKeys.value.has(1)).toBe(true)
      toggleRowSelection(1)
      expect(selectedKeys.value.has(1)).toBe(false)
    })

    it('toggleRowSelection：显式设置 isSelected = true', () => {
      const { selectedKeys, toggleRowSelection } = useTableData(() => sampleRows, () => sampleColumns, { rowKey: 'id' })
      toggleRowSelection(2, true)
      expect(selectedKeys.value.has(2)).toBe(true)
    })

    it('toggleAllSelection：全选当前视图', () => {
      const { selectedKeys, toggleAllSelection } = useTableData(() => sampleRows, () => sampleColumns, { rowKey: 'id' })
      toggleAllSelection()
      expect(selectedKeys.value.size).toBe(4)
    })

    it('toggleAllSelection：取消全选', () => {
      const { selectedKeys, toggleAllSelection } = useTableData(() => sampleRows, () => sampleColumns, { rowKey: 'id' })
      toggleAllSelection()
      toggleAllSelection(false)
      expect(selectedKeys.value.size).toBe(0)
    })
  })

  describe('树形展开状态机', () => {
    const treeRows: TestRow[] = [
      {
        id: 1,
        name: '总部',
        age: 0,
        children: [
          { id: 11, name: '技术部', age: 0 },
          { id: 12, name: '产品部', age: 0 },
        ],
      },
      {
        id: 2,
        name: '分部',
        age: 0,
        children: [{ id: 21, name: '设计组', age: 0 }],
      },
    ]

    it('默认未展开：仅显示根节点', () => {
      const { viewRows } = useTableData(() => treeRows, () => sampleColumns, {
        rowKey: 'id',
        childrenKey: 'children',
      })
      expect(viewRows.value).toHaveLength(2)
    })

    it('展开后：拍平子节点', () => {
      const { viewRows, setRowExpanded } = useTableData(() => treeRows, () => sampleColumns, {
        rowKey: 'id',
        childrenKey: 'children',
      })
      setRowExpanded(1, true)
      expect(viewRows.value).toHaveLength(4)
      expect(viewRows.value.map((r): number => r.id)).toEqual([1, 11, 12, 2])
    })

    it('收起后：恢复无展开状态', () => {
      const { viewRows, setRowExpanded } = useTableData(() => treeRows, () => sampleColumns, {
        rowKey: 'id',
        childrenKey: 'children',
      })
      setRowExpanded(1, true)
      setRowExpanded(1, false)
      expect(viewRows.value).toHaveLength(2)
    })
  })

  describe('服务端模式', () => {
    it('isRemote = true：禁用本地排序/筛选/选择变化', () => {
      const { viewRows, sortState, selectedKeys, toggleSort, toggleAllSelection }
        = useTableData(() => sampleRows, () => sampleColumns, {
          isRemote: true,
          rowKey: 'id',
        })
      toggleSort('age')
      toggleAllSelection()
      // 远程模式下排序状态不更新（sort-change 事件由父级处理）
      expect(sortState.value.prop).toBeNull()
      expect(sortState.value.order).toBeNull()
      // 选中状态也保持空
      expect(selectedKeys.value.size).toBe(0)
      // viewRows 永远返回原始数据
      expect(viewRows.value).toHaveLength(4)
    })
  })
})
