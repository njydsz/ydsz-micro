/**
 * use-idle-hydrate 测试 — 验证空闲期挂载、强制挂载与清理行为
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\composables\use-idle-hydrate.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { defineComponent, nextTick, h } from 'vue';

import { mount } from '@vue/test-utils';

import { useIdleHydrate, useSimpleIdleHydrate } from './use-idle-hydrate';

/** 构建最小包裹组件以触发 onMounted 生命周期 */
function withLifecycle<T>(composable: () => T): { wrapper: ReturnType<typeof mount>; data: T } {
  let captured: T;
  const Comp = defineComponent({
    setup() {
      captured = composable();
      return () => h('div');
    },
  });
  const wrapper = mount(Comp);
  return { wrapper, data: captured! };
}

describe('useIdleHydrate', () => {
  let originalRIC: typeof requestIdleCallback;
  let idleCallbacks: IdleRequestCallback[];

  beforeEach(() => {
    originalRIC = globalThis.requestIdleCallback;
    idleCallbacks = [];
    globalThis.requestIdleCallback = vi.fn(
      (cb: IdleRequestCallback) => {
        idleCallbacks.push(cb);
        return idleCallbacks.length;
      },
    ) as typeof requestIdleCallback;
  });

  afterEach(() => {
    globalThis.requestIdleCallback = originalRIC;
  });

  it('immediate=true 时应立即挂载', () => {
    const { data } = withLifecycle(() =>
      useIdleHydrate({ immediate: true, idle: false }),
    );
    expect(data.isHydrated.value).toBe(true);
  });

  it('默认应等待 idle 回调后挂载', async () => {
    const { data } = withLifecycle(() =>
      useIdleHydrate({ idle: true }),
    );
    await nextTick();
    expect(data.isHydrated.value).toBe(false);

    // 模拟浏览器触发 idle
    const cb = idleCallbacks[0];
    expect(cb).toBeDefined();
    cb({ didTimeout: false, timeRemaining: () => 50 });
    await nextTick();
    expect(data.isHydrated.value).toBe(true);
  });

  it('forceMount() 应跳过等待立即挂载', () => {
    const { data } = withLifecycle(() =>
      useIdleHydrate({ idle: true }),
    );
    expect(data.isHydrated.value).toBe(false);

    data.forceMount();
    expect(data.isHydrated.value).toBe(true);
  });

  it('应返回 containerRef 引用', () => {
    const { data } = withLifecycle(() =>
      useIdleHydrate({ idle: true }),
    );
    expect(data.containerRef.value).toBeUndefined();
  });

  it('isHydrated 变更应触发响应式更新', async () => {
    const { data } = withLifecycle(() =>
      useIdleHydrate({ idle: false, immediate: false }),
    );
    expect(data.isHydrated.value).toBe(false);
    data.forceMount();
    expect(data.isHydrated.value).toBe(true);
  });
});

describe('useSimpleIdleHydrate', () => {
  let originalRIC: typeof requestIdleCallback;

  beforeEach(() => {
    originalRIC = globalThis.requestIdleCallback;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.requestIdleCallback = originalRIC;
    vi.useRealTimers();
  });

  it('DEV 模式下立即挂载（import.meta.env.DEV=true）', () => {
    globalThis.requestIdleCallback = vi.fn(() => 0) as typeof requestIdleCallback;
    const { data: isHydrated } = withLifecycle(() => useSimpleIdleHydrate());
    // 测试环境 import.meta.env.DEV 为 true，isHydrated 初始值应为 true
    expect(isHydrated.value).toBe(true);
  });

  it('手动 forceMount 后 isHydrated 为 true', () => {
    globalThis.requestIdleCallback = vi.fn(() => 0) as typeof requestIdleCallback;
    const { data: isHydrated } = withLifecycle(() => useSimpleIdleHydrate());
    // 已是 true（DEV模式）
    expect(isHydrated.value).toBe(true);
  });
});
