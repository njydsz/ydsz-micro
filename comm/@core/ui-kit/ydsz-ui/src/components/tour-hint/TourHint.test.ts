/**
 * TourHint 漫游式新手引导测试 —— 验证步骤流转、按钮交互和 v-model。
 *
 * <p>核心断言：
 * <ul>
 *   <li>正常渲染后显示第一步内容</li>
 *   <li>点击下一步切换到最后一步并 emit finish</li>
 *   <li>点击上一步回退到前一步</li>
 *   <li>点击跳过 emit skip</li>
 *   <li>v-model 同步更新</li>
 * </ul>
 *
 * <p>云顶编码规范 §11 可访问性：role="dialog" + aria-label。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src/components/tour-hint/TourHint.test.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import YdTourHint from './TourHint.vue'
import type { TourHintProps } from './types'

/** 三步标准测试数据 */
function makeSteps(): TourHintProps['steps'] {
  return [
    { target: '#step-1', title: '第一步', content: '这是第一步的说明文字' },
    { target: '#step-2', title: '第二步', content: '这是第二步的说明文字' },
    { target: '#step-3', title: '第三步', content: '这是第三步的说明文字' },
  ]
}

describe('YdTourHint', () => {
  // jsdom 环境需要 rAF
  beforeAll(() => {
    if (!globalThis.requestAnimationFrame) {
      globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
        setTimeout(() => cb(Date.now()), 0) as unknown as number) as typeof requestAnimationFrame
      globalThis.cancelAnimationFrame = ((id: number) =>
        clearTimeout(id)) as unknown as typeof cancelAnimationFrame
    }
  })

  it('modelValue=true 时正常渲染 3 步骤并显示第一步', () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // dialog role
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.attributes('aria-label')).toBe('新手引导')

    // 显示第一步
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('1/3')
    expect(wrapper.find('.yd-tour-hint__title').text()).toBe('第一步')
    expect(wrapper.find('.yd-tour-hint__content').text()).toBe('这是第一步的说明文字')

    // 第一步没有"上一步"按钮
    expect(wrapper.find('.yd-tour-hint__prev').exists()).toBe(false)

    wrapper.unmount()
  })

  it('点击"下一步"切换到下一步', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // 第一步
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('1/3')

    // 点击下一步
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('2/3')
    expect(wrapper.find('.yd-tour-hint__title').text()).toBe('第二步')

    // 点击下一步
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('3/3')
    expect(wrapper.find('.yd-tour-hint__title').text()).toBe('第三步')

    wrapper.unmount()
  })

  it('点击"上一步"回退到前一步', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // 前进到第二步
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('2/3')

    // 点击上一步回到第一步
    await wrapper.find('.yd-tour-hint__prev').trigger('click')
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('1/3')
    expect(wrapper.find('.yd-tour-hint__title').text()).toBe('第一步')

    wrapper.unmount()
  })

  it('点击"跳过"应 emit skip 并关闭', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    await wrapper.find('.yd-tour-hint__skip').trigger('click')

    // emit skip
    expect(wrapper.emitted('skip')).toBeTruthy()

    // emit update:modelValue false
    const modelUpdates = wrapper.emitted('update:modelValue')
    expect(modelUpdates).toBeTruthy()
    expect(modelUpdates![0]).toEqual([false])

    wrapper.unmount()
  })

  it('最后一步点击"完成"应 emit finish 并关闭', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // 走到底：点击 2 次下一步到第三步
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    await wrapper.find('.yd-tour-hint__next').trigger('click')

    // 第三步显示"完成"按钮
    expect(wrapper.find('.yd-tour-hint__next').text()).toBe('完成')

    // 点击完成
    await wrapper.find('.yd-tour-hint__next').trigger('click')

    // emit finish
    expect(wrapper.emitted('finish')).toBeTruthy()

    // emit update:modelValue false
    const modelUpdates = wrapper.emitted('update:modelValue')
    expect(modelUpdates).toBeTruthy()
    expect(modelUpdates![0]).toEqual([false])

    wrapper.unmount()
  })

  it('v-model 联动：通过 emit 更新 modelValue', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // 初始可见
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    // 跳过后 v-model 变为 false
    await wrapper.find('.yd-tour-hint__skip').trigger('click')

    // verify emit was triggered
    const updates = wrapper.emitted('update:modelValue')
    expect(updates).toBeTruthy()
    expect(updates![0]).toEqual([false])

    wrapper.unmount()
  })

  it('第一步不显示"上一步"按钮，后续步骤显示', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // 第一步：无上一步按钮
    expect(wrapper.find('.yd-tour-hint__prev').exists()).toBe(false)

    // 第二步：有上一步按钮
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    expect(wrapper.find('.yd-tour-hint__prev').exists()).toBe(true)

    // 第三步：有上一步按钮
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    expect(wrapper.find('.yd-tour-hint__prev').exists()).toBe(true)

    wrapper.unmount()
  })

  it('modelValue 为 false 时不渲染 popover', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: false,
      },
      attachTo: document.body,
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    // 切换到 true
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('重新打开时自动重置到第一步', async () => {
    const wrapper = mount(YdTourHint, {
      props: {
        steps: makeSteps(),
        modelValue: true,
      },
      attachTo: document.body,
    })

    // 前进到第二步
    await wrapper.find('.yd-tour-hint__next').trigger('click')
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('2/3')

    // 关闭
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    // 重新打开：应该重置到第一步
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.yd-tour-hint__step-badge').text()).toBe('1/3')

    wrapper.unmount()
  })
})
