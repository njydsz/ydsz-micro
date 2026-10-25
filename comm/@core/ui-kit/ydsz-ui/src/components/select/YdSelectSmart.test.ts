/**
 * YdSelectSmart 组件测试 —— 覆盖单选/多选/搜索/键盘导航/虚拟滚动五条主链路。
 *
 * <p>浮层经 radix Portal 挂到 document.body，因此断言统一从 body 读取，
 * 与 @see autoComplete.test.ts 保持同一套挂载约定。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\YdSelectSmart.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { SelectSmartOption } from './YdSelectSmart.vue';

import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import { nextTick } from 'vue';

import YdSelectSmart from './YdSelectSmart.vue';

/** 基础选项集 */
const OPTIONS: SelectSmartOption<string>[] = [
  { label: 'Apple', value: 'a' },
  { label: 'Banana', value: 'b' },
  { label: 'Cherry', value: 'c' },
];

/**
 * 生成 n 条选项，value 形如 v-0。
 *
 * @param n - 选项数量
 * @returns 选项数组
 */
function makeOptions(n: number): SelectSmartOption<string>[] {
  return Array.from({ length: n }, (_, i) => ({ label: `Item ${i}`, value: `v-${i}` }));
}

/**
 * 挂载组件并同步渲染。
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
 *
 * @param wrapper - 组件 wrapper
 * @returns 无
 */
async function openPanel(wrapper: ReturnType<typeof mountSelect>): Promise<void> {
  await wrapper.find('[data-testid="select-trigger"]').trigger('click');
  await nextTick();
}

/**
 * 读取当前面板内的 option 元素（按 DOM 顺序）。
 *
 * @returns option 元素数组
 */
function optionEls(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="option"]')];
}

/**
 * 在面板内派发冒泡的键盘事件。
 *
 * @param key - KeyboardEvent.key
 * @returns 无
 */
function pressKey(key: string): void {
  const listbox = document.querySelector('[role="listbox"]');
  listbox?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
}

/**
 * 向搜索框写入关键字（搜索框位于 Portal 内，只能走原生事件）。
 *
 * @param value - 关键字
 * @returns 无
 */
async function typeSearch(value: string): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('[data-testid="select-search"]');
  if (!input) throw new Error('search input 未渲染');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdSelectSmart 单选', () => {
  it('未展开时不渲染 listbox，aria-expanded 为 false', () => {
    const wrapper = mountSelect();
    expect(wrapper.find('[data-testid="select-trigger"]').attributes('aria-expanded')).toBe('false');
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    wrapper.unmount();
  });

  it('点击选项应写回标量值、抛出 change 并收起面板', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(3);

    optionEls()[1].click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b']);
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['b']);
    expect(wrapper.find('[data-testid="select-trigger"]').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('已选值应在触发区显示对应 label', async () => {
    const wrapper = mountSelect({ modelValue: 'c' });
    await nextTick();
    expect(wrapper.find('[data-testid="select-trigger"]').text()).toContain('Cherry');
    wrapper.unmount();
  });

  it('禁用项不可选中并带 aria-disabled', async () => {
    const wrapper = mountSelect({
      options: [{ label: 'Apple', value: 'a' }, { disabled: true, label: 'Banana', value: 'b' }],
    });
    await openPanel(wrapper);

    optionEls()[1].click();
    await nextTick();

    expect(optionEls()[1].getAttribute('aria-disabled')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });
});

describe('YdSelectSmart 多选', () => {
  it('连续点击累积数组值且面板保持展开', async () => {
    const wrapper = mountSelect({ multiple: true });
    await openPanel(wrapper);

    optionEls()[0].click();
    await nextTick();
    optionEls()[2].click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'c']]);
    expect(wrapper.find('[data-testid="select-trigger"]').attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('再次点击已选项应移除该值', async () => {
    const wrapper = mountSelect({ multiple: true, options: OPTIONS });
    await wrapper.setProps({ modelValue: ['a', 'b'] });
    await openPanel(wrapper);

    optionEls()[0].click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b']]);
    wrapper.unmount();
  });

  it('超出 maxTagCount 的标签折叠为 +N，移除按钮回写剩余值', async () => {
    const wrapper = mountSelect({ maxTagCount: 1, modelValue: ['a', 'b', 'c'], multiple: true });
    await nextTick();

    const trigger = wrapper.find('[data-testid="select-trigger"]');
    expect(trigger.findAll('[data-testid="tag-remove"]')).toHaveLength(1);
    expect(trigger.text()).toContain('+2');

    await trigger.find('[data-testid="tag-remove"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b', 'c']]);
    wrapper.unmount();
  });

  it('allowClear 点击后清空为 []', async () => {
    const wrapper = mountSelect({ allowClear: true, modelValue: ['a'], multiple: true });
    await nextTick();

    await wrapper.find('[data-testid="clear-button"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
    wrapper.unmount();
  });
});

