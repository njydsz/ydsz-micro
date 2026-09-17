<!--
 * Timeline 时间轴：按时间顺序展示事件流。
 *
 * 支持 dot / pending / reverse / position 四种变体。
 * 子组件 YdTimelineItem 渲染单个事件节点，color / dot 支持自定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\timeline\YdTimeline.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed, provide } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const TIMELINE_INJECTION_KEY = Symbol('ydsz-timeline');

/** 时间轴位置 */
export type TimelinePosition = 'alternate' | 'bottom' | 'left' | 'right';
/** 时间轴模式 */
export type TimelineMode = 'left' | 'alternate' | 'right';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** pending 节点文案 */
  pending?: string;
  /** 是否显示 pending 尾巴动画 */
  pendingDot?: boolean;
  /** 时间轴位置 */
  position?: TimelineMode;
  /** 是否反转排序 */
  reverse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pendingDot: true,
  position: 'right',
  reverse: false,
});

const items = computed(() => (props.reverse ? 'flex-col-reverse' : 'flex-col'));

provide(TIMELINE_INJECTION_KEY, {
  position: computed(() => props.position),
});
</script>

<template>
  <ol
    :class="cn('flex flex-col', items, props.class)"
    role="list"
    aria-label="时间轴"
  >
    <slot></slot>
    <!-- pending 占位 -->
    <li v-if="props.pending" class="flex items-start gap-3">
      <div class="flex flex-col items-center">
        <span
          :class="
            cn(
              'size-3 rounded-full border-2',
              props.pendingDot
                ? 'border-primary bg-primary/20 animate-pulse'
                : 'bg-timeline-dot-default border-timeline-dot-default',
            )
          "
        ></span>
        <span class="h-6 w-px bg-timeline-line"></span>
      </div>
      <p class="text-muted-foreground pt-0.5 text-sm italic">{{ props.pending }}</p>
    </li>
  </ol>
</template>
