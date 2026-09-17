<!--
 * Space 间距：控制组件间水平 / 垂直间距。
 *
 * 与 Ant Design Space 对齐：
 * - 默认水平排列，vertical 时切换为 flex-col
 * - 大尺寸不破坏对齐：使用 margin-bottom 负值对齐
 * - wrap 模式下子项自动换行，竖向间距同样生效
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\space\YdSpace.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

type SpaceSize = 'large' | 'middle' | 'small' | number;

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 对齐方式 */
  align?: 'baseline' | 'center' | 'end' | 'start';
  /** 是否渲染为块级 wrapper */
  block?: boolean;
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 尺寸 */
  size?: SpaceSize | [SpaceSize, SpaceSize];
  /** 是否换行 */
  wrap?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  align: undefined,
  block: false,
  direction: 'horizontal',
  size: 'small',
  wrap: false,
});

const sizeMap: Record<string, number> = {
  small: 8,
  middle: 16,
  large: 24,
};

function resolveSize(size: SpaceSize): number {
  if (typeof size === 'number') return size;
  return sizeMap[size] ?? 8;
}

const [horizontalSize, verticalSize] = Array.isArray(props.size)
  ? [resolveSize(props.size[0]), resolveSize(props.size[1])]
  : [resolveSize(props.size), resolveSize(props.size)];

const alignClass: Record<string, string> = {
  baseline: 'items-baseline',
  center: 'items-center',
  end: 'items-end',
  start: 'items-start',
};
</script>

<template>
  <div
    :class="
      cn(
        'flex',
        props.direction === 'vertical' ? 'flex-col' : 'flex-row',
        props.align ? alignClass[props.align] : '',
        props.wrap && 'flex-wrap',
        props.block && 'w-full',
        props.class,
      )
    "
    :style="
      props.direction === 'vertical'
        ? { rowGap: `${verticalSize}px` }
        : {
            columnGap: `${horizontalSize}px`,
            rowGap: props.wrap ? `${verticalSize}px` : undefined,
          }
    "
    role="presentation"
  >
    <slot></slot>
  </div>
</template>
