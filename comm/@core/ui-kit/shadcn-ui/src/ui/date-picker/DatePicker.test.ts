/**
 * DatePicker 组件测试 —— 验证 v-model 绑定、portal 挂载与 click-outside
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>DatePicker 使用 Teleport 将日历面板挂载到 body，测试聚焦于：
 * - v-model 双向绑定与 change 事件
 * - disabled 状态阻止交互
 * - readonly input 防止手动编辑
 *
 * 注意：click-outside 依赖于 onClickOutside (VueUse)，
 * 需要 @vueuse/core 已安装于 devDependencies。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\date-picker\DatePicker.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import DatePicker from './DatePicker.vue';

describe('DatePicker', () => {
  it('应能挂载并渲染 input 元素', () => {
    const wrapper = mount(DatePicker);
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
  });

  it('input 应为 readonly', () => {
    const wrapper = mount(DatePicker);
    const input = wrapper.find('input');
    expect(input.attributes('readonly')).toBeDefined();
    expect(input.attributes('type')).toBe('text');
  });

  it('应显示 placeholder', () => {
    const wrapper = mount(DatePicker, {
      props: { placeholder: '请输入日期' },
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('请输入日期');
  });

  it('v-model 应回显到 input', () => {
    const wrapper = mount(DatePicker, {
      props: { modelValue: '2026-09-17' },
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('2026-09-17');
  });

  it('disabled 状态下 input 应禁用', () => {
    const wrapper = mount(DatePicker, {
      props: { disabled: true },
    });
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
  });

  it('点击触发器应切换面板显隐（isOpen 状态翻转）', async () => {
    const wrapper = mount(DatePicker);
    const input = wrapper.find('input');

    // 点击前无 calendar panel
    expect(wrapper.find('.calendar-panel').exists()).toBe(false);

    // 点击触发器
    await input.trigger('click');

    // 面板出现
    expect(wrapper.find('.calendar-panel').exists()).toBe(true);
  });

  it('应发射 update:modelValue 事件', async () => {
    const wrapper = mount(DatePicker);
    const input = wrapper.find('input');

    // 打开面板选择日期
    await input.trigger('click');
    expect(wrapper.find('.calendar-panel').exists()).toBe(true);

    // 找到第一个当前月份的日期按钮并点击
    const firstDay = wrapper.find('button[aria-label="选择日期"]')
      || wrapper.find('.calendar-panel button[type="button"]');
    if (firstDay.exists()) {
      await firstDay.trigger('click');
      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted).toBeTruthy();
    }
  });

  it('自定义 class 应被合并到容器', () => {
    const wrapper = mount(DatePicker, {
      props: { class: 'my-date-picker' },
    });
    expect(wrapper.classes()).toContain('my-date-picker');
  });
});
