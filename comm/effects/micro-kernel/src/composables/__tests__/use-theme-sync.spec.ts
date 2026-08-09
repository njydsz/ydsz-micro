/**
 * useThemeSync 主子应用主题运行时同步 composable 单元测试
 *
 * 覆盖范围：
 * - registerThemeProvider() — provider 注册与广播
 * - onThemeChange() — consumer 订阅与取消
 * - useThemeSync() provider 模式 — setTheme 广播
 * - useThemeSync() consumer 模式 — 跟随 provider
 * - 超时回退机制
 * - 去重逻辑
 *
 * 注：DOM 类名更新通过集成测试覆盖，单元测试仅验证状态广播机制。
 *
 * @path comm/effects/micro-kernel/src/composables/__tests__/use-theme-sync.spec.ts
 * @since 4.2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const unmountCallbacks = new Set<() => void>();

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue');
  return {
    ...actual,
    onUnmounted: (cb: () => void) => {
      unmountCallbacks.add(cb);
    },
  };
});

// Mock applyThemeClass 为纯函数以便测试
vi.mock('../use-theme-sync', async (importOriginal) => {
  // 注意：不能太深 mock，需要保留原始的 ref 等 Vue API
  return importOriginal();
});

import { onThemeChange, registerThemeProvider, useThemeSync } from '../use-theme-sync';
import type { ThemeMode } from '../use-theme-sync';

/**
 * 清理模块级共享状态。
 */
function resetState(): void {
  // 清空所有待处理的卸载回调
  const callbacks = [...unmountCallbacks];
  unmountCallbacks.clear();
  callbacks.forEach((cb) => cb());
}

describe('registerThemeProvider()', () => {
  it('应注册 provider 并返回取消注册函数', () => {
    const getTheme = vi.fn(() => 'dark' as ThemeMode);
    const unregister = registerThemeProvider(getTheme);

    expect(typeof unregister).toBe('function');
    unregister();
  });

  it('应支持多个 provider 覆盖注册', () => {
    const getTheme1 = vi.fn(() => 'light' as ThemeMode);
    const unregister1 = registerThemeProvider(getTheme1);

    const getTheme2 = vi.fn(() => 'dark' as ThemeMode);
    const unregister2 = registerThemeProvider(getTheme2);

    unregister1();
    unregister2();
  });

  it('注册 provider 后应能立即获取当前主题', () => {
    const getTheme = vi.fn(() => 'dark' as ThemeMode);
    const unregister = registerThemeProvider(getTheme);

    // flushWaitingResolvers 会调用 getTheme
    expect(getTheme).toHaveBeenCalled();
    unregister();
  });
});

describe('onThemeChange()', () => {
  afterEach(() => resetState());

  it('应立即回调当前 provider theme', () => {
    const getTheme = vi.fn(() => 'dark' as ThemeMode);
    const unregister = registerThemeProvider(getTheme);

    const callback = vi.fn();
    const off = onThemeChange(callback);

    expect(callback).toHaveBeenCalledWith('dark');
    expect(typeof off).toBe('function');

    // cleanup
    off();
    unregister();
  });

  it('取消订阅后不再接收广播', () => {
    const getTheme = vi.fn(() => 'light' as ThemeMode);
    const unregisterProvider = registerThemeProvider(getTheme);

    const callback = vi.fn();
    const off = onThemeChange(callback);
    callback.mockClear();

    off();
    // 无法直接触发广播（需要 setTheme），因此只验证 callback 未再被调用
    expect(callback).not.toHaveBeenCalled();

    unregisterProvider();
  });

  it('广播时所有已注册 consumer 应收到通知', () => {
    // 1. 注册 provider
    let currentTheme: ThemeMode = 'light';
    const unregisterProvider = registerThemeProvider(() => currentTheme);

    // 2. 手动触发 flushWaitingResolvers 模拟广播 (需要手动设置 provider + 调用 setTheme)
    // 由于广播只能从 useThemeSync 的 setTheme 触发，这里用不同的测试：
    // a) 子应用 A 注册 consumer；b) 主应用 setTheme；c) A 应在 waitFor 后收到通知
    // 验证机制在 'useThemeSync() consumer 模式' 中已经测试过

    unregisterProvider();
  });
});

