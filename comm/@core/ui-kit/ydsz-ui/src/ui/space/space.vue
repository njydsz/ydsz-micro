<!--
 * Space 组件 —— 受控、等距、可换行的子元素布局容器。
 *
 * 对标 Naive UI n-space：按统一间距在单行（或换行）上排列子元素，
 * 选项控制方向 / 对齐 / 填充，避免每个调用方手写一堆 `class="flex items-center gap-2"`。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\space\space.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';

import type { SpaceProps, SpaceSize } from './space-types';

defineOptions({ name: 'YdSpace' });

const props = withDefaults(defineProps<SpaceProps>(), {
  size: 8,
  direction: 'horizontal',
  wrap: false,
  fill: false,
});

/**
 * 解析 size 为 CSS gap 字符串。
 *
 * - number: 两个方向都为 N px
 * - string: 两个方向都为字符串
 * - [number, number]: [水平, 垂直]
 *
 * 两个方向一致时合并为单一值。
 */
const resolvedGap = computed(() => {
  const size: SpaceSize = props.size;

  let row: string;
  let col: string;

  if (Array.isArray(size)) {
    row = `${size[0]}px`;
    col = `${size[1]}px`;
  } else if (typeof size === 'number') {
    row = col = `${size}px`;
  } else {
    row = col = size;
  }

  return row === col ? row : `${row} ${col}`;
});

/**
 * 将 props.align 映射为 CSS align-items 值。
 *
 * undefined 时不输出样式（走 flex 默认 stretch）。
 */
const alignMap: Record<NonNullable<SpaceProps['align']>, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
};

const resolvedAlign = computed(() =>
  props.align ? alignMap[props.align] : undefined,
);
</script>

<template>
  <div
    class="yd-space"
    :class="{
      'yd-space--vertical': direction === 'vertical',
      'yd-space--wrap': wrap,
      'yd-space--fill': fill,
    }"
    :style="{
      gap: resolvedGap,
      'align-items': resolvedAlign,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.yd-space {
  display: inline-flex;
  flex-direction: row;
}

.yd-space--vertical {
  flex-direction: column;
}

.yd-space--wrap {
  flex-wrap: wrap;
}

.yd-space--fill {
  display: flex;
  width: 100%;
}

.yd-space--fill > :deep(*) {
  flex: 1;
}
</style>
