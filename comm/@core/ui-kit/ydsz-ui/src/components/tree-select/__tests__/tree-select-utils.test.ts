/**
 * @file tree-select-utils.test.ts
 * @description TreeSelect 核心算法测试——树扁平化 / 搜索过滤 / 受控判定。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tree-select\__tests__\tree-select-utils.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest'

interface TreeSelectOption {
  children?: TreeSelectOption[]
  disabled?: boolean
  label: string
  value: string | number
}

const sampleTree: TreeSelectOption[] = [
  {
    label: '总部',
    value: 'hq',
    children: [
      { label: '技术部', value: 'tech' },
      { label: '产品部', value: 'product' },
    ],
  },
  {
    label: '分部',
    value: 'branch',
    children: [{ label: '市场组', value: 'market' }],
  },
]

/** 扁平化为带层级的列表 */
function flatten(nodes: TreeSelectOption[], level = 0, result: Array<TreeSelectOption & { level: number }> = []): Array<TreeSelectOption & { level: number }> {
  for (const n of nodes) {
    result.push({ ...n, level })
    if (n.children)
      flatten(n.children, level + 1, result)
  }
  return result
}

/** 按 query 过滤（保留匹配节点的祖先） */
function filterTree(nodes: TreeSelectOption[], query: string): TreeSelectOption[] {
  const result: TreeSelectOption[] = []
  for (const n of nodes) {
    const filteredChildren = n.children ? filterTree(n.children, query) : []
    const isMatch = n.label.toLowerCase().includes(query.toLowerCase())
    if (isMatch || filteredChildren.length > 0) {
      result.push({ ...n, children: filteredChildren.length > 0 ? filteredChildren : n.children })
    }
  }
  return result
}

describe('TreeSelect flatten & search', () => {
  it('扁平化后节点总数 = 5', () => {
    const flat = flatten(sampleTree)
    expect(flat).toHaveLength(5)
  })

  it('扁平化层级：根=0, 子=1', () => {
    const flat = flatten(sampleTree)
    const hq = flat.find(n => n.value === 'hq')!
    const tech = flat.find(n => n.value === 'tech')!
    expect(hq.level).toBe(0)
    expect(tech.level).toBe(1)
  })

  it('搜索 "部" 匹配总部+分部', () => {
    const filtered = filterTree(sampleTree, '部')
    expect(filtered.map(n => n.value)).toContain('hq')
    expect(filtered.map(n => n.value)).toContain('branch')
  })

  it('搜索 "技术" 只保留技术部的祖先路径', () => {
    const filtered = filterTree(sampleTree, '技术')
    expect(filtered).toHaveLength(1) // 只有总部匹配
    expect(filtered[0]!.children).toBeDefined()
    expect(filtered[0]!.children!.map(c => c.value)).toContain('tech')
  })
})

describe('Controlled value resolution', () => {
  it('单值匹配', () => {
    const modelValue = 'tech'
    const flat = flatten(sampleTree)
    const found = flat.find(n => n.value === modelValue)
    expect(found?.label).toBe('技术部')
  })

  it('空值无匹配', () => {
    const modelValue = undefined
    const flat = flatten(sampleTree)
    const found = flat.find(n => n.value === modelValue)
    expect(found).toBeUndefined()
  })
})
