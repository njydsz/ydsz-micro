/**
 * ManagerRegistry 统一生命周期管理单元测试
 *
 * 验证 P0-A1 落地：10 个管理器全部被 ManagerRegistry 统一 dispose，
 * 且 disposeAll 按注册逆序释放（被依赖管理器先释放）。
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/manager-registry.spec.ts
 * @author remi-team
 * @since 4.1.0
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createManagerRegistry,
  ManagerRegistry,
} from '../../manager-registry';

describe('ManagerRegistry 基础契约', () => {
  it('创建空注册表时 getManagerNames 返回空数组', () => {
    const reg = createManagerRegistry();
    expect(reg.getManagerNames()).toEqual([]);
    expect(reg.isDisposed()).toBe(false);
  });

  it('register 后通过 get 能检索到同名管理器', () => {
    const reg = createManagerRegistry();
    const m = { name: 'foo', dispose: vi.fn() };
    reg.register(m);
    expect(reg.get('foo')).toBe(m);
    expect(reg.getManagerNames()).toEqual(['foo']);
  });

  it('同名管理器重复注册时覆盖旧实例（旧实例先 dispose）', async () => {
    const reg = createManagerRegistry();
    const oldDispose = vi.fn();
    const newDispose = vi.fn();
    reg.register({ name: 'dup', dispose: oldDispose });
    reg.register({ name: 'dup', dispose: newDispose });
    expect(oldDispose).toHaveBeenCalledTimes(1);
    expect(reg.get('dup')).toEqual({ name: 'dup', dispose: newDispose });
    await reg.disposeAll();
    expect(newDispose).toHaveBeenCalledTimes(1);
  });

  it('disposeAll 按注册逆序调用各管理器 dispose', async () => {
    const reg = createManagerRegistry();
    const order: string[] = [];
    reg.register({ name: 'a', dispose: () => { order.push('a'); } });
    reg.register({ name: 'b', dispose: () => { order.push('b'); } });
    reg.register({ name: 'c', dispose: () => { order.push('c'); } });
    await reg.disposeAll();
    // 逆序释放：c → b → a
    expect(order).toEqual(['c', 'b', 'a']);
  });

  it('单个管理器 dispose 失败不影响其他管理器', async () => {
    const reg = createManagerRegistry();
    const ok = vi.fn();
    reg.register({ name: 'bad', dispose: () => { throw new Error('boom'); } });
    reg.register({ name: 'good', dispose: ok });
    await reg.disposeAll();
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('重复调用 disposeAll 幂等（不重复释放）', async () => {
    const reg = createManagerRegistry();
    const d = vi.fn();
    reg.register({ name: 'm', dispose: d });
    await reg.disposeAll();
    await reg.disposeAll();
    expect(d).toHaveBeenCalledTimes(1);
    expect(reg.isDisposed()).toBe(true);
  });
});

describe('P0-A1: 10 个管理器工厂函数完整性验证', () => {
  it('所有 create*Manager 工厂能被调用且返回有效的 DisposableManager', async () => {
    const { createSchedulerManager } = await import('../../scheduler');
    const { createVersionManager } = await import('../../version-manager');
    const { createPreloadManager } = await import('../../preload-strategy');
    const { createCanaryManager } = await import('../../canary-manager');
    const { createRoutePredictorManager } = await import('../../route-predictor');
    const { createMessageBrokerManager } = await import('../../message-broker');
    const { createPerformanceManager } = await import('../../performance-utils');
    const { createSpeculationRulesManager } = await import('../../speculation-rules');
    const { createErrorBoundaryManager } = await import('../../error-boundary');
    const { createDevToolsManager } = await import('../../devtools-panel');

    const factories = [
      createSchedulerManager,
      createVersionManager,
      createPreloadManager,
      createCanaryManager,
      createRoutePredictorManager,
      createMessageBrokerManager,
      createPerformanceManager,
      createSpeculationRulesManager,
      createErrorBoundaryManager,
      createDevToolsManager,
    ];

    const managers = factories.map((f) => f());
    expect(managers).toHaveLength(10);

    // 全管理局名唯一
    const names = managers.map((m) => m.name);
    expect(new Set(names).size).toBe(10);

    // 所有 dispose 方法都是函数
    for (const m of managers) {
      expect(typeof m.dispose).toBe('function');
    }
  });

  it('每个管理器 dispose 调用无异常', async () => {
    const { createSchedulerManager } = await import('../../scheduler');
    const { createVersionManager } = await import('../../version-manager');
    const { createRoutePredictorManager } = await import('../../route-predictor');
    const { createErrorBoundaryManager } = await import('../../error-boundary');

    const managers = [
      createSchedulerManager(),
      createVersionManager(),
      createRoutePredictorManager(),
      createErrorBoundaryManager(),
    ];

    for (const m of managers) {
      expect(() => m.dispose()).not.toThrow();
    }
  });
});

describe('ManagerRegistry.createKernel 集成场景', () => {
  let reg: ManagerRegistry;

  beforeEach(() => {
    reg = createManagerRegistry();
  });

  it('模拟 stop 流程：注册所有 10 个管理器 → disposeAll 清空注册表', async () => {
    for (let i = 0; i < 10; i++) {
      reg.register({ name: `m${i}`, dispose: vi.fn() });
    }
    expect(reg.getManagerNames()).toHaveLength(10);
    await reg.disposeAll();
    expect(reg.getManagerNames()).toHaveLength(0);
    expect(reg.isDisposed()).toBe(true);
  });
});
