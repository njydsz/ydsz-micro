/**
 * YdDatePicker 组件测试 —— 验证 v-model 绑定、portal 挂载与 click-outside
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>YdDatePicker 使用 Teleport 将日历面板挂载到 body，测试聚焦于：
 * - v-model 双向绑定与 change 事件
 * - disabled 状态阻止交互
 * - readonly input 防止手动编辑
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\YdDatePicker.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it, afterEach } from 'vitest';

import { nextTick } from 'vue';

import { mount } from '@vue/test-utils';

import { useSimpleLocale } from '@ydsz-core/composables';

import YdDatePicker from './YdDatePicker.vue';

describe('YdDatePicker', () => {
  const { setSimpleLocale } = useSimpleLocale();

  afterEach(() => {
    // 复位语言，避免影响其他用例的中文断言
    setSimpleLocale('zh-CN');
  });

  it('en-US 语言下默认 placeholder 应为英文词条', async () => {
    setSimpleLocale('en-US');
    await nextTick();
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Select date');
    wrapper.unmount();
  });

  it('en-US 下 range 模式默认 placeholder 应为英文词条', async () => {
    setSimpleLocale('en-US');
    await nextTick();
    const wrapper = mount(YdDatePicker, {
      props: { type: 'range' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Start date ~ End date');
    wrapper.unmount();
  });

  it('应能挂载并渲染 input 元素', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    wrapper.unmount();
  });

  it('input 应为 readonly', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('readonly')).toBeDefined();
    expect(input.attributes('type')).toBe('text');
    wrapper.unmount();
  });

  it('应显示 placeholder', () => {
    const wrapper = mount(YdDatePicker, {
      props: { placeholder: '请输入日期' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('请输入日期');
    wrapper.unmount();
  });

  it('v-model 应回显到 input', () => {
    const wrapper = mount(YdDatePicker, {
      props: { modelValue: '2026-09-17' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('2026-09-17');
    wrapper.unmount();
  });

  it('disabled 状态下 input 应禁用', () => {
    const wrapper = mount(YdDatePicker, {
      props: { disabled: true },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('自定义 class 应被合并到容器', () => {
    const wrapper = mount(YdDatePicker, {
      props: { class: 'my-date-picker' },
      attachTo: document.body,
    });
    expect(wrapper.classes()).toContain('my-date-picker');
    wrapper.unmount();
  });

  it('默认 placeholder 应为「选择日期」', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('选择日期');
    wrapper.unmount();
  });

  it('type 默认为 date', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    expect(wrapper.props('type')).toBe('date');
    wrapper.unmount();
  });

  it('range 模式下 v-model 元组应回显为「开始 ~ 结束」', () => {
    const wrapper = mount(YdDatePicker, {
      props: {
        modelValue: ['2026-09-01', '2026-09-05'],
        type: 'range',
      },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('2026-09-01 ~ 2026-09-05');
    wrapper.unmount();
  });

  it('range 模式两次点击应提交 [start, end] 元组', async () => {
    const wrapper = mount(YdDatePicker, {
      props: { type: 'range' },
      attachTo: document.body,
    });
    // 展开弹出层（Teleport 将面板挂载到 body）
    await wrapper.find('input').trigger('click');
    await nextTick();

    const cells = Array.from(document.querySelectorAll('.calendar-panel button'));
    expect(cells.length).toBeGreaterThan(0);

    await cells[10].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    (cells[10] as HTMLElement).click();
    await nextTick();
    (cells[13] as HTMLElement).click();
    await nextTick();

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const value = emitted![emitted!.length - 1][0] as [string, string];
    // 两端均为 YYYY-MM-DD 日期键，且开始不晚于结束
    expect(value).toHaveLength(2);
    expect(value[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(value[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(value[0] <= value[1]).toBe(true);
    wrapper.unmount();
  });
});
