/**
 * useOptimisticUpdate 组合式函数单元测试。
 *
 * <p>用例覆盖：
 * - 执行成功后 loading 状态正确流转
 * - 执行失败后自动调用 rollback 回滚
 * - 失败时重新抛出错误供业务层捕获
 * - rollingBack 状态在回滚期间为 true
 *
 * @path comm\@core\composables\src\use-optimistic-update.test.ts
 * @author ydsz-team
 * @since 26.10.02
 */

import { describe, expect, it, vi } from 'vitest';

import { useOptimisticUpdate } from './use-optimistic-update';

describe('useOptimistic-update', () => {
  it('execute 成功后 loading 从 true 回到 false', async () => {
    const rollback = vi.fn();
    const { execute, loading } = useOptimisticUpdate({ rollback });

    expect(loading()).toBe(false);

    const promise = execute({
      snapshot: 'oldValue',
      operation: () => Promise.resolve('ok'),
    });

    // 执行中（异步尚未完成）
    expect(loading()).toBe(true);
    await promise;

    // 成功结束后
    expect(loading()).toBe(false);
    // 成功时不应触发回滚
    expect(rollback).not.toHaveBeenCalled();
  });

  it('execute 失败时调用 rollback 并传入快照', async () => {
    const rollback = vi.fn();
    const { execute } = useOptimisticUpdate({ rollback });

    const snapshot = { count: 42 };

    await expect(
      execute({
        snapshot,
        operation: () => Promise.reject(new Error('Network Error')),
      }),
    ).rejects.toThrow('Network Error');

    // 回滚函数被调用，且传入了快照
    expect(rollback).toHaveBeenCalledTimes(1);
    expect(rollback).toHaveBeenCalledWith(snapshot);
  });

  it('rollingBack 在回滚期间为 true，结束后回到 false', async () => {
    let resolveRollback!: () => void;
    const rollbackPromise = new Promise<void>((resolve) => {
      resolveRollback = resolve;
    });

    const rollback = vi.fn().mockImplementation(() => rollbackPromise);
    const { execute, rollingBack } = useOptimisticUpdate({ rollback });

    // 启动 execute 并立即捕获拒绝，避免未处理的 Promise 警告
    const executePromise = execute({
      snapshot: 'snap',
      operation: () => Promise.reject(new Error('fail')),
    }).catch(() => {});

    // 等 rollback 被挂起
    await vi.waitFor(() => {
      expect(rollingBack()).toBe(true);
    });

    // 完成 rollback
    resolveRollback!();

    // 等待 execute 流程彻底结束
    await executePromise;
    expect(rollingBack()).toBe(false);
  });

  it('连续多次执行：每次失败都触发对应快照回滚', async () => {
    const rollback = vi.fn();
    const { execute } = useOptimisticUpdate({ rollback });

    await execute({
      snapshot: 'snap1',
      operation: () => Promise.resolve('ok'),
    });

    await execute({
      snapshot: 'snap2',
      operation: () => Promise.reject(new Error('err')),
    }).catch(() => {});

    await execute({
      snapshot: 'snap3',
      operation: () => Promise.reject(new Error('err')),
    }).catch(() => {});

    // 仅 snap2 和 snap3 触发回滚（snap1 成功）
    expect(rollback).toHaveBeenCalledTimes(2);
    expect(rollback).toHaveBeenNthCalledWith(1, 'snap2');
    expect(rollback).toHaveBeenNthCalledWith(2, 'snap3');
  });
});
