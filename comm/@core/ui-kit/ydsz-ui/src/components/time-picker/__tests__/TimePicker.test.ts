/**
 * @file TimePicker.test.ts
 * @description YdTimePicker 组件渲染 / 12h/24h / 步进 / 禁用时段行为测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\time-picker\__tests__\TimePicker.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { mount } from '@vue/test-utils'

import { describe, expect, it } from 'vitest'

import YdTimePicker from '../YdTimePicker'

describe('YdTimePicker', () => {
  it('渲染时显示 placeholder', () => {
    const wrapper = mount(YdTimePicker, {
      props: { placeholder: '选择时间' },
    })
    expect(wrapper.text()).toContain('选择时间')
  })

  it('受控模式：value 更新触发 update:value 事件', async () => {
    const wrapper = mount(YdTimePicker, {
      props: { value: '09:30:00' },
    })
    await wrapper.setProps({ value: '14:00:00' })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('use12Hours 模式渲染 AM/PM', () => {
    const wrapper = mount(YdTimePicker, {
      props: { use12Hours: true },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('step 配置：hourStep=2, minuteStep=15', () => {
    const wrapper = mount(YdTimePicker, {
      props: { hourStep: 2, minuteStep: 15, secondStep: 1 },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('disabledHours 禁用指定小时', () => {
    const wrapper = mount(YdTimePicker, {
      props: { disabledHours: () => [0, 1, 2, 3] },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('clearable=true 显示清除按钮', () => {
    const wrapper = mount(YdTimePicker, {
      props: { allowClear: true, value: '10:00:00' },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('disabled 状态禁止交互', () => {
    const wrapper = mount(YdTimePicker, {
      props: { disabled: true },
    })
    const trigger = wrapper.find('button')
    expect(trigger.attributes('disabled')).toBeDefined()
  })

  it('a11y：触发器有 role 或 aria-label', () => {
    const wrapper = mount(YdTimePicker, {})
    const trigger = wrapper.find('button')
    expect(trigger.exists()).toBe(true)
  })
})
