/**
 * avatar 模块 - 现代化头像样式
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\avatar\avatar.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

/** 头像组件的 cva 样式变体（shape 与 size），返回类名生成函数 */
export const avatarVariant = cva(
  "relative inline-flex items-center justify-center font-medium text-foreground select-none shrink-0 bg-muted overflow-hidden ring-1 ring-border-subtle",
  {
    variants: {
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
      },
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        base: "h-10 w-10 text-base",
        lg: "h-12 w-12 text-lg",
        xl: "h-16 w-16 text-2xl",
        "2xl": "h-24 w-24 text-3xl",
        "3xl": "h-32 w-32 text-5xl",
      },
    },
    defaultVariants: {
      shape: "circle",
      size: "sm",
    },
  },
);

export type AvatarVariants = VariantProps<typeof avatarVariant>;
