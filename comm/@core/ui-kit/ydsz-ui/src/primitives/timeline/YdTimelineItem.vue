<!--
 * Timeline 时间轴子节点。
 *
 * 每个节点由 dot（左侧圆点或自定义图标）+ content（主体）+ 连接线组成。
 * dot 可以通过 color 属性指定语义色，也可以传入 named slot #dot 完全覆盖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\timeline\YdTimelineItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { inject } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

export interface YdTimelineItemProps {
  /** 自定义类名 */
  class?: any;
  /** 圆点颜色 tailwind 类或 foreground / primary / success / warning / destructive */
  color?: string;
  /** 是否禁用（置灰） */
  disabled?: boolean;
  /** 节点标签（时间/标题） */
  label?: string;
}

const props = withDefaults(defineProps<YdTimelineItemProps>(), {
  color: 'default',
  disabled: false,
});

const colorMap: Record<string, string> = {
  default: 'bg-timeline-dot-default border-timeline-dot-default',
  destructive: 'bg-destructive-500 border-destructive-500',
  foreground: 'bg-foreground border-foreground',
  primary: 'bg-timeline-dot-active border-timeline-dot-active',
  success: 'bg-success-500 border-success-500',
  warning: 'bg-warning-500 border-warning-500',
};
</script>

<template>
  <li
    :class="
      cn(
        'relative flex items-start gap-3 pb-6 last:pb-0',
        props.disabled && 'opacity-50',
        props.class,
      )
    "
  >
    <!-- 左侧：圆点 + 连接线 -->
    <div class="flex flex-col items-center">
      <slot name="dot">
        <span
          :class="
            cn(
              'size-3 rounded-full border-2',
              colorMap[props.color] ?? colorMap.default,
            )
          "
          aria-hidden="true"
        ></span>
      </slot>
      <!-- 连接线（末节点不渲染 —— 由父组件控制通过 last:pb-0 隐式） -->
      <span
        class="min-h-4 w-px flex-1 bg-timeline-line"
        aria-hidden="true"
      ></span>
    </div>

    <!-- 右侧：内容区 -->
    <div class="flex-1">
      <p v-if="props.label" class="text-muted-foreground mb-0.5 text-sm">
        {{ props.label }}
      </p>
      <slot></slot>
    </div>
  </li>
</template>
