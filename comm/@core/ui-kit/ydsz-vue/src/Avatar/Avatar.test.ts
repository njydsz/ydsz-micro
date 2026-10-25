import { beforeAll, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import Avatar from './story/_Avatar.vue'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { findByAltText, findByText, queryByText, waitForElementToBeRemoved } from '@testing-library/vue'

const FALLBACK = 'CT'
const DELAY = 350

/**
 * 延迟触发 onload 的假 Image。
 *
 * <p>必须在任何 mount 之前替换 `window.Image`：story 里的 src 是真实外链，
 * 否则 happy-dom 会发起网络请求并在 teardown 时报未处理的 AbortError。
 */
class MockImage {
  onload: () => void = () => {}
  src = ''

  constructor() {
    setTimeout(() => {
      this.onload()
    }, DELAY)
    return this
  }
}

beforeAll(() => {
  (window.Image as unknown) = MockImage
})

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(Avatar)
  expect(await axe(wrapper.element)).toHaveNoViolations()
})

describe('given an Avatar with fallback and a working image', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Avatar>>
  beforeAll(async () => {
    wrapper = mount(Avatar)
  })

  it('should render the fallback initially', async () => {
    await nextTick()
    expect(wrapper.html()).includes(FALLBACK)
  })

  it('should render the image, but show `display:none` initially', () => {
    // 用新挂载的实例断言：共享 wrapper 可能已被前面的异步用例等到 onload（350ms）
    const image = mount(Avatar).find('img')
    expect(image.exists()).toBeTruthy()
    // 直接读内联 style：v-show 关闭时写的是 el.style.display，
    // getComputedStyle 在游离节点上的实现差异会让 toHaveStyle 失真
    expect(image.element.style.display).toBe('none')
  })

  it('should have alt text on the image', async () => {
    const image = await findByAltText(wrapper.element as HTMLElement, 'Colm Tuite')
    expect(image).toBeTruthy()
  })

  it('should match before image loaded snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should match after image loaded snapshot', async () => {
    await waitForElementToBeRemoved(() => queryByText(wrapper.element as HTMLElement, 'CT'))
    expect(wrapper.html()).toMatchSnapshot()
  })
})

describe('given an Avatar with fallback and delayed render', () => {
  let wrapper: VueWrapper<InstanceType<typeof Avatar>>

  beforeAll(async () => {
    wrapper = mount(Avatar, {
      props: {
        delay: 300,
      },
    })
  })

  it('should not render a fallback immediately', async () => {
    expect(wrapper.text()).not.toContain(FALLBACK)
  })

  it('should render a fallback after the delay', async () => {
    expect(wrapper.text()).not.toContain(FALLBACK)
    const fallback = await findByText(wrapper.element as HTMLElement, FALLBACK)
    expect(wrapper.element).toContain(fallback)
  })
})
