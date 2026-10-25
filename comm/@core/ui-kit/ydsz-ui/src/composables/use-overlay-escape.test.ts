/**
 * useOverlayEscape composable 测试 —— 验证栈式 ESC 调度契约。
 *
 * <p>测试范围：active 期间接管 ESC、非 Escape 键忽略、嵌套时只关栈顶、
 * 关闭后回落下层、组件卸载自动注销、全部注销后移除 document 监听。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-overlay-escape.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { __resetOverlayEscapeStackForTests, useOverlayEscape } from './use-overlay-escape';

/** 已挂载的宿主包装器，afterEach 统一卸载 */
const wrappers: Array<{ unmount: () => void }> = [];

/** 把 composable 装进组件作用域，以便 onBeforeUnmount 生效 */
function mountEscapeHost(handler: () => void, initial = false) {
  const active = ref(initial);
  const Comp = defineComponent({
    setup() {
      useOverlayEscape(active, handler);
      return () => h('div');
    },
  });
  const wrapper = mount(Comp);
  wrappers.push(wrapper);
  return { active, wrapper };
}

/** 派发一次按键事件 */
function pressKey(key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  document.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  __resetOverlayEscapeStackForTests();
});

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers.length = 0;
  vi.restoreAllMocks();
  __resetOverlayEscapeStackForTests();
});

describe('useOverlayEscape', () => {
  it('active=false 时 ESC 不触发处理函数', () => {
    const handler = vi.fn();
    mountEscapeHost(handler, false);

    pressKey('Escape');

    expect(handler).not.toHaveBeenCalled();
  });

  it('active 期间 ESC 触发一次，其他按键忽略', () => {
    const handler = vi.fn();
    mountEscapeHost(handler, true);

    pressKey('Enter');
    pressKey('Escape');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('嵌套浮层只有最上层（最后注册）响应 ESC', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    mountEscapeHost(outer, true);
    mountEscapeHost(inner, true);

    pressKey('Escape');

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('上层关闭后 ESC 回落到下层', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const outerHost = mountEscapeHost(outer, true);
    const innerHost = mountEscapeHost(inner, true);

    innerHost.active.value = false;
    await outerHost.wrapper.vm.$nextTick();

    pressKey('Escape');

    expect(inner).not.toHaveBeenCalled();
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('组件卸载后自动注销，不再抢占栈顶', () => {
    const stale = vi.fn();
    const staleHost = mountEscapeHost(stale, true);
    const fresh = vi.fn();
    const freshHost = mountEscapeHost(fresh, true);

    staleHost.wrapper.unmount();
    pressKey('Escape');
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();

    freshHost.active.value = false;
  });

  it('全部注销后移除 document 监听，再次 ESC 无副作用', async () => {
    const handler = vi.fn();
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const host = mountEscapeHost(handler, true);

    host.active.value = false;
    await host.wrapper.vm.$nextTick();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.anything());

    handler.mockClear();
    pressKey('Escape');
    expect(handler).not.toHaveBeenCalled();
  });
});
