<!--
 * 时间轴 Pro —— 便利性封装（Convenience Wrapper）。
 *
 * 在 YdTimeline 基础上增加 alternate（交替显示）模式和 ghost（幽灵）模式，
 * 对齐 Element Plus ElTimeline 的高级形态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\timeline\YdTimelinePro.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 时间轴 Pro——便利性封装。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const props = withDefaults(defineProps<{
  /** 自定义类名 */
  class?: any;
  /** pending 节点文案 */
  pending?: string;
  /** 是否显示 pending 脉冲动画 */
  pendingDot?: boolean;
  /** 是否反转排序 */
  reverse?: boolean;
  /** 交替模式：内容项在时间轴两侧交替显示 */
  alternate?: boolean;
  /** 幽灵模式：更轻量的视觉风格 */
  ghost?: boolean;
}>(), {
  pendingDot: true,
  reverse: false,
  alternate: false,
  ghost: false,
});

defineSlots<{
  default: () => any;
  pending: () => any;
  dot: () => any;
}>();

const itemsClass = computed(() => {
  const base = 'flex flex-col';
  if (props.reverse) return `${base} flex-col-reverse`;
  return base;
});

const dividerClass = computed(() => {
  if (props.ghost) return 'border-border-subtle border-dashed';
  return 'bg-neutral-200 dark:bg-neutral-700';
});

const dotClass = computed(() => {
  if (props.ghost) return 'size-2 rounded-full bg-neutral-300';
  return 'size-3 rounded-full border-2 border-primary bg-primary/20';
});
</script>

<template>
  <!--
    时间轴 Pro——带 alternate / ghost 增强模式。

    alternate 模式下，内容项自动在时间轴左右交替排列。
    ghost 模式下，使用虚线和半透明样式，作为视觉引导而非强调。

    用法：
    ```html
    <YdTimelinePro alternate>
      <YdTimelineItem v-for="(item, idx) in events" :key="idx">
        {{ item.content }}
      </YdTimelineItem>
    </YdTimelinePro>
    ```
  -->
  <ol
    :class="cn('flex flex-col', itemsClass, props.class)"
    role="list"
    aria-label="时间轴"
  >
    <!-- @default -->
    <slot></slot>
    <!-- pending 占位 -->
    <li
      v-if="props.pending"
      class="flex items-start gap-3"
    >
      <div class="flex flex-col items-center">
        <span :class="cn(dotClass, pendingDot ? 'animate-pulse' : '')" />
        <span :class="cn('h-6 w-px', dividerClass)" />
      </div>
      <p class="text-muted-foreground pt-0.5 text-sm italic">
        <slot name="pending">{{ pending }}</slot>
      </p>
    </li>
  </ol>
</template>
