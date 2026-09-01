/**
 * 侧边面板的 cva 样式变体：按 side（滑出方位）产出定位与进出场动画类名，默认从右侧滑出。
 *
 * 四个方位各自绑定成对的 slide-in / slide-out 类：
 * 少了 out 方向，关闭时面板会直接消失，看起来像是被卸载而不是滑走。
 * 左右两侧宽度取 3/4、上下两侧铺满横向，是移动端抽屉的常见配比；
 * 关闭动画比打开动画快（300ms vs 500ms），因为用户对「让它消失」的等待更不耐烦。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\sheet.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';

/** 侧边面板（Sheet）的 cva 样式变体（side 滑出方位），返回类名生成函数 */
export const sheetVariants = cva(
  'bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 border-border',
  {
    defaultVariants: {
      side: 'right',
    },
    variants: {
      side: {
        bottom:
          'inset-x-0 bottom-0 border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left ',
        right:
          'inset-y-0 right-0 w-3/4 border-l  data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
      },
    },
  },
);

/**
 * 侧边面板（Sheet）的样式变体入参类型，目前仅含 `side`（滑出方位）。
 *
 * @remarks
 * 由 cva 从 `sheetVariants` 自动推导。方位不只决定动画方向，也决定尺寸约束：
 * 左右方位固定宽度为 `3/4` 屏宽、高度铺满；上下方位则横向铺满、高度由内容撑开。
 * 因此切换方位后原有的尺寸预期可能不再成立。未指定时默认从右侧滑出。
 */
export type SheetVariants = VariantProps<typeof sheetVariants>;
