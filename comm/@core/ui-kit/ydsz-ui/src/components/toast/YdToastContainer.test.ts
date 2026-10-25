/**
 * YdToastContainer / YdToast 组件测试 —— 覆盖渲染层契约。
 *
 * <p>测试范围：默认条目渲染、close 事件回传 id、全局单例回落、Teleport 与
 * zIndex 配置、自动关闭计时、悬停暂停按剩余时间续算、severity 对应的 ARIA 角色。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\YdToastContainer.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, markRaw } from 'vue';

import YdToast from './YdToast.vue';
import YdToastContainer from './YdToastContainer.vue';
import { configureToast, useToast } from './use-toast';
import type { ToastMessage } from './types';

/** 构造一条完整消息，避免每个用例重复补全必填字段 */
function makeMessage(overrides: Partial<ToastMessage> = {}): ToastMessage {
  return {
    closable: true,
    createdAt: Date.now(),
    detail: '默认内容',
    id: `toast-${Math.random().toString(36).slice(2, 8)}`,
    life: 0,
    position: 'top-right',
    severity: 'info',
    ...overrides,
  };
}

/** 走公开 API 复位全局单例与全局配置 */
function resetStore(): void {
  useToast().removeAll();
  configureToast({ life: 4500, maxVisible: 0, position: 'top-right' });
}

/** Teleport 内容不在 wrapper 内，统一从 document 取节点 */
function queryAll(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

describe('YdToastContainer', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    resetStore();
  });

  /* ---------- 默认渲染 ---------- */

  it('应按 props.messages 渲染默认 YdToast 条目', () => {
    const list = [makeMessage({ detail: '第一条' }), makeMessage({ detail: '第二条' })];
    const wrapper = mount(YdToastContainer, {
      attachTo: document.body,
      props: { appendTo: false, messages: list },
    });

    expect(wrapper.findAllComponents(YdToast)).toHaveLength(2);
    expect(wrapper.text()).toContain('第一条');
    expect(wrapper.text()).toContain('第二条');
    wrapper.unmount();
  });

  it('不传 messages 时应回落到全局单例', () => {
    useToast().success('来自单例的提示');
    const wrapper = mount(YdToastContainer, { props: { appendTo: false } });

    expect(wrapper.text()).toContain('来自单例的提示');
    wrapper.unmount();
  });

  it('#default 插槽应可整体替换条目并透出 message', () => {
    const list = [makeMessage({ detail: '自定义' })];
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, messages: list },
      slots: {
        default: (slotProps: { message: ToastMessage }) =>
          h('div', { class: 'custom-row' }, slotProps.message.detail),
      },
    });

    expect(wrapper.findComponent(YdToast).exists()).toBe(false);
    expect(wrapper.find('.custom-row').text()).toBe('自定义');
    wrapper.unmount();
  });

  /* ---------- 关闭事件回传 ---------- */

  it('点击条目关闭按钮应向上抛出该条 id', async () => {
    const list = [makeMessage({ id: 'fixed-id', detail: '可关闭' })];
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, messages: list },
    });

    await wrapper.find('button[type="button"]').trigger('click');

    expect(wrapper.emitted('close')?.[0]).toEqual(['fixed-id']);
    wrapper.unmount();
  });

  it('closable=false 的条目不应渲染关闭按钮', () => {
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, messages: [makeMessage({ closable: false })] },
    });

    expect(wrapper.find('button').exists()).toBe(false);
    wrapper.unmount();
  });

  /* ---------- 计时与自动关闭 ---------- */

  it('life 到期后容器应收到 close', async () => {
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, messages: [makeMessage({ id: 'auto', life: 1000 })] },
    });

    vi.advanceTimersByTime(999);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeUndefined();

    vi.advanceTimersByTime(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')?.[0]).toEqual(['auto']);
    wrapper.unmount();
  });

  it('life=0 应常驻不计时', () => {
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, messages: [makeMessage({ life: 0 })] },
    });

    vi.advanceTimersByTime(60_000);
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  });

  it('悬停暂停后应按剩余时间续算，而非重新计满', async () => {
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, messages: [makeMessage({ id: 'hover', life: 1000 })] },
    });
    const card = wrapper.find('[aria-atomic="true"]');

    vi.advanceTimersByTime(400);
    await card.trigger('mouseenter');
    vi.advanceTimersByTime(5000);
    expect(wrapper.emitted('close')).toBeUndefined();

    await card.trigger('mouseleave');
    vi.advanceTimersByTime(599);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeUndefined();

    vi.advanceTimersByTime(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')?.[0]).toEqual(['hover']);
    wrapper.unmount();
  });

  /* ---------- 容器层 ARIA 与定位 ---------- */

  it('应提供带 aria-live 的 region 容器', () => {
    const wrapper = mount(YdToastContainer, { props: { appendTo: false } });
    const region = wrapper.find('[role="region"]');

    expect(region.attributes('aria-live')).toBe('polite');
    expect(region.attributes('aria-label')).toBeTruthy();
    wrapper.unmount();
  });

  it('zIndex 应作用到容器根节点', () => {
    const wrapper = mount(YdToastContainer, {
      props: { appendTo: false, zIndex: 1234 },
    });

    expect(wrapper.find('[role="region"]').attributes('style')).toContain('z-index: 1234');
    wrapper.unmount();
  });

  it('appendTo=false 原地渲染，默认 Teleport 到 body', () => {
    const inPlace = mount(YdToastContainer, { props: { appendTo: false } });
    expect(inPlace.find('[role="region"]').exists()).toBe(true);
    inPlace.unmount();

    const teleported = mount(YdToastContainer, {
      attachTo: document.body,
      props: { messages: [makeMessage({ detail: '传送门内容' })] },
    });
    expect(teleported.find('[role="region"]').exists()).toBe(false);
    expect(queryAll('[role="region"]').length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain('传送门内容');
    teleported.unmount();
  });

  it('位置不同的消息应同时出现在 region 内', () => {
    const wrapper = mount(YdToastContainer, {
      props: {
        appendTo: false,
        messages: [
          makeMessage({ detail: '右上', position: 'top-right' }),
          makeMessage({ detail: '左下', position: 'bottom-left' }),
        ],
      },
    });

    expect(wrapper.findAllComponents(YdToast)).toHaveLength(2);
    expect(wrapper.text()).toContain('右上');
    expect(wrapper.text()).toContain('左下');
    wrapper.unmount();
  });
});

