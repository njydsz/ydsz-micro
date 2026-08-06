/**
 * button 模块 - 现代化按钮样式
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\button\button.ts
 * @author remi-team
 * @since 1.0.0
 */
import { cva } from "class-variance-authority";

/** 按钮组件的 cva 样式变体（size 与 variant），返回类名生成函数 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium tracking-default transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-4 py-2",
        icon: "size-8 rounded-md px-1 text-lg",
        lg: "h-10 rounded-lg px-5 text-base",
        sm: "h-8 rounded-md px-2.5 text-xs",
        xl: "h-11 rounded-lg px-6 text-base",
        xs: "h-7 w-7 rounded px-1 text-xs",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-raised hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground shadow-raised hover:bg-destructive-hover",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        heavy: "hover:bg-heavy hover:text-heavy-foreground",
        icon: "hover:bg-accent hover:text-accent-foreground text-text-secondary",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        subtle:
          "bg-primary-subtle text-primary-subtle-foreground hover:bg-brand-100 dark:hover:bg-brand-200",
      },
    },
  },
);
