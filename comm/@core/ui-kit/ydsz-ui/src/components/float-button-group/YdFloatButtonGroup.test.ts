/**
 * YdFloatButtonGroup 组件单元测试。
 *
 * 用例覆盖：
 * - 默认渲染与 role=group
 * - 点击触发器切换 open 并 emit update:open
 * - 自定义 trigger slot 优先
 * - 方向类名映射
 * - 默认子项插槽内容渲染
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\float-button-group\YdFloatButtonGroup.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdFloatButtonGroup from './YdFloatButtonGroup.vue';

describe('YdFloatButtonGroup', () => {
  it('默认渲染为 group 角色', () => {
    const wrapper = mount(YdFloatButtonGroup);
    const group = wrapper.find('[role="group"]');
    expect(group.exists()).toBe(true);
  });

  it('渲染默认子项内容', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      slots: { default: '<button class="child-btn">A</button>' },
    });
    expect(wrapper.find('.child-btn').exists()).toBe(true);
  });

  it('点击触发器 emit update:open=true', async () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { open: false },
    });
    const trigger = wrapper.find('button');
    await trigger.trigger('click');
    expect(wrapper.emitted('update:open')).toHaveLength(1);
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true]);
  });

  it('open=true 时再次点击 emit update:open=false', async () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { open: true },
    });
    const trigger = wrapper.find('button');
    await trigger.trigger('click');
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('trigger aria-expanded 跟随 open', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { open: true },
    });
    const trigger = wrapper.find('button');
    expect(trigger.attributes('aria-expanded')).toBe('true');
  });

  it('自定义 trigger slot 优先于默认图标', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      slots: { trigger: '<span class="custom-trigger">T</span>' },
    });
    expect(wrapper.find('.custom-trigger').exists()).toBe(true);
  });

  it('direction=up 时应用 flex-col-reverse', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { direction: 'up' },
    });
    expect(wrapper.classes()).toContain('flex-col-reverse');
  });

  it('direction=left 时应用 flex-row-reverse', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { direction: 'left' },
    });
    expect(wrapper.classes()).toContain('flex-row-reverse');
  });

  it('open=false 时子项容器隐藏', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { open: false },
    });
    const list = wrapper.find('.pointer-events-none');
    expect(list.exists()).toBe(true);
  });

  it('open=true 时子项容器不隐藏', () => {
    const wrapper = mount(YdFloatButtonGroup, {
      props: { open: true },
    });
    expect(wrapper.find('.pointer-events-none').exists()).toBe(false);
  });
});
