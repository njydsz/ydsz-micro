/**
 * useMobileAdaptive composable 测试。
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\composables\use-mobile-adaptive.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';

import { useMobileAdaptive } from './use-mobile-adaptive';

describe('useMobileAdaptive', () => {
  it('返回 isMobile 和 isDesktop 计算属性', () => {
    const { isMobile, isDesktop } = useMobileAdaptive();

    expect(isMobile.value).toBeDefined();
    expect(isDesktop.value).toBeDefined();
    expect(typeof isMobile.value).toBe('boolean');
    expect(typeof isDesktop.value).toBe('boolean');
  });

  it('isMobile 和 isDesktop 互斥', () => {
    const { isMobile, isDesktop } = useMobileAdaptive();

    expect(isMobile.value).toBe(!isDesktop.value);
  });

  it('adaptive 函数根据设备类型返回值', () => {
    const { adaptive } = useMobileAdaptive();

    const result = adaptive('mobile-value', 'desktop-value');
    expect(result.value).toBeDefined();
    expect(['mobile-value', 'desktop-value']).toContain(result.value);
  });

  it('adaptiveSize 返回尺寸 class', () => {
    const { adaptiveSize } = useMobileAdaptive();

    const sizes = { sm: 'size-8', md: 'size-10', lg: 'size-12' };
    const result = adaptiveSize(sizes);

    expect(result.value).toMatch(/^size-/);
  });

  it('adaptiveSpacing 返回间距 class', () => {
    const { adaptiveSpacing } = useMobileAdaptive();

    const spacing = { sm: 'gap-1', md: 'gap-2', lg: 'gap-4' };
    const result = adaptiveSpacing(spacing);

    expect(result.value).toMatch(/^gap-/);
  });

  it('touchTargetCompliant 返回布尔值', () => {
    const { touchTargetCompliant } = useMobileAdaptive();

    expect(typeof touchTargetCompliant.value).toBe('boolean');
  });

  it('suggestedTouchSize 返回数字', () => {
    const { suggestedTouchSize } = useMobileAdaptive();

    expect(typeof suggestedTouchSize.value).toBe('number');
    expect(suggestedTouchSize.value).toBeGreaterThan(0);
  });

  it('safeAreaPadding 返回字符串', () => {
    const { safeAreaPaddingBottom, safeAreaPaddingTop } = useMobileAdaptive();

    expect(typeof safeAreaPaddingTop.value).toBe('string');
    expect(typeof safeAreaPaddingBottom.value).toBe('string');
  });
});
