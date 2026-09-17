// cspell:words YDIZ
/**
 * useOverlayStack composable 测试 —— 验证栈深度递增 / z-index 计算 / 注销清理
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-overlay-stack.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { __resetOverlayStackForTests, useOverlayStack } from './use-overlay-stack';

/** 模块-external 状态重置 —— 测试之间必须清理 */
const registeredHandles: Array<{ unregister: () => void }> = [];

beforeEach(() => {
  __resetOverlayStackForTests();
});

afterEach(() => {
  for (const h of registeredHandles) {
    h.unregister();
  }
  registeredHandles.length = 0;
  __resetOverlayStackForTests();
});

describe('useOverlayStack', () => {
  it('未注册时 depth 为 0，zIndex 为 0', () => {
    const handle = useOverlayStack();
    expect(handle.depth).toBe(0);
    expect(handle.zIndex).toBe(0);
  });

  it('注册后 depth = 1，zIndex = baseZIndex', () => {
    const handle = useOverlayStack({ baseZIndex: 2000, step: 30 });
    handle.register();
    registeredHandles.push(handle);
    expect(handle.depth).toBe(1);
    expect(handle.zIndex).toBe(2000);
  });

  it('两个浮层 depth 分别为 1 和 2', () => {
    const h1 = useOverlayStack({ baseZIndex: 1000, step: 20 });
    const h2 = useOverlayStack({ baseZIndex: 1000, step: 20 });
    h1.register();
    h2.register();
    registeredHandles.push(h1, h2);
    expect(h1.depth).toBe(1);
    expect(h2.depth).toBe(2);
    expect(h1.zIndex).toBe(1000);
    expect(h2.zIndex).toBe(1020);
  });

  it('注销后 depth 归 0', () => {
    const handle = useOverlayStack();
    handle.register();
    expect(handle.depth).toBe(1);
    handle.unregister();
    expect(handle.depth).toBe(0);
    expect(handle.zIndex).toBe(0);
  });

  it('重复注册只计一次', () => {
    const handle = useOverlayStack();
    handle.register();
    handle.register();
    registeredHandles.push(handle);
    expect(handle.depth).toBe(1);
  });
});
