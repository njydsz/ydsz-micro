/**
 * 按钮相关类型：按钮 props、按钮组 props 与通用渲染类型。
 *
 * CustomRenderType 允许字符串或渲染函数，用于按钮文案这类既可能静态也可能需
 * 动态生成的内容，避免为此再拆一个组件。
 * 按钮组 props 通过 Pick 从按钮 props 上选取公共项，保证两者不会各自漂移。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\button\button.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { cva } from 'class-variance-authority';

import type { AsTag } from '@ydsz-core/ydsz-vue';

import type { Component } from 'vue';

import type { ButtonVariants, ButtonVariantSize } from './types';

/**
 * 基础按钮的 props。
 *
 * @remarks
 * 在 shadcn 按钮样式变体之上补充了 `loading` 与多态渲染能力。
 * 注意 `loading` 与 `disabled` 是两个独立开关：置为 loading 并**不会自动禁用点击**，
 * 需要防重复提交时应同时设置二者。
 */
export interface YdButtonProps {
  /**
   * The element or component this component should render as. Can be overwrite by `asChild`
   * @defaultValue "div"
   */
  as?: AsTag | Component;
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   *
   * Read our [Composition](https://www.ydsz-vue.com/guides/composition.html) guide for more details.
   */
  asChild?: boolean;
  class?: any;
  disabled?: boolean;
  loading?: boolean;
  size?: ButtonVariantSize;
  variant?: ButtonVariants;
}

/**
 * 按钮文本的自定义渲染类型。
 *
 * @remarks
 * 传字符串按纯文本渲染；传函数则每次重渲染都会调用，可返回组件以实现图文混排，
 * 函数内应保持轻量且无副作用。
 */
export type CustomRenderType = (() => Component | string) | string;

/**
 * 按钮组选项的取值类型。
 *
 * @remarks
 * 限定为原始类型，因为选中态比较使用的是值相等而非引用相等；
 * 若传入对象将无法正确匹配选中项。同一组内应保持类型一致，
 * 混用数字 `1` 与字符串 `'1'` 会被视为不同的值。
 */
export type ValueType = boolean | number | string;

/**
 * 按钮组的 props，用于以按钮形态实现单选/多选。
 *
 * @remarks
 * 相比原生 Radio/YdCheckboxSmart，按钮组在筛选栏等场景下点击热区更大、视觉更紧凑。
 * 仅从 {@link YdButtonProps} 继承 `disabled`（作用于整组），
 * 其余按钮样式通过 `btnClass` 统一定制。
 */
export interface YdButtonGroupProps extends Pick<
  YdButtonProps,
  'disabled'
> {
  /** 单选模式下允许清除选中 */
  allowClear?: boolean;
  /** 值改变前的回调 */
  beforeChange?: (
    value: ValueType,
    isChecked: boolean,
  ) => boolean | PromiseLike<boolean | undefined> | undefined;
  /** 按钮样式 */
  btnClass?: any;
  /** 按钮间隔距离 */
  gap?: number;
  /** 多选模式下限制最多选择的数量。0表示不限制 */
  maxCount?: number;
  /** 是否允许多选 */
  multiple?: boolean;
  /** 选项 */
  options?: { [key: string]: any; label: CustomRenderType; value: ValueType }[];
  /** 显示图标 */
  showIcon?: boolean;
  /** 尺寸 */
  size?: 'large' | 'middle' | 'small';
}


/**
 * 按钮组件的 cva 样式变体（size 与 variant），返回类名生成函数。
 *
 * @remarks
 * 仅产出弹性布局与变体类名，具体尺寸/内边距由 size 变体与全局密度共同决定。
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium tracking-default transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        icon: 'size-8 rounded-md px-1 text-lg',
        lg: 'h-10 rounded-lg px-5 text-base',
        sm: 'h-8 rounded-md px-2.5 text-xs',
        xl: 'h-11 rounded-lg px-6 text-base',
        xs: 'h-7 w-7 rounded px-1 text-xs',
      },
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-raised hover:bg-primary-hover active:bg-primary-active',
        destructive:
          'bg-destructive text-destructive-foreground shadow-raised hover:bg-destructive-hover',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        heavy: 'hover:bg-heavy hover:text-heavy-foreground',
        icon: 'hover:bg-accent hover:text-accent-foreground text-text-secondary',
        link: 'text-primary underline-offset-4 hover:underline',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        subtle:
          'bg-primary-subtle text-primary-subtle-foreground hover:bg-brand-100 dark:hover:bg-brand-200',
      },
    },
  },
);
