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

/**
 * 头像组件的样式变体入参类型，由 `avatarVariant` 的 cva 配置自动推导。
 *
 * 各变体取值含义：
 *  - `shape`：`circle` 圆形（默认），用于自然人头像；`square` 圆角方形，
 *    用于团队 / 应用 / 组织等非人实体，与圆形在视觉上区分「人」与「物」。
 *  - `size`：`xs`(24px) / `sm`(32px，默认) / `base`(40px) / `lg`(48px) /
 *    `xl`(64px) / `2xl`(96px) / `3xl`(128px)；字号随尺寸联动（如 `3xl` 配 `text-5xl`），
 *    避免大头像里的 fallback 文字显得过小。
 *
 * 使用场景：外部覆写 class 时必须经 `cn()`（内部走 tailwind-merge）合并。
 * 因为 `defaultVariants` 会先输出 `h-8 w-8 text-sm`，若改用模板字符串拼接，
 * 自定义 size 会与默认 size 同时出现在 class 列表中，最终由 CSS 声明顺序决定胜负，
 * 结果随打包顺序漂移而不可预期。
 */
export type AvatarVariants = VariantProps<typeof avatarVariant>;