describe('YdToast', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('info / success 使用 role=status，warning / error 使用 role=alert', () => {
    const status = mount(YdToast, { props: { detail: '提示', severity: 'info' } });
    expect(status.attributes('role')).toBe('status');
    status.unmount();

    const alert = mount(YdToast, { props: { detail: '失败', severity: 'error' } });
    expect(alert.attributes('role')).toBe('alert');
    alert.unmount();
  });

  it('自定义 icon 组件应替换默认图标', () => {
    const CustomIcon = markRaw(defineComponent({ render: () => h('span', { class: 'my-icon' }) }));
    const wrapper = mount(YdToast, { props: { detail: '带图标', icon: CustomIcon } });

    expect(wrapper.find('.my-icon').exists()).toBe(true);
    wrapper.unmount();
  });

  it('#icon 插槽应可覆盖图标区域', () => {
    const wrapper = mount(YdToast, {
      props: { detail: '插槽图标' },
      slots: { icon: '<i class="slot-icon" />' },
    });

    expect(wrapper.find('.slot-icon').exists()).toBe(true);
    wrapper.unmount();
  });

  it('同时给出 summary 与 detail 时应分别渲染', () => {
    const wrapper = mount(YdToast, { props: { detail: '正文', summary: '标题' } });

    expect(wrapper.text()).toContain('标题');
    expect(wrapper.text()).toContain('正文');
    wrapper.unmount();
  });

  it('焦点在条目内按 Escape 应触发 close', async () => {
    const wrapper = mount(YdToast, { props: { detail: '可关闭', life: 0 } });

    await wrapper.find('button').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });
});
