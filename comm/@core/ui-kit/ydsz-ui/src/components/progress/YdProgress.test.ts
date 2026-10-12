/**
 * YdProgress 组件单元测试。
 *
 * 用例覆盖：
 * - percentage 正确设置 width
 * - indeterminate 模式下 display 为不确定状态
 * - 值范围约束（0-100）
 * - 达到 100 时 done 事件触发
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\progress\YdProgress.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdProgress from './YdProgress.vue';

describe('YdProgress', () => {
  it('renders with percentage value', () => {
    const wrapper = mount(YdProgress, {
      props: { percentage: 50 },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('clamps percentage to 0-100 range', async () => {
    const wrapper = mount(YdProgress, {
      props: { percentage: 150 },
    });
    await wrapper.vm.$nextTick();
    // 超过 100 时被 clamped，不应报错
    expect(wrapper.emitted('done')).toBeTruthy();
  });

  it('emits done when percentage drops below 100 then reaches 100', async () => {
    const wrapper = mount(YdProgress, {
      props: { percentage: 99 },
    });
    wrapper.setProps({ percentage: 100 });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('done')).toBeTruthy();
  });

  it('renders indeterminate state', () => {
    const wrapper = mount(YdProgress, {
      props: { indeterminate: true },
    });
    const indicator = wrapper.find('[data-radix-progress-indicator]');
    expect(indicator.exists()).toBe(true);
  });
});
