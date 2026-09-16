<!--
 * 卡片网格：响应式网格容器，用于统一卡片视图的布局间距。
 *
 * 设计目标：
 *  - 替代 VxeTable 表格布局，将卡片以等宽网格展示；
 *  - 响应式列数：手机 1 列、平板 2 列、桌面 3-4 列；
 *  - 与 EmptyState 配合使用：当 items 为空时展示空状态占位而非留白。
 *
 * 使用方式：直接包裹 <EntityCard>；通过 :min-card-width 可调节卡片最小宽度来微调列数。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\entity-card\CardGrid.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({
  name: 'CardGrid',
});

const props = withDefaults(
  defineProps<{
    /** 自定义类名 */
    className?: string;
    /** 是否处于加载状态 */
    isLoading?: boolean;
    /** 自定义间距 class（默认 gap-4） */
    gapClass?: string;
    /** 数据是否为空（用于显示 empty slot） */
    isEmpty?: boolean;
    /** 默认最小卡片宽度（px），响应式断点下自动调整列数 */
    minCardWidth?: number;
  }>(),
  {
    className: '',
    gapClass: 'gap-4',
    isLoading: false,
    isEmpty: false,
    minCardWidth: 280,
  },
);
</script>

<template>
  <div class="relative">
    <!-- 加载态：栅格骨架 -->
    <div
      v-if="props.isLoading"
      :class="cn('grid', props.gapClass, props.className)"
      :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${props.minCardWidth}px, 1fr))` }"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-48 animate-pulse rounded-xl border border-border-subtle bg-accent/40"
      />
    </div>

    <!-- 空状态 -->
    <slot
      v-else-if="props.isEmpty"
      name="empty"
    />

    <!-- 卡片网格 -->
    <div
      v-else
      :class="cn('grid', props.gapClass, props.className)"
      :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${props.minCardWidth}px, 1fr))` }"
    >
      <slot />
    </div>
  </div>
</template>
