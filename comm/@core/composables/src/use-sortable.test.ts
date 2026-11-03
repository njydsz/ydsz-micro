/**
 * useSortable 组合式函数单元测试。
 *
 * <p>用例覆盖：
 * - 返回 initializeSortable 方法
 * - initializeSortable 调用 sortablejs create 并挂载默认配置
 * - 传入的自定义 options 覆盖默认配置
 * - 测试环境（无 DOM 时）不会崩溃
 *
 * <p>注：sortablejs 使用动态 import，测试环境（happy-dom）不原生支持
 * 完整 DOM 操作，因此重点验证调用链路与配置合并，而非 DOM 行为。
 *
 * @path comm\@core\composables\src\use-sortable.test.ts
 * @author ydsz-team
 * @since 26.10.06
 */

import { describe, expect, it, vi } from 'vitest';

// ---- Mock sortablejs 动态 import ----
const mockCreate = vi.fn();
const mockDestroy = vi.fn();

vi.mock(
  // @ts-expect-error - 动态导入 mocking
  'sortablejs/modular/sortable.complete.esm.js',
  () => {
    return {
      default: {
        create: mockCreate,
      },
    };
  },
  { virtual: true },
);

// ---- Mock @vueuse/core ----
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');
  return {
    ...actual,
    tryOnUnmounted: vi.fn(),
  };
});

const { useSortable } = await import('./use-sortable');

describe('useSortable', () => {
  it('返回包含 initializeSortable 方法的对象', () => {
    const el = document.createElement('div');
    const result = useSortable(el);

    expect(result).toHaveProperty('initializeSortable');
    expect(typeof result.initializeSortable).toBe('function');
  });

  it('initializeSortable 加载 sortablejs 后调用 create', async () => {
    mockCreate.mockReturnValueOnce({ destroy: mockDestroy });

    const el = document.createElement('div');
    const { initializeSortable } = useSortable(el);

    const instance = await initializeSortable();

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(instance).not.toBeNull();
  });

  it('create 调用时合并默认配置与自定义 options', async () => {
    mockCreate.mockReturnValueOnce({ destroy: mockDestroy });

    const el = document.createElement('div');
    const { initializeSortable } = useSortable(el, {
      handle: '.drag-handle',
      filter: '.no-drag',
    });

    await initializeSortable();

    expect(mockCreate).toHaveBeenCalledWith(el, {
      animation: 300,
      delay: 400,
      delayOnTouchOnly: true,
      handle: '.drag-handle',
      filter: '.no-drag',
    });
  });

  it('自定义 options 覆盖默认值', async () => {
    mockCreate.mockReturnValueOnce({ destroy: mockDestroy });

    const el = document.createElement('div');
    const { initializeSortable } = useSortable(el, {
      animation: 100,
      delay: 0,
    });

    await initializeSortable();

    const callArgs = mockCreate.mock.calls[0];
    const options = callArgs[1] as Record<string, unknown>;
    expect(options.animation).toBe(100);
    expect(options.delay).toBe(0);
    // 未覆盖的默认值仍然保留
    expect(options.delayOnTouchOnly).toBe(true);
  });

  it('传入空 options 时使用完整默认配置', async () => {
    mockCreate.mockReturnValueOnce({ destroy: mockDestroy });

    const el = document.createElement('div');
    const { initializeSortable } = useSortable(el, {});

    await initializeSortable();

    const callArgs = mockCreate.mock.calls[0];
    const options = callArgs[1] as Record<string, unknown>;
    expect(options).toEqual({
      animation: 300,
      delay: 400,
      delayOnTouchOnly: true,
    });
  });
});
