/**
 * @ydsz-core/mobile-bridge 包出口。
 *
 * <p>移动端/触摸体验桥接层——响应式断点 + 触摸手势 + 触摸目标规范。
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ===== 组合式 API =====
export { useResponsive, useTouch } from './composables';
export type { SwipeDirection } from './composables';

// ===== 断点常量 =====
export {
  Breakpoint,
  BREAKPOINT_CSS_VARS,
  TOUCH_TARGET,
  getBreakpointName,
} from './breakpoints';

export type { BreakpointName } from './breakpoints';
