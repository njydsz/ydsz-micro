<script lang="ts" setup>
/**
* 输入框前后缀元素：用于包裹标签、按钮、选择器等内嵌内容。
* 
 * 对齐 Element Plus el-input-group__append / prepend 的视觉语义——
 * 灰色背景、300 边框、与输入框等高。
 * isPlain 模式去除左右内边距，使内容紧贴输入框，无需额外偏移修正。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\input-group\YdInputAddon.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { YdInputAddonProps } from './input-group-types.ts';

import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdInputAddon' });

const props = defineProps<YdInputAddonProps>();

/** 裸边模式：去除内边距，使内容紧贴输入框 */
const isPlainClasses = 'px-0 border-0 bg-transparent';

defineSlots<{
  default: () => any;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center px-3',
        'bg-neutral-100 dark:bg-neutral-800',
        'border border-neutral-300 dark:border-neutral-600',
        'text-sm text-neutral-600 dark:text-neutral-300',
        'shrink-0',
        // 兼容 group 内的圆角继承
        'first:rounded-l-md last:rounded-r-md',
        props.isPlain && isPlainClasses,
        props.class,
      )
    "
    role="presentation"
  >
    <slot />
  </div>
</template>
