<!--
 * Timeline 时间轴子节点。
 *
 * 每个节点由 dot（左侧圆点或自定义图标）+ content（主体）+ 连接线组成。
 * dot color 支持：default / foreground / primary / success / warning / destructive。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\timeline\YdTimelineItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@ydsz-core/shared/utils';

export interface YdTimelineItemProps {
  /** 自定义类名 */
  class?: any;
  /** 圆点颜色 */
  color?: 'default' | 'foreground' | 'primary' | 'success' | 'warning' | 'destructive';
  /** 是否禁用 */
  disabled?: boolean;
  /** 节点标签（时间/标题） */
  label?: string;
}

const props = withDefaults(defineProps<YdTimelineItemProps>(), {
  color: 'default',
  disabled: false,
});

const colorClass: Record<string, string> = {
  default: 'bg-neutral-300 border-neutral-300 dark:bg-neutral-600 dark:border-neutral-600',
  destructive: 'bg-destructive border-destructive',
  foreground: 'bg-foreground border-foreground',
  primary: 'bg-primary border-primary',
  success: 'bg-green-500 border-green-500',
  warning: 'bg-amber-500 border-amber-500',
};
</script>

<template>
  <li :class="cn('relative flex items-start gap-3 pb-6 last:pb-0', props.disabled ? 'opacity-50' : '', props.class)">
    <!-- 左侧：圆点 + 连接线 -->
    <div class="flex flex-col items-center">
      <slot name="dot">
        <span
          :class="cn('block size-3 rounded-full border-2', colorClass[props.color] ?? colorClass.default)"
          aria-hidden="true"
        ></span>
      </slot>
      <span class="h-full w-px flex-1 bg-neutral-200 dark:bg-neutral-700" aria-hidden="true"></span>
    </div>

    <!-- 右侧：内容区 -->
    <div class="flex-1">
      <p v-if="props.label" class="text-muted-foreground mb-0.5 text-sm">{{ props.label }}</p>
      <slot></slot>
    </div>
  </li>
</template>
