/**
 * YdInfiniteScroll 组件单元测试。
 *
 * 用例覆盖：
 * - 默认渲染内容
 * - loading 态显示加载指示
 * - finished 态显示完成文案
 * - 滚动进入视口触发 load-more
 * - loading / finished 时阻断触发
 * - 自定义 slot 渲染
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\infinite-scroll\YdInfiniteScroll.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import YdInfiniteScroll from './YdInfiniteScroll.vue';

/** happy-dom 默认不提供 IntersectionObserver，这里注入可控桩 */
class IntersectionObserverStub {
  callback: IntersectionObserverCallback;
  elements: Element[] = [];
  options: IntersectionObserverInit | undefined;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
  }

  observe(el: Element): void {
    this.elements.push(el);
  }

  disconnect(): void {
    this.elements = [];
  }

  unobserve(_el: Element): void {}

  trigger(isIntersecting: boolean): void {
    const entry = { isIntersecting, target: this.elements[0] } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

let observerInstances: IntersectionObserverStub[] = [];

function stubObserver(): void {
  observerInstances = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class extends IntersectionObserverStub {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        observerInstances.push(this);
      }
    },
  );
}

beforeEach(() => {
  observerInstances = [];
});

describe('YdInfiniteScroll', () => {
  it('渲染默认插槽内容', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      slots: { default: '<div class="item">Item</div>' },
    });
    expect(wrapper.find('.item').exists()).toBe(true);
    expect(wrapper.text()).toContain('Item');
  });

  it('loading=true 时显示加载指示', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { loading: true },
    });
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('加载中');
  });

  it('finished=true 时显示完成文案', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { finished: true },
    });
    expect(wrapper.text()).toContain('没有更多了');
  });

  it('finished=false 且 loading=false 时不显示状态区', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { finished: false, loading: false },
    });
    // 哨兵容器存在，但内部无状态文案
    expect(wrapper.find('.infinite-scroll__sentinel').text().trim()).toBe('');
  });

  it('进入视口时触发 load-more', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { loading: false, finished: false },
    });
    expect(observerInstances.length).toBeGreaterThan(0);
    const observer = observerInstances[0];
    observer?.trigger(true);
    expect(wrapper.emitted('load-more')).toHaveLength(1);
  });

  it('loading=true 时进入视口不触发', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { loading: true },
    });
    const observer = observerInstances[0];
    observer?.trigger(true);
    expect(wrapper.emitted('load-more')).toBeUndefined();
  });

  it('finished=true 时进入视口不触发', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { finished: true },
    });
    const observer = observerInstances[0];
    observer?.trigger(true);
    expect(wrapper.emitted('load-more')).toBeUndefined();
  });

  it('未进入视口不触发', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll);
    const observer = observerInstances[0];
    observer?.trigger(false);
    expect(wrapper.emitted('load-more')).toBeUndefined();
  });

  it('自定义 loading slot 优先于默认', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { loading: true },
      slots: { loading: '<span class="custom-loading">Loading...</span>' },
    });
    expect(wrapper.find('.custom-loading').exists()).toBe(true);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it('自定义 finished slot 优先于默认', () => {
    stubObserver();
    const wrapper = mount(YdInfiniteScroll, {
      props: { finished: true },
      slots: { finished: '<span class="custom-finished">Done</span>' },
    });
    expect(wrapper.find('.custom-finished').exists()).toBe(true);
  });

  it('threshold 传入后体现在 rootMargin', () => {
    stubObserver();
    mount(YdInfiniteScroll, {
      props: { threshold: 200 },
    });
    const observer = observerInstances[0];
    expect(observer?.options?.rootMargin).toContain('200px');
  });
});
