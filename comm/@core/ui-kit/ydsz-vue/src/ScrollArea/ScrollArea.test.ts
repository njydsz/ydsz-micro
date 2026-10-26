/**
 * ScrollArea 无头组件单元测试
 *
 * <p>覆盖默认 / type="always" / type="scroll" 三种滚动条显隐策略下的
 * a11y（axe）与结构快照断言。
 *
 * @path comm/@core/ui-kit/ydsz-vue/src/ScrollArea/ScrollArea.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import ScrollArea from './story/_ScrollArea.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { sleep } from '../../test'

/**
 * 每个 describe 都必须在用例结束后卸载组件。
 *
 * <p>ScrollAreaScrollbar 内部有 `watchEffect` + `useDebounceFn(100ms)` + scrollHideDelay
 * 三层定时器，只有组件卸载才会随 setup 作用域一起销毁。若不卸载，用例跑完后这些回调
 * 仍会在测试环境 teardown 之后触发，读到已经不存在的 `window`，Vitest 把它记成未处理拒绝，
 * 并把整轮结果判为非零退出码（间歇复现，一次绿一次红）。
 *
 * @param getWrapper - 返回当前 describe 持有的组件实例
 */
function autoUnmountAfterEach(
  getWrapper: () => VueWrapper<InstanceType<typeof ScrollArea>>,
): void {
  afterEach(async () => {
    // 先让 100ms 的 scrollEnd 防抖与 hide 延迟落地，再卸载，避免卸载后仍有挂起回调
    await sleep(150)
    getWrapper().unmount()
  })
}

describe('given default ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
  })
  autoUnmountAfterEach(() => wrapper)

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content, but not scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).not.toContain('data-orientation="vertical"')
  })

  describe('on hover', () => {
    beforeEach(async () => {
      await wrapper.trigger('pointerenter')
      await sleep(100)
    })

    it('should render scrollbar', () => {
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})

describe('given prop:type="always" ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'always' } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
  })
  autoUnmountAfterEach(() => wrapper)

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content and scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).toContain('data-orientation="vertical"')
  })
})

describe('given prop:type="scroll" ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'scroll' } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 20 })
  })
  autoUnmountAfterEach(() => wrapper)

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content and scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).not.toContain('data-orientation="vertical"')
  })

  describe('on scroll', () => {
    beforeEach(async () => {
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 40 })
      await wrapper.find('[data-radix-scroll-area-viewport]').trigger('scroll')
      await sleep(10)
    })

    it('should render scrollbar', () => {
      expect(wrapper.html()).toContain('data-orientation="vertical"')
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
