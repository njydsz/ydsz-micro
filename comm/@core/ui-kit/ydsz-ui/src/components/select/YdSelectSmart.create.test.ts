/**
 * YdSelectSmart allowCreate + remote 能力测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\YdSelectSmart.create.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextTick } from 'vue';

import YdSelectSmart from './YdSelectSmart.vue';

const sampleOptions = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
];

/**
 * 挂载 Select。
 */
function mountSelect(props: Record<string, unknown> = {}) {
  return mount(YdSelectSmart, {
    attachTo: document.body,
    props: { options: sampleOptions, ...props },
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
 * 从 document.body 查找面板内元素（Popover Portal 挂载到 body）。
 */
function bodyFind(selector: string): HTMLElement | null {
  return document.body.querySelector(selector);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdSelectSmart allowCreate', () => {
  it('allowCreate=false 时不显示创建入口', async () => {
    const wrapper = mountSelect({ multiple: true, search: true, allowCreate: false });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'Durian';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(bodyFind('[data-testid="select-create"]')).toBeNull();
  });

  it('allowCreate=true + multiple + search 时显示创建入口', async () => {
    const wrapper = mountSelect({ multiple: true, search: true, allowCreate: true });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Durian';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    const create = bodyFind('[data-testid="select-create"]');
    expect(create).toBeTruthy();
    expect(create!.textContent).toContain('Durian');
  });

  it('点击创建入口触发 create 事件并选中', async () => {
    const wrapper = mountSelect({ multiple: true, search: true, allowCreate: true });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Durian';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    const create = bodyFind('[data-testid="select-create"]')!;
    create.dispatchEvent(new MouseEvent('click'));
    await nextTick();
    expect(wrapper.emitted('create')).toBeTruthy();
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  it('已有同 label 选项时不显示创建入口', async () => {
    const wrapper = mountSelect({ multiple: true, search: true, allowCreate: true });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Apple';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(bodyFind('[data-testid="select-create"]')).toBeNull();
  });

  it('allowCreate 但非 multiple 时不显示创建入口', async () => {
    const wrapper = mountSelect({ multiple: false, search: true, allowCreate: true });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Durian';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(bodyFind('[data-testid="select-create"]')).toBeNull();
  });
});

describe('YdSelectSmart remote', () => {
  it('remote=true 时调用 remoteMethod', async () => {
    const remoteMethod = vi.fn().mockResolvedValue([{ label: 'Remote A', value: 'ra' }]);
    const wrapper = mountSelect({
      multiple: true,
      search: true,
      remote: true,
      remoteMethod,
      remoteDebounce: 0,
    });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'query';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 20));
    expect(remoteMethod).toHaveBeenCalledWith('query');
  });

  it('远程结果去重缓存', async () => {
    const remoteMethod = vi.fn().mockResolvedValue([{ label: 'Remote A', value: 'ra' }]);
    const wrapper = mountSelect({
      multiple: true,
      search: true,
      remote: true,
      remoteMethod,
      remoteDebounce: 0,
    });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'q';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 20));
    input.value = 'q2';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 20));
    expect(remoteMethod).toHaveBeenCalledTimes(2);
  });

  it('远程结果渲染到列表', async () => {
    const remoteMethod = vi.fn().mockResolvedValue([{ label: 'Remote A', value: 'ra' }]);
    const wrapper = mountSelect({
      multiple: true,
      search: true,
      remote: true,
      remoteMethod,
      remoteDebounce: 0,
    });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Remote';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 20));
    await nextTick();
    expect(document.body.textContent).toContain('Remote A');
  });

  it('remote=false 时不调用 remoteMethod', async () => {
    const remoteMethod = vi.fn();
    const wrapper = mountSelect({
      multiple: true,
      search: true,
      remote: false,
      remoteMethod,
    });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Apple';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(remoteMethod).not.toHaveBeenCalled();
  });
});

describe('YdSelectSmart filterOption', () => {
  it('自定义 filterOption 生效', async () => {
    const wrapper = mountSelect({
      search: true,
      filterOption: (input: string, option: { label: string }) => option.label.startsWith(input),
    });
    await openPanel(wrapper);
    const input = bodyFind('[data-testid="select-search"]') as HTMLInputElement;
    input.value = 'Ap';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(document.body.textContent).toContain('Apple');
    expect(document.body.textContent).not.toContain('Banana');
  });
});
