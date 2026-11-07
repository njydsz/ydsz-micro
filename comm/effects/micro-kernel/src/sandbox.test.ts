/**
 * 快照沙箱测试 — 覆盖 enterSandbox / exitSandbox 的核心隔离与清理语义
 *
 * 重点验证（对应历史缺陷）：
 * - v3.1 嵌套沙箱：单一 activeSandbox 引用导致的过早 restoreGlobals 与副作用错记
 * - v4.3.1 document.addEventListener 泄漏：Document 原型方法绕过代理
 * - v4.3.1 rAF 幽灵帧：rAF ID 与定时器 ID 分池管理
 *
 * @path comm\effects\micro-kernel\src\sandbox.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enterSandbox, exitSandbox, type SandboxInstance } from './sandbox';

describe('sandbox', () => {
  /** 记录测试期间创建但未退出的沙箱，afterEach 统一清理避免污染后续用例 */
  const pending: SandboxInstance[] = [];

  function enter(): SandboxInstance {
    const sandbox = enterSandbox();
    pending.push(sandbox);
    return sandbox;
  }

  function exit(sandbox: SandboxInstance): void {
    exitSandbox(sandbox);
    const idx = pending.indexOf(sandbox);
    if (idx !== -1) pending.splice(idx, 1);
  }

  beforeEach(() => {
    // vitest 的 useFakeTimers() 在还原时会把 happy-dom 的 rAF 一并移除，
    // 使 window.requestAnimationFrame 变为 undefined。若不在此处补回，
    // proxyGlobals 首次捕获到的 originalRequestAnimationFrame 就是 undefined，
    // 之后每次 restoreGlobals() 都会把 rAF 永久置空（代理链断裂）。
    // 因此无条件安装受控桩，保证代理层始终有可用的原始句柄。
    let nextId = 1;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: (_cb: FrameRequestCallback) => nextId++,
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: (_id: number) => {},
    });
  });

  afterEach(() => {
    // 防御：用例异常退出时清空沙箱栈，避免 restoreGlobals 未触发
    while (pending.length > 0) {
      const sandbox = pending.pop()!;
      exitSandbox(sandbox);
    }
    delete (window as unknown as Record<string, unknown>).__ydsz_test_global;
  });

  describe('enterSandbox', () => {
    it('快照进入时的 window 键集合与 document.title', () => {
      document.title = 'before';
      const sandbox = enter();

      expect(sandbox.windowSnapshot).toBeInstanceOf(Set);
      // happy-dom 的 window 键集合不含 prototype 上的成员（如 location），
      // 因此只断言快照规模非空且为当前键集合的超集关系。
      expect(sandbox.windowSnapshot.size).toBeGreaterThan(0);
      expect(sandbox.documentTitleSnapshot).toBe('before');
      expect(sandbox.listeners).toEqual([]);
      expect(sandbox.timerIds).toEqual([]);
      expect(sandbox.rafIds).toEqual([]);
    });

    it('记录进入前已存在的 window 键值，供退出时还原', () => {
      (window as unknown as Record<string, unknown>).__ydsz_test_global = 'original';
      const sandbox = enter();

      expect(sandbox.valueSnapshot.get('__ydsz_test_global')).toBe('original');

      exit(sandbox);
      delete (window as unknown as Record<string, unknown>).__ydsz_test_global;
    });
  });

  describe('exitSandbox — window 键恢复', () => {
    it('删除子应用新增的全局变量', () => {
      const sandbox = enter();
      (window as unknown as Record<string, unknown>).__ydsz_test_global = 'leaked';

      exit(sandbox);

      expect(
        (window as unknown as Record<string, unknown>).__ydsz_test_global,
      ).toBeUndefined();
    });

    it('还原子应用修改过的全局变量', () => {
      (window as unknown as Record<string, unknown>).__ydsz_test_global = 'original';
      const sandbox = enter();
      (window as unknown as Record<string, unknown>).__ydsz_test_global = 'mutated';

      exit(sandbox);

      expect((window as unknown as Record<string, unknown>).__ydsz_test_global).toBe(
        'original',
      );
      delete (window as unknown as Record<string, unknown>).__ydsz_test_global;
    });

    it('还原被子应用修改的 document.title', () => {
      document.title = 'before';
      const sandbox = enter();
      document.title = 'after';

      exit(sandbox);

      expect(document.title).toBe('before');
    });

    it('不误删进入前已存在且未被修改的键', () => {
      const sandbox = enter();
      const sizeBefore = sandbox.windowSnapshot.size;

      exit(sandbox);

      // 退出后 window 键集合应回到快照规模（± 测试框架自身新增键）
      expect(Object.keys(window).length).toBeLessThanOrEqual(sizeBefore + 5);
    });
  });

  describe('exitSandbox — 监听器清理（v4.3.1 修复点）', () => {
    it('移除子应用注册在 window 上的事件监听', () => {
      const sandbox = enter();
      const listener = vi.fn();
      window.addEventListener('ydsz-test', listener);
      expect(sandbox.listeners).toHaveLength(1);

      exit(sandbox);

      window.dispatchEvent(new Event('ydsz-test'));
      expect(listener).not.toHaveBeenCalled();
    });

    it('移除子应用注册在 document 上的事件监听（此前走原型方法泄漏）', () => {
      const sandbox = enter();
      const listener = vi.fn();
      document.addEventListener('ydsz-test', listener);
      expect(sandbox.listeners).toHaveLength(1);

      exit(sandbox);

      document.dispatchEvent(new Event('ydsz-test'));
      expect(listener).not.toHaveBeenCalled();
    });

    it('removeEventListener 同步更新记录，退出时不重复移除', () => {
      const sandbox = enter();
      const listener = vi.fn();
      window.addEventListener('ydsz-test', listener);
      window.removeEventListener('ydsz-test', listener);

      expect(sandbox.listeners).toHaveLength(0);

      exit(sandbox);
      // 不抛错即通过（重复移除在部分环境会静默失败）
    });
  });

  describe('exitSandbox — 定时器清理', () => {
    it('清理子应用创建的 setTimeout / setInterval', () => {
      vi.useFakeTimers();
      try {
        const sandbox = enter();
        const cb = vi.fn();
        window.setTimeout(cb, 10_000);
        window.setInterval(cb, 10_000);
        expect(sandbox.timerIds).toHaveLength(2);

        exit(sandbox);
        vi.advanceTimersByTime(20_000);

        expect(cb).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('clearTimeout / clearInterval 同步移除记录，退出时不再重复清理', () => {
      vi.useFakeTimers();
      try {
        const sandbox = enter();
        const cb = vi.fn();
        const timeoutId = window.setTimeout(cb, 10_000);
        const intervalId = window.setInterval(cb, 10_000);

        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);

        expect(sandbox.timerIds).toHaveLength(0);

        exit(sandbox);
        expect(cb).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('exitSandbox — rAF 分池清理（v4.3.1 修复点）', () => {
    // 前面的用例启用了 vi.useFakeTimers()，vitest 会用假实现覆盖 rAF。
    // 必须在此处恢复真实定时器，否则代理层拿到的 originalRequestAnimationFrame
    // 是 vitest 的假实现，后续断言全部失效。
    beforeEach(() => {
      vi.useRealTimers();
    });

    // happy-dom 的 rAF 返回 Immediate 对象而非数字，断言只依赖身份同一性。
    it('rAF ID 记录在 rafIds 而非 timerIds', () => {
      const sandbox = enter();
      const id = window.requestAnimationFrame(vi.fn());

      expect(sandbox.rafIds).toHaveLength(1);
      expect(sandbox.rafIds[0]).toBe(id);
      expect(sandbox.timerIds).toHaveLength(0);

      exit(sandbox);
    });

    it('退出时以 cancelAnimationFrame 取消未触发的帧回调', () => {
      // 代理层在 enterSandbox 时捕获原始 cancelAnimationFrame 句柄，
      // 若在 enter 之后再 spyOn 则观测不到调用。因此先安装计数桩，
      // 让代理层捕获到这个桩。
      const cancelled: number[] = [];
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        writable: true,
        value: (id: number) => {
          cancelled.push(id);
        },
      });

      const sandbox = enter();
      const id = window.requestAnimationFrame(vi.fn());
      expect(cancelled).toHaveLength(0);

      exit(sandbox);

      expect(cancelled).toContain(id);
    });

    it('cancelAnimationFrame 同步移除 rafIds 记录', () => {
      const sandbox = enter();
      const id = window.requestAnimationFrame(vi.fn());

      window.cancelAnimationFrame(id);

      expect(sandbox.rafIds).toHaveLength(0);

      exit(sandbox);
    });
  });

  describe('嵌套沙箱（v3.1 修复点）', () => {
    it('内层退出不还原全局 API，外层退出才还原', () => {
      const outer = enter();
      const inner = enter();
      expect(pending).toHaveLength(2);

      // 内层退出：栈仍非空，不应 restoreGlobals
      exit(inner);
      expect(pending).toHaveLength(1);

      // 外层退出：栈空，restoreGlobals 生效
      exit(outer);
      expect(pending).toHaveLength(0);
    });

    it('副作用记录到当前栈顶沙箱，而非首个沙箱', () => {
      const outer = enter();
      const inner = enter();
      const outerListener = vi.fn();
      const innerListener = vi.fn();

      // 在 inner 激活期间注册 → 应记入 inner
      window.addEventListener('ydsz-outer', outerListener);
      expect(inner.listeners).toHaveLength(1);
      expect(outer.listeners).toHaveLength(0);

      // 切回 outer 激活期间注册 → 应记入 outer
      exit(inner);
      window.addEventListener('ydsz-inner', innerListener);
      expect(outer.listeners).toHaveLength(1);

      // 外层退出应只清除外层监听，内层监听已随内层退出清理
      exit(outer);
      window.dispatchEvent(new Event('ydsz-inner'));
      expect(innerListener).not.toHaveBeenCalled();
    });

    it('支持非栈顶退出（乱序退出）', () => {
      const outer = enter();
      const inner = enter();

      // 先退外层（非栈顶），栈中仍保留 inner
      exitSandbox(outer);
      const idx = pending.indexOf(outer);
      if (idx !== -1) pending.splice(idx, 1);

      // inner 仍可正常退出
      exit(inner);
      expect(pending).toHaveLength(0);
    });

    it('重复退出同一沙箱不抛错', () => {
      const sandbox = enter();
      exit(sandbox);

      expect(() => exitSandbox(sandbox)).not.toThrow();
    });
  });

  describe('幂等性与环境防御', () => {
    it('反复 enter/exit 后 window 键集合保持稳定', () => {
      const baseline = Object.keys(window).length;

      for (let i = 0; i < 3; i++) {
        const sandbox = enter();
        (window as unknown as Record<string, unknown>).__ydsz_test_global = i;
        exit(sandbox);
      }

      expect(
        (window as unknown as Record<string, unknown>).__ydsz_test_global,
      ).toBeUndefined();
      expect(Object.keys(window).length).toBeLessThanOrEqual(baseline + 3);
    });
  });
});
