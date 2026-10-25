/**
 * YdTreeSelect 组件测试 —— 层级展示、展开折叠、搜索、多选、键盘导航与虚拟滚动。
 *
 * <p>面板经 radix Portal 挂到 document.body，断言统一从 body 读取，
 * 与 @see YdSelectSmart.test.ts 保持同一套挂载约定。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：每个用例都要有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-select\__tests__\TreeSelect.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import { nextTick } from 'vue';

import YdTreeSelect from '../YdTreeSelect.vue';

const sampleTree = [
  {
    children: [
      { label: '技术部', value: 'tech' },
      { label: '产品部', value: 'product' },
    ],
    label: '总部',
    value: 'hq',
  },
  {
    children: [{ label: '市场组', value: 'market' }],
    label: '分部',
    value: 'branch',
  },
];

/**
 * 挂载组件。
 *
 * @param props - 覆盖属性
 * @returns wrapper
 */
function mountTreeSelect(props: Record<string, unknown> = {}) {
  return mount(YdTreeSelect, {
    attachTo: document.body,
    props: { options: sampleTree, ...props },
  });
}

/**
 * 展开面板。
 *
 * @param wrapper - 组件 wrapper
 * @returns 无
 */
async function openPanel(wrapper: ReturnType<typeof mountTreeSelect>): Promise<void> {
  await wrapper.find('[data-testid="tree-select-trigger"]').trigger('click');
  await nextTick();
}

/**
 * 当前面板内可见的树节点行。
 *
 * @returns treeitem 元素数组
 */
function nodeEls(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="treeitem"]')];
}

/**
 * 按 DOM 顺序读取可见节点文本。
 *
 * @returns 节点 label 数组
 */
function visibleLabels(): string[] {
  return nodeEls().map(el => el.textContent?.trim() ?? '');
}

/**
 * 点击某行的展开开关。
 *
 * @param index - 行索引
 * @returns 无
 */
async function clickSwitcher(index: number): Promise<void> {
  nodeEls()[index]
    ?.querySelector('[data-testid="node-switcher"]')
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await nextTick();
}

/**
 * 点击某行以选中。
 *
 * @param index - 行索引
 * @returns 无
 */
async function clickNode(index: number): Promise<void> {
  nodeEls()[index]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await nextTick();
}

/**
 * 在树上派发冒泡键盘事件。
 *
 * @param key - KeyboardEvent.key
 * @returns 无
 */
function pressKey(key: string): void {
  document
    .querySelector('[role="tree"]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
}

/**
 * 向搜索框写入关键字。
 *
 * @param value - 关键字
 * @returns 无
 */
async function typeSearch(value: string): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('[data-testid="tree-select-search"]');
  if (!input) throw new Error('search input 未渲染');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
}

/**
 * 读取触发器上的 aria 字段。
 *
 * @param wrapper - 组件 wrapper
 * @param name - 属性名
 * @returns 属性值
 */
function triggerAria(wrapper: ReturnType<typeof mountTreeSelect>, name: string): string | undefined {
  return wrapper.find('[data-testid="tree-select-trigger"]').attributes(name);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdTreeSelect 触发区', () => {
  it('未选中时展示 placeholder', () => {
    const wrapper = mountTreeSelect({ placeholder: '请选择部门' });
    expect(wrapper.find('[data-testid="tree-select-trigger"]').text()).toContain('请选择部门');
    wrapper.unmount();
  });

  it('受控 modelValue 应回查对应 label', async () => {
    const wrapper = mountTreeSelect({ modelValue: 'tech' });
    await nextTick();
    expect(wrapper.find('[data-testid="tree-select-trigger"]').text()).toContain('技术部');
    wrapper.unmount();
  });

  it('禁用态带 aria-disabled 且按键不展开面板', async () => {
    const wrapper = mountTreeSelect({ disabled: true });
    const trigger = wrapper.find('[data-testid="tree-select-trigger"]');
    expect(trigger.attributes('aria-disabled')).toBe('true');

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    expect(triggerAria(wrapper, 'aria-expanded')).toBe('false');
    wrapper.unmount();
  });
});

