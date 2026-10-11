<!--
 * 输入框组合容器：把输入框 / 按钮 / 标签 / 选择器组合成一行。
 *
 * 紧凑模式（compact）下相邻元素共享边框、首尾圆角单独保留，
 * 对齐 Ant Design a-input-group 的 compact 行为。
 * 基于 Primitive 容器，保留 as / asChild 能力，便于无障碍场景复用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\input-group\YdInputGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { YdInputGroupProps } from './input-group-types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { Primitive, useForwardProps } from '@ydsz-core/ydsz-vue';

defineOptions({ name: 'YdInputGroup' });

const props = defineProps<YdInputGroupProps>();

const delegatedProps = computed(() => {
  const { class: _class, compact: _compact, size: _size, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);

/** 尺寸类名映射：影响内部 input 的高度与字号 */
const sizeClasses: Record<NonNullable<YdInputGroupProps['size']>, string> = {
  sm: '[&>input]:h-8 [&>input]:px-2.5 [&>input]:py-1.5 [&>input]:text-xs',
  md: '[&>input]:h-10 [&>input]:px-3 [&>input]:py-2 [&>input]:text-sm',
  lg: '[&>input]:h-11 [&>input]:px-4 [&>input]:py-2.5 [&>input]:text-base',
};

defineSlots<{
  default: () => any;
}>();
</script>

<template>
  <Primitive
    v-bind="forwardedProps"
    :class="
      cn(
        'inline-flex items-center w-full',
        sizeClasses[props.size ?? 'md'],
        props.class,
      )
    "
    :data-compact="props.compact ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>

<style scoped>
/* 紧凑模式：相邻元素去除左侧边框 */
[data-compact] > :not(:first-child) {
  border-left: 0;
}

/* 紧凑模式：首个元素仅保留左侧圆角 */
[data-compact] > :first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

/* 紧凑模式：末个元素仅保留右侧圆角 */
[data-compact] > :last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* 紧凑模式：中间元素无圆角 */
[data-compact] > :not(:first-child):not(:last-child) {
  border-radius: 0;
}
</style>
