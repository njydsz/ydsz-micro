/**
 * useChartTheme 测试 —— 验证 token 注入、明暗切换与主题名推导。
 *
 * @path comm\@core\ui-kit\chart-ui\src\composables\use-chart-theme.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { effectScope } from 'vue';

import { useChartTheme, withChartTheme } from './use-chart-theme';

describe('useChartTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('默认应读取根节点 .dark class', () => {
    document.documentElement.classList.add('dark');
    const scope = effectScope();
    const result = scope.run(() => useChartTheme());

    expect(result?.themeName.value).toBe('ydsz-dark');
    expect(result?.theme.value.dark).toBe(true);
    scope.stop();
  });

  it('未挂 .dark 时应使用亮色主题', () => {
    const scope = effectScope();
    const result = scope.run(() => useChartTheme());

    expect(result?.themeName.value).toBe('ydsz-light');
    expect(result?.theme.value.dark).toBe(false);
    scope.stop();
  });

  it('显式传入 dark 时应覆盖 DOM 推断', () => {
    document.documentElement.classList.add('dark');
    const scope = effectScope();
    const result = scope.run(() => useChartTheme({ dark: false }));

    expect(result?.themeName.value).toBe('ydsz-light');
    scope.stop();
  });

  it('主题色板应包含全部语义色', () => {
    const scope = effectScope();
    const result = scope.run(() => useChartTheme());

    expect(result?.theme.value.palette.primary).toContain('var(--ydsz-color-brand');
    expect(result?.theme.value.palette.success).toContain('var(--ydsz-color-success');
    expect(result?.theme.value.palette.warning).toContain('var(--ydsz-color-warning');
    expect(result?.theme.value.palette.destructive).toContain('var(--ydsz-color-destructive');
    expect(result?.theme.value.palette.neutral).toContain('var(--ydsz-color-neutral');
    scope.stop();
  });

  it('主题注册对象应包含调色板与文本色', () => {
    const scope = effectScope();
    const result = scope.run(() => useChartTheme());

    expect(result?.themeOption.value.color).toBeInstanceOf(Array);
    expect(
      (result?.themeOption.value.textStyle as Record<string, unknown>).color,
    ).toContain('var(--ydsz-text-primary');
    scope.stop();
  });

  it('根节点 class 变化时应响应式切换主题名', async () => {
    const scope = effectScope();
    const result = scope.run(() => useChartTheme());
    expect(result?.themeName.value).toBe('ydsz-light');

    document.documentElement.classList.add('dark');
    // MutationObserver 回调走微任务，需要等待其派发
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result?.themeName.value).toBe('ydsz-dark');
    scope.stop();
  });

  it('scope 停止后应断开 MutationObserver（不抛错）', () => {
    const scope = effectScope();
    scope.run(() => useChartTheme());
    expect(() => scope.stop()).not.toThrow();
  });
});

describe('withChartTheme', () => {
  it('应注入调色板与文本色', () => {
    const theme = {
      borderColor: 'var(--ydsz-border-default)',
      dark: false,
      palette: {
        colors: ['var(--ydsz-color-brand-500)', 'var(--ydsz-color-success-500)'],
        destructive: 'var(--ydsz-color-destructive-500)',
        neutral: 'var(--ydsz-color-neutral-500)',
        primary: 'var(--ydsz-color-brand-500)',
        success: 'var(--ydsz-color-success-500)',
        warning: 'var(--ydsz-color-warning-500)',
      },
      surfaceColor: 'var(--ydsz-surface-1)',
      surfaceColor2: 'var(--ydsz-surface-2)',
      textColor: 'var(--ydsz-text-primary)',
      textMutedColor: 'var(--ydsz-text-secondary)',
    };

    const result = withChartTheme<{ color?: string[]; grid: { top: number }; textStyle?: { color: string } }>(
      { grid: { top: 8 } },
      theme,
    );

    expect(result.color).toEqual(theme.palette.colors);
    expect(result.textStyle).toEqual({ color: theme.textColor });
    expect(result.grid).toEqual({ top: 8 });
  });

  it('不应覆盖调用方显式指定的颜色', () => {
    const theme = {
      borderColor: 'var(--ydsz-border-default)',
      dark: false,
      palette: {
        colors: ['var(--ydsz-color-brand-500)'],
        destructive: 'var(--ydsz-color-destructive-500)',
        neutral: 'var(--ydsz-color-neutral-500)',
        primary: 'var(--ydsz-color-brand-500)',
        success: 'var(--ydsz-color-success-500)',
        warning: 'var(--ydsz-color-warning-500)',
      },
      surfaceColor: 'var(--ydsz-surface-1)',
      surfaceColor2: 'var(--ydsz-surface-2)',
      textColor: 'var(--ydsz-text-primary)',
      textMutedColor: 'var(--ydsz-text-secondary)',
    };

    const result = withChartTheme<{ color?: string[] }>({ color: ['#fff'] }, theme);

    expect(result.color).toEqual(['#fff']);
  });
});
