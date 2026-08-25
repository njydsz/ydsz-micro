/**
 * sandbox.spec.ts — 快照沙箱核心路径单元测试
 *
 * v4.3.0 新增：补齐沙箱核心路径覆盖。
 * 覆盖场景：
 * 1. enter/exit 清理子应用新增的 window 全局变量
 * 2. exit 还原被修改的 window 属性值
 * 3. exit 移除 mount 期间注册的 window/document 事件监听
 * 4. exit 清理 mount 期间创建的定时器（setTimeout / setInterval / rAF）
 * 5. 嵌套沙箱（栈式管理）：内层退出不还原全局代理，外层退出才还原
 * 6. document.title 还原
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/sandbox.spec.ts
 * @author ydsz-team
 * @since 4.3.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@YDSZ-core/shared/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { enterSandbox, exitSandbox } from '../../sandbox';

describe('sandbox — 快照沙箱', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.title = 'YDSZ Admin';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exit 清理子应用新增的 window 全局变量', () => {
    const sandbox = enterSandbox();

    // 模拟子应用挂载期间新增全局变量
    (window as unknown as Record<string, unknown>).__SANDBOX_TEST_LEAK__ = 1;
    expect('__SANDBOX_TEST_LEAK__' in window).toBe(true);

    exitSandbox(sandbox);

    expect('__SANDBOX_TEST_LEAK__' in window).toBe(false);
  });

  it('exit 还原被修改的 window 属性值', () => {
    (window as unknown as Record<string, unknown>).__SANDBOX_TEST_VALUE__ = 'before';
    const sandbox = enterSandbox();

    (window as unknown as Record<string, unknown>).__SANDBOX_TEST_VALUE__ = 'after';

    exitSandbox(sandbox);

    expect((window as unknown as Record<string, unknown>).__SANDBOX_TEST_VALUE__).toBe('before');
  });

  it('exit 移除 mount 期间注册的 window 事件监听', () => {
    const sandbox = enterSandbox();
    const listener = vi.fn();

    window.addEventListener('sandbox-test-event', listener);

    // 触发一次（在沙箱内应被记录但监听器生效）
    window.dispatchEvent(new Event('sandbox-test-event'));
    expect(listener).toHaveBeenCalledTimes(1);

    exitSandbox(sandbox);

    // 清理后再次触发，监听器不应被调用
    window.dispatchEvent(new Event('sandbox-test-event'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('exit 清理 mount 期间创建的 setTimeout', () => {
    const sandbox = enterSandbox();
    const callback = vi.fn();

    window.setTimeout(callback, 100);

    exitSandbox(sandbox);
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();
  });

  it('exit 清理 mount 期间创建的 setInterval', () => {
    const sandbox = enterSandbox();
    const callback = vi.fn();

    window.setInterval(callback, 50);

    exitSandbox(sandbox);
    vi.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();
  });

  it('exit 还原 document.title', () => {
    const sandbox = enterSandbox();
    document.title = '子应用改的标题';

    exitSandbox(sandbox);

    expect(document.title).toBe('YDSZ Admin');
  });

  it('v4.3.1 回归：exit 移除 mount 期间注册的 document 事件监听', () => {
    const sandbox = enterSandbox();
    const listener = vi.fn();

    // 子应用常见的 document 级监听（如 visibilitychange）
    document.addEventListener('sandbox-doc-event', listener);

    document.dispatchEvent(new Event('sandbox-doc-event'));
    expect(listener).toHaveBeenCalledTimes(1);

    exitSandbox(sandbox);

    // 修复前：document.addEventListener 未被代理，监听器未记录 → 卸载后泄漏
    document.dispatchEvent(new Event('sandbox-doc-event'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('v4.3.1 回归：exit 以 cancelAnimationFrame 取消 mount 期间的 rAF', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(4242);
    const cancelSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    const sandbox = enterSandbox();
    const id = window.requestAnimationFrame(() => {});
    expect(id).toBe(4242);

    exitSandbox(sandbox);

    // 修复前：rAF ID 混入 timerIds，exit 仅以 clearTimeout/clearInterval 清理，
    // 非 Chromium 环境（rAF 与定时器 ID 分池）回调在卸载后仍会触发
    expect(cancelSpy).toHaveBeenCalledWith(4242);

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it('v4.3.1 回归：cancelAnimationFrame 在沙箱内主动取消后 exit 不重复取消', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(77);
    const cancelSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);

    const sandbox = enterSandbox();
    window.requestAnimationFrame(() => {});
    window.cancelAnimationFrame(77); // 子应用自行取消

    exitSandbox(sandbox);

    // exit 阶段 rafIds 已空，不应再次调用 cancelAnimationFrame
    expect(cancelSpy).toHaveBeenCalledTimes(1);

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it('v4.3.1 回归：反复 enter/exit 多轮后监听器数量恒定（无累积泄漏）', () => {
    const listener = vi.fn();
    const ROUNDS = 5;

    for (let i = 0; i < ROUNDS; i++) {
      const sandbox = enterSandbox();
      window.addEventListener('sandbox-round-event', listener);
      document.addEventListener('sandbox-round-doc-event', listener);
      window.setTimeout(() => {}, 1000);
      exitSandbox(sandbox);
    }

    // 5 轮切换后，事件均不应再触发（监听器被逐轮清理，无累积）
    window.dispatchEvent(new Event('sandbox-round-event'));
    document.dispatchEvent(new Event('sandbox-round-doc-event'));
    expect(listener).toHaveBeenCalledTimes(0);

    // 全局 API 已还原（非代理态）
    expect(window.addEventListener.name).not.toBe('proxyAddEventListener');
    expect(document.addEventListener.name).not.toBe('proxyDocumentAddEventListener');
  });

  it('嵌套沙箱：内层退出不还原全局代理，外层退出才还原', () => {
    const outer = enterSandbox();
    const inner = enterSandbox();

    // 内层产生的监听在退出内层后被清理
    const innerListener = vi.fn();
    window.addEventListener('sandbox-inner', innerListener);
    exitSandbox(inner);
    window.dispatchEvent(new Event('sandbox-inner'));
    expect(innerListener).toHaveBeenCalledTimes(0);

    // 外层仍处于激活状态：外层产生的监听仍生效
    const outerListener = vi.fn();
    window.addEventListener('sandbox-outer', outerListener);
    window.dispatchEvent(new Event('sandbox-outer'));
    expect(outerListener).toHaveBeenCalledTimes(1);

    // 退出外层后，全局代理还原
    exitSandbox(outer);
    window.dispatchEvent(new Event('sandbox-outer'));
    expect(outerListener).toHaveBeenCalledTimes(1);
  });
});
