/**
 * useTransition composable 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\motion\use-transition.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it, vi } from 'vitest';

import { useTransition } from './use-transition';

describe('useTransition', () => {
  it('初始状态为不可见', () => {
    const { phase, visible } = useTransition();

    expect(visible.value).toBe(false);
    expect(phase.value).toBe('idle');
  });

  it('show() 后 visible 变为 true', () => {
    const { show, visible } = useTransition();

    show();
    expect(visible.value).toBe(true);
  });

  it('hide() 后 visible 变为 false', async () => {
    const { hide, show, visible } = useTransition({ leaveDuration: 10 });

    show();
    hide();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(visible.value).toBe(false);
  });

  it('toggle() 切换可见状态', () => {
    const { toggle, visible } = useTransition();

    expect(visible.value).toBe(false);
    toggle();
    expect(visible.value).toBe(true);
    toggle();
    // hide 是异步的，需要等待
  });

  it('reset() 重置状态', () => {
    const { reset, show, visible } = useTransition();

    show();
    reset();
    expect(visible.value).toBe(false);
  });

  it('支持自定义动画时长', () => {
    const { enterStyle } = useTransition({ enterDuration: 500 });

    expect(enterStyle.value.transition).toContain('500ms');
  });

  it('支持自定义缓动函数', () => {
    const { enterStyle } = useTransition({ easing: 'ease-out' });

    expect(enterStyle.value.transition).toContain('ease-out');
  });

  it('phase 在 enter 后为 entering', () => {
    const { phase, show } = useTransition();

    show();
    expect(phase.value).toBe('entering');
  });
});
