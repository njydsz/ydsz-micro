<!--
 * Skeleton.Detail：详情骨架屏模板，带可选标题、字段行与操作按钮。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\YdSkeletonDetail.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import YdSkeleton from './YdSkeleton.vue';
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 字段行数 */
  fields?: number;
  /** 顶部标题行 */
  title?: boolean;
  /** 顶部图片占位 */
  image?: boolean;
  /** 底部操作按钮 */
  actions?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  fields: 4,
  title: false,
  image: false,
  actions: false,
});
</script>

<template>
  <div :class="cn('space-y-4', props.class)">
    <!-- 顶部标题 -->
    <YdSkeleton
      v-if="props.title"
      variant="text"
      class="h-5 w-1/3"
    />

    <!-- 图片 -->
    <YdSkeleton
      v-if="props.image"
      variant="rectangular"
      class="h-32 w-full"
    />

    <!-- 字段行 -->
    <div
      v-for="(_, idx) in props.fields"
      :key="idx"
      class="flex items-center justify-between gap-4"
    >
      <YdSkeleton variant="text" class="h-3 w-16" />
      <YdSkeleton variant="text" class="h-3 flex-1" />
    </div>

    <!-- 底部操作 -->
    <div
      v-if="props.actions"
      class="flex gap-2 pt-2"
    >
      <YdSkeleton variant="rounded" class="h-9 w-24" />
      <YdSkeleton variant="rounded" class="h-9 w-20" />
    </div>
  </div>
</template>
