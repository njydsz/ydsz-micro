/**
 * useBodyScrollLock composable 测试 —— 验证引用计数式滚动锁。
 *
 * <p>测试范围：开启即锁定、关闭即恢复、多浮层叠加时最后一个才解锁、
 * 原始样式快照还原、滚动条宽度补偿、组件带锁卸载时自动释放。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-body-scroll-lock.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { useBodyScrollLock } from './use-body-scroll-lock';

/** 已挂载的宿主包装器，afterEach 统一卸载 */
const wrappers: Array<{ unmount: () => void }> = [];

/** 把 composable 装进组件作用域 */
function mountLockHost(initial = false) {
  const active = ref(initial);
  const Comp = defineComponent({
    setup() {
      useBodyScrollLock(active);
      return () => h('div');
    },
  });
  const wrapper = mount(Comp);
  wrappers.push(wrapper);
  return { active, wrapper };
}

/** 覆盖窗口/文档宽度以模拟滚动条占位 */
function setMetrics(innerWidth: number, clientWidth: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: innerWidth });
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: clientWidth });
}

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers.length = 0;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('useBodyScrollLock', () => {
  it('激活时锁定 body 滚动，关闭时恢复', async () => {
    setMetrics(1000, 1000);
    const { active } = mountLockHost(false);

    await nextTick();
    expect(document.body.style.overflow).toBe('');

    active.value = true;
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    active.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe('');
  });

  it('两个浮层叠加时，先关的那个不解锁，最后一个才解锁', async () => {
    setMetrics(1000, 1000);
    const first = mountLockHost(true);
    const second = mountLockHost(true);

    first.active.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    second.active.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe('');
  });

  it('解锁后还原锁定前的内联样式', async () => {
    setMetrics(1000, 1000);
    document.body.style.overflow = 'scroll';
    document.body.style.paddingRight = '8px';

    const { active } = mountLockHost(false);
    active.value = true;
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    active.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.body.style.paddingRight).toBe('8px');
  });

  it('存在滚动条宽度时补回等值 padding 防止横向跳动', async () => {
    setMetrics(1015, 1000);
    const { active } = mountLockHost(false);

    active.value = true;
    await nextTick();
    expect(document.body.style.paddingRight).toBe('15px');

    active.value = false;
    await nextTick();
    expect(document.body.style.paddingRight).toBe('');
  });

  it('组件带着锁直接卸载时释放计数', async () => {
    setMetrics(1000, 1000);
    const holder = mountLockHost(true);
    expect(document.body.style.overflow).toBe('hidden');

    holder.wrapper.unmount();
    wrappers.splice(wrappers.indexOf(holder.wrapper), 1);
    expect(document.body.style.overflow).toBe('');

    const next = mountLockHost(false);
    expect(document.body.style.overflow).toBe('');

    next.active.value = true;
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    next.active.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe('');
  });
});
