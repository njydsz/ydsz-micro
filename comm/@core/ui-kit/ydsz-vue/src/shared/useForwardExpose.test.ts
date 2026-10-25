/**
 * useForwardExpose 用例 —— 验证子组件把内部元素暴露为 `$el`。
 *
 * <p>上游用 `<div :test="forwarded">` 再把属性读回字符串比较，依赖
 * `String(HTMLElement)` 的宿主实现：jsdom 得到 `[object HTMLSpanElement]`、
 * happy-dom 得到 `<span> … </span>`。这里改为直接捕获转发到的元素本身，
 * 断言节点类型，与 DOM 实现无关。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\shared\useForwardExpose.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { type Component, Fragment, computed, defineComponent, h, ref, watchEffect } from 'vue'

import { useForwardExpose } from './useForwardExpose'

/**
 * 用父组件持有子实例 ref，捕获其 `$el` —— 即 `useForwardExpose` 转发的结果。
 *
 * @param comp 被测组件（内部需调用 useForwardExpose）
 * @returns forwarded 转发到的节点；wrapper 父级包裹器
 */
function mountForwardTarget(comp: Component) {
  const forwarded = ref<unknown>(undefined)
  const wrapper = mount(defineComponent(() => {
    const instanceRef = ref()
    const rootEl = computed(() => instanceRef.value?.$el)
    watchEffect(() => {
      forwarded.value = rootEl.value
    })
    return () => h('div', [h(comp, { ref: instanceRef })])
  }))
  return { forwarded, wrapper }
}

/** 断言 `$el` 已转发到组件内部的 `<span>`，而非外层 `<div>` */
async function expectForwardedSpan(comp: Component) {
  const { forwarded } = mountForwardTarget(comp)
  await flushPromises()
  expect(forwarded.value).toBeInstanceOf(HTMLElement)
  expect((forwarded.value as HTMLElement).tagName).toBe('SPAN')
}

/** 提供 forwardRef 的组件工厂，模板由调用方给出 */
function defineForwarder(template: string, options: Record<string, any> = {}) {
  return defineComponent({
    ...options,
    setup() {
      const { forwardRef } = useForwardExpose()
      return { forwardRef }
    },
    template,
  })
}

describe('useForwardRef', () => {
  it('should forward plain DOM element ref', async () => {
    await expectForwardedSpan(defineForwarder(`
      <div>
        <span :ref="forwardRef"> inner element </span>
      </div>
    `))
  })

  it('should forward plain DOM element ref - 2', async () => {
    await expectForwardedSpan(defineForwarder(`
      <div>
        <span :ref="_ => forwardRef({ $el: _ })"> inner element </span>
      </div>
    `))
  })

  it('should forward plain DOM element ref - fragment', async () => {
    await expectForwardedSpan(defineForwarder(`
      <div>multiple node root</div>
      <div>
        <span :ref="forwardRef"> inner element </span>
      </div>
    `))
  })

  it('should forward plain DOM element ref - fragment - 2', async () => {
    const Frag = defineComponent(
      (props, { slots }) => () => h(Fragment, {}, [slots.default?.()]),
    )
    await expectForwardedSpan(defineForwarder(`
      <Frag>
        <Frag>
          <div>
            <span :ref="forwardRef"> inner element </span>
          </div>
        </Frag>
      </Frag>
    `, { components: { Frag } }))
  })

  it('should forward plain DOM element ref - fragment - 3', async () => {
    await expectForwardedSpan(defineForwarder(`
      <div>
        <template>
          <div>
            <span :ref="forwardRef"> inner element </span>
          </div>
        </template>
      </div>
    `))
  })

  it('should forward component instance for component', async () => {
    const InnerComp = defineComponent(() => () => h('span', {}, 'inner component'))
    await expectForwardedSpan(defineForwarder(`
      <div>
        <InnerComp :ref="forwardRef" />
      </div>
    `, { components: { InnerComp } }))
  })
})
