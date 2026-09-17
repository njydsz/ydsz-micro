<!--
 * 仪表盘网格：响应式网格布局容器，专为指标卡排列设计。
 *
 * 设计目标：
 *  - 1 列（手机）/ 2 列（平板）/ 3-4 列（桌面）自适应；
 *  - 统一卡片间距，与表单区视觉一致；
 *  - 支持空态占位（如仪表盘配置为空时引导用户）。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\dashboard\YdDashboardGrid.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({
  name: 'YdDashboardGrid',
});

interface Props {
  /** 列数：2 | 3 | 4（响应式断点自动降级） */
  columns?: 2 | 3 | 4;
  /** 自定义间距 class */
  gapClass?: string;
  /** 是否为空（显示 empty slot） */
  empty?: boolean;
  /** 自定义类名 */
  className?: string;
}

withDefaults(defineProps<Props>(), {
  columns: 4,
  empty: false,
  gapClass: 'gap-4',
});
</script>

<template>
  <div class="w-full">
    <!-- 空状态 -->
    <slot
      v-if="empty"
      name="empty"
    />

    <!-- 指标卡网格 -->
    <div
      v-else
      :class="
        cn(
          'grid',
          gapClass,
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className,
        )
      "
    >
      <slot />
    </div>
  </div>
</template>
