/**
 * badge 模块 - 现代化徽标样式（含状态色语义）
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\badge\badge.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VariantProps } from "class-variance-authority";

import { cva } from "class-variance-authority";

/** 徽标组件的 cva 样式变体，返回类名生成函数 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors tracking-default",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border border-border-subtle bg-accent text-accent-foreground",
        primary:
          "border-transparent bg-primary-subtle text-primary-subtle-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
        outline: "border border-border text-text-secondary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success:
          "border-transparent bg-success-500/10 text-success-600 dark:text-success-500",
        warning:
          "border-transparent bg-warning-500/10 text-warning-600 dark:text-warning-500",
        info: "border-transparent bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
      },
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
