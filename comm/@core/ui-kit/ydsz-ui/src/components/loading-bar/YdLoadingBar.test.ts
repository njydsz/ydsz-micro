/**
 * YdLoadingBar 组件单元测试。
 *
 * 用例覆盖：
 * - loading=false 时不渲染
 * - loading=true 时渲染并带 progressbar role
 * - 高度 / 颜色自定义生效
 * - click 事件透传
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\YdLoadingBar.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdLoadingBar from './YdLoadingBar.vue';

describe('YdLoadingBar', () => {
  it('loading=false 时不渲染元素', () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: false },
    });
    expect(wrapper.find('.loading-bar').exists()).toBe(false);
  });

  it('loading=true 时渲染进度条', () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: true },
    });
    const bar = wrapper.find('.loading-bar');
    expect(bar.exists()).toBe(true);
    expect(bar.attributes('role')).toBe('progressbar');
  });

  it('默认高度为 3px', () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: true },
    });
    expect((wrapper.element as HTMLElement).style.height).toBe('3px');
  });

  it('height=5 时高度生效', () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: true, height: 5 },
    });
    expect((wrapper.element as HTMLElement).style.height).toBe('5px');
  });

  it('color 传入后作为背景色', () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: true, color: '#ff0000' },
    });
    expect((wrapper.element as HTMLElement).style.backgroundColor).toBe('#ff0000');
  });

  it('点击触发 click 事件', async () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: true },
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('自定义 class 与根类名合并', () => {
    const wrapper = mount(YdLoadingBar, {
      props: { loading: true, class: 'my-class' },
    });
    expect(wrapper.classes()).toContain('my-class');
    expect(wrapper.classes()).toContain('loading-bar');
  });
});
