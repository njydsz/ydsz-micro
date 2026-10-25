/**
 * useFocusTrap composable 测试 —— 验证浮层焦点约束契约。
 *
 * <p>测试范围：激活时聚焦首个可聚焦元素、焦点已在容器内不抢占、Tab/Shift+Tab 回环、
 * 无可聚焦元素时阻止 Tab、关闭后归还焦点、restoreFocus 可关闭归还、
 * 禁用/aria-hidden/tabindex=-1 元素被跳过、卸载后监听器移除。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-focus-trap.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import type { Ref } from 'vue';

import { useFocusTrap } from './use-focus-trap';

/** 默认容器内容：按钮 / 输入框 / 按钮 */
function defaultChildren() {
  return [
    h('button', { class: 'c-first', type: 'button' }, 'first'),
    h('input', { class: 'c-input', type: 'text' }),
    h('button', { class: 'c-last', type: 'button' }, 'last'),
  ];
}

/** 已挂载的宿主包装器，afterEach 统一卸载 */
const wrappers: Array<{ unmount: () => void }> = [];

/**
 * 挂载一个带焦点约束容器的宿主组件。
 *
 * @param options - 容器内容与是否归还焦点
 * @returns active 引用、容器引用与包装器
 */
function mountTrapHost(options: { children?: () => ReturnType<typeof h>[]; restoreFocus?: boolean } = {}) {
  const active = ref(false);
  const container = ref<HTMLElement>();

  const Comp = defineComponent({
    setup() {
      useFocusTrap({ active, container, restoreFocus: options.restoreFocus });
      return () =>
        h('div', { class: 'trap-container', ref: container, tabindex: '-1' }, [
          ...(options.children?.() ?? defaultChildren()),
        ]);
    },
  });

  const wrapper = mount(Comp, { attachTo: document.body });
  wrappers.push(wrapper);
  return { active, container, wrapper };
}

/** 按选择器取容器内元素 */
function pick(container: Ref<HTMLElement | undefined>, selector: string): HTMLElement {
  const el = container.value?.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`[use-focus-trap.test] 未找到元素：${selector}`);
  return el;
}

/** 激活并等待 composable 内部的 nextTick */
async function activate(host: { active: Ref<boolean>; wrapper: { vm: { $nextTick: () => Promise<void> } } }): Promise<void> {
  host.active.value = true;
  await nextTick();
  await host.wrapper.vm.$nextTick();
  await nextTick();
}

/** 派发 Tab 键 */
function pressTab(shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab', shiftKey });
  document.dispatchEvent(event);
  return event;
}

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers.length = 0;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('useFocusTrap', () => {
  it('激活时聚焦容器内首个可聚焦元素', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const host = mountTrapHost();
    await activate(host);

    expect(document.activeElement).toBe(pick(host.container, '.c-first'));
    trigger.remove();
  });

  it('焦点已在容器内时不抢占当前焦点', async () => {
    const host = mountTrapHost();
    await nextTick();
    const input = pick(host.container, '.c-input');
    input.focus();

    await activate(host);

    expect(document.activeElement).toBe(input);
  });

  it('Tab 停在最后一个元素时回环到第一个并阻止默认行为', async () => {
    const host = mountTrapHost();
    await activate(host);
    const last = pick(host.container, '.c-last');
    last.focus();

    const event = pressTab();

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(pick(host.container, '.c-first'));
  });

  it('Shift+Tab 停在第一个元素时回环到最后一个', async () => {
    const host = mountTrapHost();
    await activate(host);
    const first = pick(host.container, '.c-first');
    first.focus();

    const event = pressTab(true);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(pick(host.container, '.c-last'));
  });

  it('容器内无可聚焦元素时 Tab 被阻止', async () => {
    const host = mountTrapHost({ children: () => [h('p', { class: 'c-plain' }, '仅文本')] });
    await activate(host);

    const event = pressTab();

    expect(event.defaultPrevented).toBe(true);
  });

  it('关闭后焦点归还给打开前的元素', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const host = mountTrapHost();
    await activate(host);
    expect(document.activeElement).not.toBe(trigger);

    host.active.value = false;
    await nextTick();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('restoreFocus=false 时关闭不归还焦点', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const host = mountTrapHost({ restoreFocus: false });
    await activate(host);

    host.active.value = false;
    await nextTick();

    expect(document.activeElement).not.toBe(trigger);
    trigger.remove();
  });

  it('跳过 disabled、aria-hidden 与 tabindex=-1 元素', async () => {
    const host = mountTrapHost({
      children: () => [
        h('a', { 'aria-hidden': 'true', class: 'c-skip', href: '#' }, 'hidden'),
        h('button', { class: 'c-skip', disabled: true, type: 'button' }, 'disabled'),
        h('div', { class: 'c-skip', tabindex: '-1' }, 'no tab'),
        h('input', { class: 'c-valid', type: 'text' }),
      ],
    });
    await activate(host);

    expect(document.activeElement).toBe(pick(host.container, '.c-valid'));
  });

  it('卸载时移除 document 键盘监听', async () => {
    const host = mountTrapHost();
    await activate(host);
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    host.wrapper.unmount();
    wrappers.splice(wrappers.indexOf(host.wrapper), 1);

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
