// cspell:words YDIZ
/**
 * useTheme composable 测试 —— 验证 token 读写 / preset 应用 / dark 切换
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\use-theme.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { themeTokens, tokensByCategory } from './theme-schema';
import { useTheme } from './use-theme';

// 模拟 DOM 环境
let mockStyle: { removeProperty: ReturnType<typeof vi.fn>; setProperty: ReturnType<typeof vi.fn> };
let mockClassList: {
  add: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  toggle: ReturnType<typeof vi.fn>;
};
let mockElement: HTMLElement;

beforeEach(() => {
  mockStyle = {
    removeProperty: vi.fn(),
    setProperty: vi.fn(),
  };
  mockClassList = {
    add: vi.fn(),
    contains: vi.fn(() => false),
    remove: vi.fn(),
    toggle: vi.fn(),
  };
  mockElement = {
    classList: mockClassList,
    style: mockStyle,
  } as unknown as HTMLElement;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('theme-schema', () => {
  it('应包含全部核心语义色 token', () => {
    expect(themeTokens.primary).toBeDefined();
    expect(themeTokens.background).toBeDefined();
    expect(themeTokens.foreground).toBeDefined();
    expect(themeTokens.destructive).toBeDefined();
  });

  it('dark 模式下的 background 应有 darkValue', () => {
    expect(themeTokens.background.darkValue).toBeDefined();
    expect(themeTokens.background.darkValue).not.toBe(themeTokens.background.defaultValue);
  });

  it('tokensByCategory 应正确分组', () => {
    expect(Object.keys(tokensByCategory)).toContain('color');
    expect(Object.keys(tokensByCategory)).toContain('size');
    expect(Object.keys(tokensByCategory)).toContain('typography');
  });
});

describe('useTheme', () => {
  it('set 应写入 CSS 变量到根元素', () => {
    const handle = useTheme({ rootElement: mockElement });
    handle.set('primary', '210 40% 50%');
    expect(mockStyle.setProperty).toHaveBeenCalledWith('--primary', '210 40% 50%');
  });

  it('get 应返回已设置的值', () => {
    const handle = useTheme({ rootElement: mockElement });
    handle.set('primary', '123');
    expect(handle.get('primary')).toBe('123');
  });

  it('不存在的 token 不应写入并应打印警告', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = useTheme({ rootElement: mockElement });
    // @ts-expect-error 测试未知 token 的容错
    handle.set('non-existent-token', 'value');
    expect(mockStyle.setProperty).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('bulk 应批量写入所有 token 且仅对应次数的 DOM 操作', () => {
    const handle = useTheme({ rootElement: mockElement });
    handle.bulk({
      primary: '1',
      radius: '0.5rem',
    });
    expect(mockStyle.setProperty).toHaveBeenCalledTimes(2);
  });

  it('toggleDark 应切换根元素的 dark class', () => {
    const handle = useTheme({ rootElement: mockElement });
    handle.toggleDark(true);
    expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true);
    handle.toggleDark(false);
    expect(mockClassList.toggle).toHaveBeenCalledWith('dark', false);
  });

  it('reset 应清除所有已覆盖的 token', () => {
    const handle = useTheme({ rootElement: mockElement });
    handle.set('primary', 'test');
    handle.set('radius', '0.5rem');
    handle.reset();
    expect(mockStyle.removeProperty).toHaveBeenCalledTimes(2);
  });

  it('overrideCount 应返回已覆盖的数量', () => {
    const handle = useTheme({ rootElement: mockElement });
    expect(handle.overrideCount()).toBe(0);
    handle.set('primary', 'test');
    expect(handle.overrideCount()).toBe(1);
  });
});