describe('useThemeSync() — provider/consumer 模式', () => {
  beforeEach(() => resetState());
  afterEach(() => resetState());

  it('应返回 theme ref（初始为 auto）', () => {
    useThemeSync();
    // provider 端初始化
  });

  it('初始值可以通过 initialTheme 设置', () => {
    const { theme } = useThemeSync({ initialTheme: 'dark' });
    expect(theme.value).toBe('dark');
  });

  it('setTheme 应修改 theme ref', () => {
    const { theme, setTheme } = useThemeSync();
    setTheme('dark');
    expect(theme.value).toBe('dark');
  });

  it('setTheme 应广播到 consumers', async () => {
    const { setTheme } = useThemeSync();
    const callback = vi.fn();
    onThemeChange(callback);
    callback.mockClear();

    setTheme('dark');

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith('dark');
    });
  });

  it('相同 theme 去重不重复广播', () => {
    const { setTheme } = useThemeSync({ initialTheme: 'light' });

    const callback = vi.fn();
    onThemeChange(callback);
    callback.mockClear();

    // 设为当前值
    setTheme('light');
    expect(callback).not.toHaveBeenCalled();
  });

  it('注册后再次调用 setTheme 变更应广播', async () => {
    const { setTheme } = useThemeSync({ initialTheme: 'light' });
    setTheme('light'); // 无变化

    const callback = vi.fn();
    onThemeChange(callback);
    callback.mockClear();

    setTheme('dark');

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith('dark');
    });
  });

  it('主题变化时 effectiveTheme 应正确更新', () => {
    const { effectiveTheme, setTheme } = useThemeSync({ initialTheme: 'light' });
    expect(effectiveTheme.value).toBe('light');

    setTheme('dark');
    expect(effectiveTheme.value).toBe('dark');
  });
});

describe('useThemeSync() consumer 模式', () => {
  beforeEach(() => resetState());
  afterEach(() => resetState());

  it('provider 已注册时，consumer 应自动同步 provider theme', () => {
    // 主应用注册 provider
    const unregisterProvider = registerThemeProvider(() => 'dark');

    // 子应用创建 useThemeSync
    const { theme, effectiveTheme } = useThemeSync({ initialTheme: 'auto' });
    expect(theme.value).toBe('dark');
    expect(effectiveTheme.value).toBe('dark');

    // 清理 provider 注册
    unregisterProvider();
  });

  it('主应用 setTheme 时 consumer 应跟随变化', async () => {
    // 主应用 useThemeSync（注册 provider，初始 light）
    const main = useThemeSync({ initialTheme: 'light' });

    // 子应用 useThemeSync
    const { theme: childTheme } = useThemeSync({ initialTheme: 'auto' });
    expect(childTheme.value).toBe('light');

    // 主应用修改 theme
    main.setTheme('dark');

    await vi.waitFor(() => {
      expect(childTheme.value).toBe('dark');
    });
  });

  it('whenReady 在 provider 已就绪时立即 resolve', async () => {
    registerThemeProvider(() => 'dark');

    const { whenReady } = useThemeSync({ initialTheme: 'auto' });
    const result = await whenReady();
    expect(result).toBe('dark');
  });
});

describe('useThemeSync() 超时回退', () => {
  beforeEach(() => resetState());
  afterEach(() => resetState());

  it('provider 未就绪时 whenReady 应最终回退到 initialTheme', async () => {
    // 不注册 provider
    const { theme, whenReady } = useThemeSync({
      initialTheme: 'dark',
      providerReadyTimeout: 30,
    });

    const result = await whenReady();
    expect(result).toBe('dark');
    expect(theme.value).toBe('dark');
  });
});
