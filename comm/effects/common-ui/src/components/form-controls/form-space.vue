<!--
 * 表单间距容器：ElSpace 等价物，flex + gap 的受控封装。
 *
 * 仅覆盖表单场景最常用的水平/垂直间距；复杂布局应直接使用
 * Tailwind class（云顶规范：不过度封装布局原语）。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-space.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const props = withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical';
    gap?: number;
    wrap?: boolean;
  }>(),
  {
    direction: 'horizontal',
    gap: 8,
    wrap: false,
  },
);

const gapStyle = computed(() => ({ gap: `${props.gap}px` }));
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center',
        props.direction === 'vertical' ? 'flex-col' : 'flex-row',
        props.wrap && 'flex-wrap',
      )
    "
    :style="gapStyle"
  >
    <slot></slot>
  </div>
</template>
