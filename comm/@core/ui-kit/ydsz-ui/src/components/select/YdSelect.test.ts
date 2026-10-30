/**
 * YdSelect 组件测试 —— 验证 YdSelectSmart（业务选择器）的 v-model 绑定、
 * 选项渲染、change 事件、disabled 状态、搜索与多选。
 *
 * <p>YdSelectSmart 是数据驱动的开箱选择器，基于 Popover + Listbox 实现；
 * 浮层经 Portal 挂到 document.body，因此读取面板内元素均从 document 查询。
 * 整体沿用 YdSelectSmart.test.ts 的开放/读取约定，精简为对外 API 契约测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\YdSelect.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import { nextTick } from 'vue';

import YdSelectSmart from './YdSelectSmart.vue';

import type { SelectSmartOption } from './YdSelectSmart.vue';

const OPTIONS: SelectSmartOption[] = [
  { label: '苹果', value: 'apple' },
  { label: '香蕉', value: 'banana' },
  { label: '樱桃', value: 'cherry' },
  { label: '禁用', value: 'disabled', disabled: true },
];

/**
 * 挂载被测选择器。
 *
 * @param props - 覆盖属性
 * @returns wrapper
 */
function mountSelect(props: Record<string, unknown> = {}) {
  return mount(YdSelectSmart, {
    attachTo: document.body,
    props: { options: OPTIONS, ...props },
  });
}

/**
 * 展开面板。
 */
async function openPanel(wrapper: ReturnType<typeof mountSelect>): Promise<void> {
  await wrapper.find('[data-testid="select-trigger"]').trigger('click');
  await nextTick();
}

/**
 * 读取当前面板内的 option 元素。
 */
function optionEls(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="option"]')];
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdSelectSmart 基础渲染', () => {
  it('应渲染触发器（combobox role）', () => {
    const wrapper = mountSelect();
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.exists()).toBe(true);
    expect(trigger.attributes('role')).toBe('combobox');
    wrapper.unmount();
  });

  it('无选中时应显示 placeholder', () => {
    const wrapper = mountSelect({ placeholder: '请选择' });
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.text()).toContain('请选择');
    wrapper.unmount();
  });

  it('有选中值时应显示对应 label', () => {
    const wrapper = mountSelect({ modelValue: 'apple' });
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.text()).toContain('苹果');
    wrapper.unmount();
  });

  it('默认 aria-expanded=false', () => {
    const wrapper = mountSelect();
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('展开后 aria-expanded=true', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });
});

describe('YdSelectSmart disabled 状态', () => {
  it('disabled=true 时应设置 aria-disabled', () => {
    const wrapper = mountSelect({ disabled: true });
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.attributes('aria-disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('disabled=true 时应有禁用样式', () => {
    const wrapper = mountSelect({ disabled: true });
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.classes()).toContain('cursor-not-allowed');
    wrapper.unmount();
  });
});

describe('YdSelectSmart 选项面板', () => {
  it('展开后应渲染 listbox role', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);

    const listbox = document.querySelector('[role="listbox"]');
    expect(listbox).not.toBeNull();
    wrapper.unmount();
  });

  it('选项应渲染 role="option"（含 disabled 项的视觉降级）', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);

    const optionsEls = optionEls();
    // disabled 项仍然渲染，但带 aria-disabled=true
    expect(optionsEls.length).toBe(4);
    const disabledEl = optionsEls.find(el => el.getAttribute('aria-disabled') === 'true');
    expect(disabledEl).toBeDefined();
    wrapper.unmount();
  });

  it('search=true 时应渲染搜索框', async () => {
    const wrapper = mountSelect({ search: true });
    await openPanel(wrapper);

    const searchInput = document.querySelector<HTMLInputElement>('[data-testid="select-search"]');
    expect(searchInput).not.toBeNull();
    wrapper.unmount();
  });

  it('loading=true 时应显示加载态而非列表', async () => {
    const wrapper = mountSelect({ loading: true });
    await openPanel(wrapper);

    const status = document.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    wrapper.unmount();
  });
});

describe('YdSelectSmart 选中与事件', () => {
  it('点击选项应更新 v-model 并触发 change 事件', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);

    optionEls()[0]!.click();
    await nextTick();

    expect(wrapper.emitted('change')).toBeTruthy();
    expect(wrapper.emitted('change')![0]).toEqual(['apple']);
    wrapper.unmount();
  });

  it('单选模式下选择后应收起面板', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);

    optionEls()[0]!.click();
    await nextTick();

    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('allowClear=true 且已选择时应显示清除按钮', () => {
    const wrapper = mountSelect({ modelValue: 'apple', allowClear: true });
    expect(wrapper.find('[data-testid="clear-button"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('点击清除按钮应清空选择', async () => {
    const wrapper = mountSelect({ modelValue: 'apple', allowClear: true });
    await nextTick();

    await wrapper.find('[data-testid="clear-button"]').trigger('click');
    expect(wrapper.emitted('change')).toBeTruthy();
    wrapper.unmount();
  });
});

describe('YdSelectSmart 多选模式', () => {
  it('multiple=true 时应渲染标签', () => {
    const wrapper = mountSelect({ multiple: true, modelValue: ['apple', 'banana'] });
    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.text()).toContain('苹果');
    expect(trigger.text()).toContain('香蕉');
    wrapper.unmount();
  });

  it('multiple=true 时 listbox 应设置 aria-multiselectable', async () => {
    const wrapper = mountSelect({ multiple: true });
    await openPanel(wrapper);

    const listbox = document.querySelector('[role="listbox"]');
    expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
    wrapper.unmount();
  });

  it('多选模式下选择后应保持展开', async () => {
    const wrapper = mountSelect({ multiple: true });
    await openPanel(wrapper);

    optionEls()[0]!.click();
    await nextTick();

    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });
});