describe('YdSelectSmart 搜索', () => {
  it('关键字过滤仅保留 label 命中项', async () => {
    const wrapper = mountSelect({ search: true });
    await openPanel(wrapper);

    await typeSearch('an');

    const labels = optionEls().map(el => el.textContent?.trim());
    expect(labels).toEqual(['Banana']);
    expect(document.querySelector<HTMLInputElement>('[data-testid="select-search"]')?.value).toBe('an');
    wrapper.unmount();
  });

  it('无命中时展示空态文案', async () => {
    const wrapper = mountSelect({ search: true });
    await openPanel(wrapper);

    await typeSearch('zzz');

    expect(document.querySelector('[role="listbox"]')?.textContent).toContain('无匹配选项');
    expect(optionEls()).toHaveLength(0);
    wrapper.unmount();
  });
});

describe('YdSelectSmart 键盘导航', () => {
  it('ArrowDown 定位首项并写入 aria-activedescendant', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);

    pressKey('ArrowDown');
    await nextTick();

    const activeId = wrapper.find('[data-testid="select-trigger"]').attributes('aria-activedescendant');
    expect(activeId).toMatch(/-listbox-opt-0$/);
    expect(document.getElementById(activeId as string)).toBe(optionEls()[0]);
    wrapper.unmount();
  });

  it('Enter 选中活动项，Escape 关闭面板且不改值', async () => {
    const wrapper = mountSelect();
    await openPanel(wrapper);

    pressKey('ArrowDown');
    pressKey('ArrowDown');
    await nextTick();
    pressKey('Enter');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b']);

    await openPanel(wrapper);
    pressKey('Escape');
    await nextTick();

    expect(wrapper.find('[data-testid="select-trigger"]').attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    wrapper.unmount();
  });

  it('跳过禁用项：ArrowDown 落到第一个可用项', async () => {
    const wrapper = mountSelect({
      options: [{ disabled: true, label: 'Apple', value: 'a' }, { label: 'Banana', value: 'b' }],
    });
    await openPanel(wrapper);

    pressKey('ArrowDown');
    await nextTick();

    expect(wrapper.find('[data-testid="select-trigger"]').attributes('aria-activedescendant')).toMatch(/-opt-1$/);
    wrapper.unmount();
  });

  it('search 模式下焦点在输入框时，字符交给输入框而非 typeahead', async () => {
    const wrapper = mountSelect({ search: true });
    await openPanel(wrapper);

    const input = document.querySelector<HTMLElement>('[data-testid="select-search"]');
    input?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
    await nextTick();

    // 面板处理器不拦截单字符：焦点仍在输入框，列表未被 typeahead 改动
    expect(wrapper.find('[data-testid="select-trigger"]').attributes('aria-activedescendant')).toBeUndefined();
    wrapper.unmount();
  });
});

describe('YdSelectSmart 虚拟滚动', () => {
  it('超过阈值只渲染可见窗口，总高度按 itemHeight 累加', async () => {
    const wrapper = mountSelect({ options: makeOptions(300) });
    await openPanel(wrapper);

    const rendered = optionEls();
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(50);

    const spacer = document.querySelector('[role="listbox"] > div');
    expect(spacer?.getAttribute('style')).toContain('height: 9600px');
    wrapper.unmount();
  });

  it('End + Enter 可命中窗口外的末项（scrollToIndex 生效）', async () => {
    const wrapper = mountSelect({ options: makeOptions(300) });
    await openPanel(wrapper);

    pressKey('End');
    await nextTick();

    const labels = optionEls().map(el => el.textContent?.trim());
    expect(labels).toContain('Item 299');

    pressKey('Enter');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['v-299']);
    wrapper.unmount();
  });

  it('virtual=false 时全量渲染', async () => {
    const wrapper = mountSelect({ options: makeOptions(120), virtual: false });
    await openPanel(wrapper);

    expect(optionEls()).toHaveLength(120);
    wrapper.unmount();
  });
});
