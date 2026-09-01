<!--
 * 分隔线：按 orientation 切换横竖两种尺寸，可选在中间带一段文字。
 *
 * 带文字时以相对定位叠加一个居中块并留出左右内边距，
 * 而不是用 flex 三段式布局 —— 后者在竖排方向无法复用，会多出一倍的分支样式。
 * shrink-0 是必需的：放进 flex 容器时分隔线会被压缩成 0 而不可见。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\separator\Separator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SeparatorProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Separator } from 'radix-vue';

const props = defineProps<SeparatorProps & { class?: any; label?: string }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <Separator
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-border relative shrink-0',
        props.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        props.class,
      )
    "
  >
    <span
      v-if="props.label"
      :class="
        cn(
          'text-muted-foreground bg-background absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xs',
          props.orientation === 'vertical'
            ? 'w-[1px] px-1 py-2'
            : 'h-[1px] px-2 py-1',
        )
      "
    >
      {{ props.label }}
    </span>
  </Separator>
</template>
