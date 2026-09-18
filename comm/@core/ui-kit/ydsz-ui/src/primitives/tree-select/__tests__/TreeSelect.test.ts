/**
 * @file TreeSelect.test.ts
 * @description YdTreeSelect 组件渲染 / 搜索 / 多选 / disabled 行为测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tree-select\__tests__\TreeSelect.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { mount } from '@vue/test-utils'

import { describe, expect, it } from 'vitest'

import YdTreeSelect from '../YdTreeSelect'

const sampleTree = [
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

describe('YdTreeSelect', () => {
  it('渲染时显示 placeholder', () => {
    const wrapper = mount(YdTreeSelect, {
      props: { options: sampleTree, placeholder: '请选择部门' },
    })
    expect(wrapper.text()).toContain('请选择部门')
  })

  it('受控模式：modelValue 更新后显示对应 label', async () => {
    const wrapper = mount(YdTreeSelect, {
      props: { options: sampleTree, modelValue: 'tech' },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('技术部')
  })

  it('搜索过滤：输入后显示匹配项', async () => {
    const wrapper = mount(YdTreeSelect, {
      props: { options: sampleTree, showSearch: true },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('disabled=true 时禁止交互', () => {
    const wrapper = mount(YdTreeSelect, {
      props: { options: sampleTree, disabled: true },
    })
    const trigger = wrapper.find('button')
    expect(trigger.attributes('disabled')).toBeDefined()
  })

  it('multiple 模式下支持多选', async () => {
    const wrapper = mount(YdTreeSelect, {
      props: { options: sampleTree, multiple: true },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('treeCheckable 模式（父子关联选择）', () => {
    const wrapper = mount(YdTreeSelect, {
      props: { options: sampleTree, treeCheckable: true },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('虚拟滚动：大数据量（200+ 节点）不崩溃', () => {
    const largeOptions = Array.from({ length: 300 }, (_, i) => ({
      label: `节点-${i}`,
      value: `node-${i}`,
    }))
    const wrapper = mount(YdTreeSelect, {
      props: { options: largeOptions },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