describe('YdTreeSelect 层级与展开', () => {
  it('默认全部展开时保留父子层级', async () => {
    const wrapper = mountTreeSelect();
    await openPanel(wrapper);

    expect(visibleLabels()).toEqual(['总部', '技术部', '产品部', '分部', '市场组']);
    expect(nodeEls()[0].getAttribute('aria-level')).toBe('1');
    expect(nodeEls()[1].getAttribute('aria-level')).toBe('2');
    wrapper.unmount();
  });

  it('defaultExpandLevel=0 时只渲染根节点', async () => {
    const wrapper = mountTreeSelect({ defaultExpandLevel: 0 });
    await openPanel(wrapper);

    expect(visibleLabels()).toEqual(['总部', '分部']);
    wrapper.unmount();
  });

  it('defaultExpandLevel=1 时展开一层子节点', async () => {
    const wrapper = mountTreeSelect({ defaultExpandLevel: 1 });
    await openPanel(wrapper);

    expect(visibleLabels()).toEqual(['总部', '技术部', '产品部', '分部', '市场组']);
    wrapper.unmount();
  });

  it('点击开关折叠后其子孙从列表中消失', async () => {
    const wrapper = mountTreeSelect();
    await openPanel(wrapper);

    await clickSwitcher(0);

    expect(visibleLabels()).toEqual(['总部', '分部', '市场组']);
    expect(nodeEls()[0].getAttribute('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('点击开关可先展开再折叠同一父节点', async () => {
    const wrapper = mountTreeSelect({ defaultExpandLevel: 0 });
    await openPanel(wrapper);

    await clickSwitcher(0);
    expect(visibleLabels()).toEqual(['总部', '技术部', '产品部', '分部']);

    await clickSwitcher(0);
    expect(visibleLabels()).toEqual(['总部', '分部']);
    wrapper.unmount();
  });
});

describe('YdTreeSelect 选择', () => {
  it('单选点击节点回写标量并收起面板', async () => {
    const wrapper = mountTreeSelect();
    await openPanel(wrapper);

    await clickNode(1);

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['tech']);
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['tech']);
    expect(triggerAria(wrapper, 'aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('再次点击已选节点应取消选择', async () => {
    const wrapper = mountTreeSelect({ modelValue: 'hq' });
    await openPanel(wrapper);

    await clickNode(0);

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
    wrapper.unmount();
  });

  it('多选累积数组值且面板保持展开', async () => {
    const wrapper = mountTreeSelect({ multiple: true });
    await openPanel(wrapper);

    await clickNode(1);
    await clickNode(3);

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['tech', 'branch']]);
    expect(triggerAria(wrapper, 'aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('treeCheckable 等价于多选并回填 aria-selected', async () => {
    const wrapper = mountTreeSelect({ modelValue: ['tech'], treeCheckable: true });
    await openPanel(wrapper);

    expect(nodeEls()[1].getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[role="tree"]')?.getAttribute('aria-multiselectable')).toBe('true');
    wrapper.unmount();
  });

  it('禁用节点不可选中', async () => {
    const wrapper = mountTreeSelect({
      options: [{ label: '总部', value: 'hq' }, { disabled: true, label: '分部', value: 'branch' }],
    });
    await openPanel(wrapper);

    await clickNode(1);

    expect(nodeEls()[1].getAttribute('aria-disabled')).toBe('true');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('超出 maxTagCount 折叠为 +N，移除标签回写剩余值', async () => {
    const wrapper = mountTreeSelect({ maxTagCount: 1, modelValue: ['hq', 'tech'], multiple: true });
    await nextTick();

    const trigger = wrapper.find('[data-testid="tree-select-trigger"]');
    expect(trigger.findAll('[data-testid="tag-remove"]')).toHaveLength(1);
    expect(trigger.text()).toContain('+1');

    await trigger.find('[data-testid="tag-remove"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['tech']]);
    wrapper.unmount();
  });

  it('allowClear 清空为 undefined', async () => {
    const wrapper = mountTreeSelect({ allowClear: true, modelValue: 'hq' });
    await nextTick();

    await wrapper.find('[data-testid="clear-button"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
    wrapper.unmount();
  });
});

describe('YdTreeSelect 搜索', () => {
  it('关键字命中时忽略折叠态直接展示匹配节点', async () => {
    const wrapper = mountTreeSelect({ defaultExpandLevel: 1, showSearch: true });
    await openPanel(wrapper);

    await typeSearch('市场');

    expect(visibleLabels()).toEqual(['市场组']);
    wrapper.unmount();
  });

  it('无命中时展示空态文案', async () => {
    const wrapper = mountTreeSelect({ showSearch: true });
    await openPanel(wrapper);

    await typeSearch('不存在');

    expect(document.querySelector('[role="tree"]')?.textContent).toContain('无匹配选项');
    expect(nodeEls()).toHaveLength(0);
    wrapper.unmount();
  });
});

describe('YdTreeSelect 键盘导航', () => {
  it('ArrowDown 定位首个节点并写入 aria-activedescendant', async () => {
    const wrapper = mountTreeSelect();
    await openPanel(wrapper);

    pressKey('ArrowDown');
    await nextTick();

    const activeId = triggerAria(wrapper, 'aria-activedescendant');
    expect(activeId).toMatch(/-node-0$/);
    expect(document.getElementById(activeId as string)).toBe(nodeEls()[0]);
    wrapper.unmount();
  });

  it('ArrowRight 展开折叠的父节点，ArrowLeft 收回其子孙', async () => {
    const wrapper = mountTreeSelect({ defaultExpandLevel: 0 });
    await openPanel(wrapper);

    pressKey('ArrowDown');
    await nextTick();

    pressKey('ArrowRight');
    await nextTick();
    expect(visibleLabels()).toEqual(['总部', '技术部', '产品部', '分部']);

    pressKey('ArrowLeft');
    await nextTick();
    expect(visibleLabels()).toEqual(['总部', '分部']);
    wrapper.unmount();
  });

  it('ArrowLeft 在叶子节点上回到父节点', async () => {
    const wrapper = mountTreeSelect();
    await openPanel(wrapper);

    pressKey('ArrowDown');
    pressKey('ArrowDown');
    await nextTick();
    expect(triggerAria(wrapper, 'aria-activedescendant')).toMatch(/-node-1$/);

    pressKey('ArrowLeft');
    await nextTick();
    expect(triggerAria(wrapper, 'aria-activedescendant')).toMatch(/-node-0$/);
    wrapper.unmount();
  });

  it('Enter 选中活动节点', async () => {
    const wrapper = mountTreeSelect();
    await openPanel(wrapper);

    pressKey('ArrowDown');
    pressKey('ArrowDown');
    await nextTick();
    pressKey('Enter');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['tech']);
    wrapper.unmount();
  });

  it('Escape 关闭面板且不改值', async () => {
    const wrapper = mountTreeSelect({ modelValue: 'hq' });
    await openPanel(wrapper);

    pressKey('Escape');
    await nextTick();

    expect(triggerAria(wrapper, 'aria-expanded')).toBe('false');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('typeahead 按首字母定位节点', async () => {
    const wrapper = mountTreeSelect({
      options: [
        { label: 'Alpha', value: 'a' },
        { label: 'Beta', value: 'b' },
      ],
    });
    await openPanel(wrapper);

    pressKey('b');
    await nextTick();

    expect(triggerAria(wrapper, 'aria-activedescendant')).toMatch(/-node-1$/);
    wrapper.unmount();
  });
});

describe('YdTreeSelect 虚拟滚动', () => {
  /** 300 个叶子节点，用于触发视口切片 */
  function makeLargeTree() {
    return Array.from({ length: 300 }, (_, i) => ({ label: `节点-${i}`, value: `node-${i}` }));
  }

  it('大节点量只渲染视口切片，占位层按行数撑高', async () => {
    const wrapper = mountTreeSelect({ options: makeLargeTree() });
    await openPanel(wrapper);

    expect(nodeEls().length).toBeGreaterThan(0);
    expect(nodeEls().length).toBeLessThan(50);

    const spacer = document.querySelector('[role="tree"] > div');
    expect(spacer?.getAttribute('style')).toContain('height: 9600px');
    wrapper.unmount();
  });

  it('End + Enter 命中窗口外的末节点', async () => {
    const wrapper = mountTreeSelect({ options: makeLargeTree() });
    await openPanel(wrapper);

    pressKey('End');
    await nextTick();
    expect(visibleLabels()).toContain('节点-299');

    pressKey('Enter');
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['node-299']);
    wrapper.unmount();
  });
});
