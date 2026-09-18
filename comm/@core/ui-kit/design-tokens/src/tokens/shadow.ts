/**
 * 阴影 Design Token。
 *
 * <p>定义 5 级阴影高度（elevation），对应不同层级：
 * <ul>
 *   <li>flat — 平面（无阴影）</li>
 *   <li>low — 轻微浮起（卡片 / tag）</li>
 *   <li>medium — 悬浮（dropdown / popover）</li>
 *   <li>high — 显著浮起（modal / drawer）</li>
 *   <li>overlay — 最高浮起（command palette / global search）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\shadow.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 阴影层级类型 */
export type ShadowLevel = 'flat' | 'low' | 'medium' | 'high' | 'overlay';

/** 阴影层级常量 */
export const SHADOW_LEVELS: readonly ShadowLevel[] = ['flat', 'low', 'medium', 'high', 'overlay'];

/** 阴影预设值（CSS box-shadow） */
export const SHADOW_PRESETS: Record<ShadowLevel, string> = {
  flat: 'none',
  low: '0 1px 2px 0 hsl(var(--ydsz-neutral-shadow) / 0.05), 0 1px 3px 0 hsl(var(--ydsz-neutral-shadow) / 0.1)',
  medium: '0 4px 6px -1px hsl(var(--ydsz-neutral-shadow) / 0.1), 0 2px 4px -2px hsl(var(--ydsz-neutral-shadow) / 0.1)',
  high: '0 10px 15px -3px hsl(var(--ydsz-neutral-shadow) / 0.1), 0 4px 6px -4px hsl(var(--ydsz-neutral-shadow) / 0.1)',
  overlay: '0 25px 50px -12px hsl(var(--ydsz-neutral-shadow) / 0.25), 0 0 0 1px hsl(var(--ydsz-neutral-shadow) / 0.05)',
};

/**
 * CSS 变量引用。
 *
 * @param level 阴影层级
 * @return 变量引用表达式
 */
export function shadowVar(level: ShadowLevel): string {
  return `var(--ydsz-shadow-${level})`;
}
