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

/**
 * 徽标组件的样式变体入参类型，由 `badgeVariants` 的 cva 配置自动推导。
 *
 * 各 variant 取值按「语义」而非色值选择，深浅色主题下对比度由设计令牌保证：
 *  - `default`：中性灰底无语义倾向（默认），用于普通标签、计数、版本号；
 *  - `primary`：品牌主色浅底，用于「进行中 / 当前生效」等需强调的状态；
 *  - `destructive`：危险色，用于失败、已删除、校验不通过；
 *  - `success` / `warning` / `info`：成功 / 警告 / 信息提示；三者使用透明底色
 *    （`bg-*-500/10`）以便叠加在已有背景色的卡片或表格行上而不显突兀；
 *  - `secondary`：次级灰，用于与 `default` 并置时的次要标签；
 *  - `outline`：仅描边无底色，用于密集表格中降低视觉噪音。
 *
 * 使用场景：状态色只作辅助表达、不应成为唯一信息载体，`success` 与 `warning`
 * 对色觉障碍用户难以区分，必须同时提供文字或 `aria-label`。
 */
export type BadgeVariants = VariantProps<typeof badgeVariants>;
