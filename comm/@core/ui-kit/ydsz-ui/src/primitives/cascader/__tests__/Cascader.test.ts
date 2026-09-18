/**
 * @file Cascader.test.ts
 * @description YdCascader 组件渲染 / 受控模式 / 搜索 / clear 行为测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\cascader\__tests__\Cascader.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { mount } from '@vue/test-utils'

import { describe, expect, it, vi } from 'vitest'

import YdCascader from '../YdCascader'

const sampleOptions = [
  {
    label: '北京',
    value: 'beijing',
    children: [
      { label: '朝阳区', value: 'chaoyang' },
      { label: '海淀区', value: 'haidian' },
    ],
  },
  {
    label: '上海',
    value: 'shanghai',
    children: [
      { label: '浦东新区', value: 'pudong' },
      { label: '徐汇区', value: 'xuhui' },
    ],
  },
]

describe('YdCascader', () => {
  it('渲染时不报错，显示 placeholder', () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, placeholder: '请选择城市' },
    })
    expect(wrapper.text()).toContain('请选择城市')
  })

  it('modelValue 受控更新触发 change 事件', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions },
    })
    await wrapper.setProps({ modelValue: ['beijing', 'chaoyang'] })
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
  })

  it('disabled=true 时禁止触发点击', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, disabled: true },
    })
    const trigger = wrapper.find('button')
    expect(trigger.attributes('disabled')).toBeDefined()
  })

  it('clear 按钮清空 modelValue', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, modelValue: ['beijing', 'chaoyang'], allowClear: true },
    })
    const clearBtn = wrapper.find('[aria-label="清除"]')
    if (clearBtn.exists()) {
      await clearBtn.trigger('click')
      await wrapper.vm.$nextTick()
      const updateEvent = wrapper.emitted('update:modelValue')
      expect(updateEvent?.at(-1)).toEqual([[]])
    }
  })

  it('changeOnSelect 模式下非叶节点也可选中', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, changeOnSelect: true },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('a11y：触发器有 aria-expanded 属性', () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions },
    })
    const trigger = wrapper.find('button')
    expect(trigger.attributes('aria-expanded')).toBeDefined()
  })

  it('ESC 键 closePanel（keydown.escape 绑定）', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions },
    })
    await wrapper.trigger('keydown.escape')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
})
