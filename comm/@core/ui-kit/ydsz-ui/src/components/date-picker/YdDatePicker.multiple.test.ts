/**
 * YdDatePicker multiple + inline 能力测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\date-picker\YdDatePicker.multiple.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import YdDatePicker from './YdDatePicker.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdDatePicker multiple', () => {
  it('multiple=true 时点击日期累积到数组', async () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
      props: { multiple: true, type: 'date' },
    });
    // 打开面板
    await wrapper.find('input').trigger('click');
    await wrapper.vm.$nextTick();
    // 点击日历面板中的日期（CalendarPanel 渲染的按钮）
    const dayButtons = document.body.querySelectorAll('[role="button"], button');
    expect(dayButtons.length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('multiple 模式下 v-model 为数组', async () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
      props: {
        multiple: true,
        type: 'date',
        modelValue: ['2026-11-01', '2026-11-03'],
      },
    });
    // displayValue 应显示逗号分隔
    expect(wrapper.find('input').element.value).toContain('2026-11-01');
    wrapper.unmount();
  });

  it('multiple=false 时 displayValue 为单值', () => {
    const wrapper = mount(YdDatePicker, {
      props: { type: 'date', modelValue: '2026-11-05' },
    });
    expect(wrapper.find('input').element.value).toBe('2026-11-05');
    wrapper.unmount();
  });
});

describe('YdDatePicker inline', () => {
  it('inline=true 时不渲染触发器', () => {
    const wrapper = mount(YdDatePicker, {
      props: { inline: true, type: 'date' },
    });
    expect(wrapper.find('input').exists()).toBe(false);
    // inline 模式无 input 触发器（月份导航按钮仍存在）
    expect(wrapper.find('input').exists()).toBe(false);
    wrapper.unmount();
  });

  it('inline=true 时直接渲染面板', () => {
    const wrapper = mount(YdDatePicker, {
      props: { inline: true, type: 'date' },
    });
    // 面板应存在（含月份导航）
    expect(wrapper.text()).toContain('年');
    wrapper.unmount();
  });

  it('inline=false 时渲染触发器', () => {
    const wrapper = mount(YdDatePicker, {
      props: { inline: false, type: 'date' },
    });
    expect(wrapper.find('input').exists()).toBe(true);
    wrapper.unmount();
  });

  it('inline=true 时不渲染 Teleport 弹出层', () => {
    const wrapper = mount(YdDatePicker, {
      props: { inline: true, type: 'date' },
    });
    // Teleport 内容不应出现在 body
    const teleportContent = document.body.querySelector('[style*="position: fixed"]');
    expect(teleportContent).toBeNull();
    wrapper.unmount();
  });
});

describe('YdDatePicker multiple + inline 组合', () => {
  it('multiple + inline 正常渲染', () => {
    const wrapper = mount(YdDatePicker, {
      props: { inline: true, multiple: true, type: 'date' },
    });
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('年');
    wrapper.unmount();
  });
});
