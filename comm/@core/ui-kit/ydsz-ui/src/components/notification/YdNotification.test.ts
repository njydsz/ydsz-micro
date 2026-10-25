/**
 * YdNotification 组件测试 —— 验证通知卡片的渲染与生命周期契约。
 *
 * <p>测试范围：文案渲染、级别配色对应的 ARIA 角色、showIcon 开关、自定义图标、
 * duration 自动关闭、duration=0 常驻、悬停暂停按剩余时间续算、关闭按钮回传 id。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\YdNotification.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, markRaw } from 'vue';

import YdNotification from './YdNotification.vue';

/** 最小必填 props */
const baseProps = { id: 'n-1', message: '构建完成' };

describe('YdNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应渲染标题与描述', () => {
    const wrapper = mount(YdNotification, {
      props: { ...baseProps, description: '产物已上传', duration: 0 },
    });

    expect(wrapper.text()).toContain('构建完成');
    expect(wrapper.text()).toContain('产物已上传');
    wrapper.unmount();
  });

  it('info / success 使用 role=status，warning / error 使用 role=alert', () => {
    const info = mount(YdNotification, { props: { ...baseProps, duration: 0 } });
    expect(info.attributes('role')).toBe('status');
    info.unmount();

    const alert = mount(YdNotification, {
      props: { ...baseProps, duration: 0, type: 'error' },
    });
    expect(alert.attributes('role')).toBe('alert');
    alert.unmount();
  });

  it('showIcon=false 不应渲染级别图标', () => {
    const wrapper = mount(YdNotification, {
      props: { ...baseProps, duration: 0, showIcon: false },
    });

    // 关闭按钮的 X 也是 svg，用尺寸类区分：级别图标为 size-5，关闭图标为 size-4
    expect(wrapper.find('.size-5').exists()).toBe(false);
    expect(wrapper.find('button svg').exists()).toBe(true);
    wrapper.unmount();
  });

  it('自定义 icon 组件应替换默认图标', () => {
    const CustomIcon = markRaw(defineComponent({ render: () => h('i', { class: 'my-icon' }) }));
    const wrapper = mount(YdNotification, { props: { ...baseProps, duration: 0, icon: CustomIcon } });

    expect(wrapper.find('.my-icon').exists()).toBe(true);
    wrapper.unmount();
  });

  it('duration 到点应回传该条 id', async () => {
    const wrapper = mount(YdNotification, { props: { ...baseProps, duration: 1000 } });

    vi.advanceTimersByTime(999);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeUndefined();

    vi.advanceTimersByTime(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')?.[0]).toEqual(['n-1']);
    wrapper.unmount();
  });

  it('duration=0 应常驻不计时', () => {
    const wrapper = mount(YdNotification, { props: { ...baseProps, duration: 0 } });

    vi.advanceTimersByTime(60_000);
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  });

  it('悬停暂停后按剩余时间续算，而非重新计满', async () => {
    const wrapper = mount(YdNotification, { props: { ...baseProps, duration: 1000 } });

    vi.advanceTimersByTime(400);
    await wrapper.trigger('mouseenter');

    vi.advanceTimersByTime(5000);
    expect(wrapper.emitted('close')).toBeUndefined();

    await wrapper.trigger('mouseleave');
    vi.advanceTimersByTime(599);
    expect(wrapper.emitted('close')).toBeUndefined();

    vi.advanceTimersByTime(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')?.[0]).toEqual(['n-1']);
    wrapper.unmount();
  });

  it('点击关闭按钮应回传该条 id', async () => {
    const wrapper = mount(YdNotification, { props: { ...baseProps, duration: 0 } });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('close')?.[0]).toEqual(['n-1']);
    wrapper.unmount();
  });
});
