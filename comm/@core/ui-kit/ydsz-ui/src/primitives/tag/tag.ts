/**
 * Tag 标签的 CVA 变体定义：语义色 × 展示模式双维度组合。
 *
 * 展示模式：solid（实心）/ soft（柔和底色）/ outline（边框）。
 * 语义色：default / primary / success / warning / destructive / info。
 *
 * @module primitives/tag/tag
 * @author ydsz-team
 * @since 1.0.0
 */

import { cva } from 'class-variance-authority';

/**
 * Tag 变体类生成器。
 */
export const tagVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
        primary:
          'text-primary-foreground bg-primary dark:bg-primary dark:text-primary-foreground',
        success: 'bg-success-50 text-success-500 dark:bg-success-50 dark:text-success-500',
        warning:
          'bg-warning-50 text-warning-500 dark:bg-warning-50 dark:text-warning-500',
        destructive:
          'bg-destructive-50 text-destructive-500 dark:bg-destructive-50 dark:text-destructive-500',
        info: 'bg-brand-50 text-brand-500 dark:bg-brand-50 dark:text-brand-500',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    compoundVariants: [
      // outline 模式覆盖
    ],
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

/** Tag 变体类型 */
export type TagVariants = Parameters<typeof tagVariants>[0];
