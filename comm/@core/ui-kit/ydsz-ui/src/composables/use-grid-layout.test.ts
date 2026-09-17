/**
 * useGridLayout composable 测试 —— 响应式网格布局状态机。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-grid-layout.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import { useGridItem, useGridProvider } from './use-grid-layout';

describe('useGridLayout', () => {
  it('useGridProvider 应返回默认上下文', () => {
    const ctx = useGridProvider();
    expect(ctx.currentBreakpoint.value).toBe('md');
    expect(ctx.resolvedRowGap).toBe('16px');
    expect(ctx.resolvedColumnGap).toBe('16px');
  });

  it('useGridProvider 应支持自定义间距字符串', () => {
    const ctx = useGridProvider({ columnGap: '2rem', rowGap: '1.5rem' });
    expect(ctx.resolvedRowGap).toBe('1.5rem');
    expect(ctx.resolvedColumnGap).toBe('2rem');
  });

  it('useGridItem 应返回正确的 gridColumn 样式', () => {
    useGridProvider({ columns: 12 });
    const item = useGridItem({ span: 6 });
    expect(item.gridColumn).toContain('span 6');
  });

  it('useGridItem 支持偏移', () => {
    useGridProvider({ columns: 12 });
    const item = useGridItem({ offset: 2, span: 4 });
    expect(item.gridColumn).toContain('3 / span 4');
  });
});
