<!--
 * Divider 分隔线：区隔内容的分割线。
 *
 * 与 YdSeparator（radix）互补：Divider 是 shadcn 风格，只承担视觉分隔语义，
 * 不声明 role="separator"；需要无障碍分隔时使用 YdSeparator。
 *
 * 支持横/竖两种方向，以及带文字标签的居中展示；dashed 虚线模式可选。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\divider\YdDivider.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DividerProps } from './types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

const props = withDefaults(defineProps<DividerProps>(), {
  dashed: false,
  orientation: 'center',
  type: 'horizontal',
});

/** 分隔线本体 class（不含 label） */
const lineClass = computed(() => {
  const base = props.dashed ? 'border-dashed border-t' : 'border-t';
  if (props.type === 'vertical') {
    return cn('h-full w-px border-l', props.dashed ? 'border-dashed' : '', base);
  }
  return base;
});

/** 标签左/右侧线的 class */
const sideLineClass = computed(() => {
  if (props.type === 'vertical') return '';
  const dash = props.dashed ? 'border-dashed' : '';
  return cn('flex-1 border-t', dash);
});

/** 容器 class */
const containerClass = computed(() => {
  return props.type === 'vertical'
    ? 'inline-flex h-full flex-col items-center justify-center'
    : 'my-4 flex w-full items-center';
});

/** 标签的 margin（根据 orientation 调整） */
const labelStyle = computed(() => {
  if (props.type === 'vertical') return {};
  switch (props.orientation) {
    case 'left':
      return { marginRight: '1rem', paddingLeft: 0 };
    case 'right':
      return { marginLeft: '1rem', paddingRight: 0 };
    default:
      return { margin: '0 1rem' };
  }
});
</script>

<template>
  <div :class="cn(containerClass, props.class)" role="presentation">
    <!-- 水平带标签 -->
    <template v-if="props.type === 'horizontal' && $slots.default">
      <span v-if="props.orientation !== 'left'" :class="sideLineClass" aria-hidden="true"></span>
      <span
        :class="'text-muted-foreground px-2 text-sm font-medium'"
        :style="labelStyle"
      >
        <slot></slot>
      </span>
      <span v-if="props.orientation !== 'right'" :class="sideLineClass" aria-hidden="true"></span>
    </template>
    <!-- 水平无标签 -->
    <template v-else-if="props.type === 'horizontal'">
      <hr :class="cn('w-full', lineClass)" />
    </template>
    <!-- 竖直分隔线 -->
    <template v-else>
      <div :class="cn('h-full min-h-4 w-[1px] bg-border', lineClass)" />
    </template>
  </div>
</template>
