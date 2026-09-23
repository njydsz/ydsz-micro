<!--
 * Timeline 时间轴：按时间顺序展示事件流。
 *
 * 支持 dot、pending、reverse 三种变体。
 * 子组件 YdTimelineItem 渲染单个事件节点，color / dot 支持自定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\timeline\YdTimeline.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** pending 节点文案 */
  pending?: string;
  /** 是否显示 pending 脉冲动画 */
  pendingDot?: boolean;
  /** 是否反转排序 */
  reverse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pendingDot: true,
  reverse: false,
});

const itemsClass = computed(() => {
  return props.reverse ? 'flex-col-reverse' : 'flex-col';
});
</script>

<template>
  <ol :class="cn('flex flex-col', itemsClass, props.class)" role="list" aria-label="时间轴">
    <slot></slot>
    <!-- pending 占位 -->
    <li v-if="props.pending" class="flex items-start gap-3">
      <div class="flex flex-col items-center">
        <span
          :class="
            cn(
              'block size-3 rounded-full border',
              props.pendingDot
                ? 'border-primary bg-primary/20 animate-pulse'
                : 'bg-neutral-300 border-neutral-300 dark:bg-neutral-600 dark:border-neutral-600',
            )
          "
        ></span>
        <span class="h-6 w-px bg-neutral-200 dark:bg-neutral-700"></span>
      </div>
      <p class="text-muted-foreground pt-0.5 text-sm italic">{{ props.pending }}</p>
    </li>
  </ol>
</template>
