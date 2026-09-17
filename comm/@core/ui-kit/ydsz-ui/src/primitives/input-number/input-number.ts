/**
 * YdInputNumber 数字输入框的 CVA 变体定义。
 *
 * @module primitives/input-number
 * @author ydsz-team
 * @since 5.6.0
 */
import { cva } from 'class-variance-authority';

/**
 * 尺寸变体。
 */
export const inputNumberVariants = cva(
  'relative inline-flex items-stretch',
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'h-9',
        large: 'h-11',
        small: 'h-8 text-sm',
      },
    },
  },
);

/**
 * 输入框尺寸类映射。
 */
export const inputNumberInputVariants = cva(
  'border-y px-3 text-center outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: '',
        large: 'h-11',
        small: 'h-8 text-sm',
      },
    },
  },
);

/**
 * 增减按钮尺寸类映射。
 */
export const inputNumberBtnVariants = cva(
  'flex items-center justify-center border px-2 transition-colors',
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: '',
        large: 'h-11',
        small: 'h-8 text-sm',
      },
    },
  },
);

/** 尺寸变体类型 */
export type InputNumberSize = 'default' | 'large' | 'small';
