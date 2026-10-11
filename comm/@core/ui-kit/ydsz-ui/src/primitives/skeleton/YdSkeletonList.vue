<!--
 * Skeleton.List：列表骨架屏模板，每行带可选头像与操作按钮。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\YdSkeletonList.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import YdSkeleton from './YdSkeleton.vue';
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 行数（默认 5） */
  rows?: number;
  /** 是否带左侧圆形头像 */
  avatar?: boolean;
  /** 是否带右侧操作按钮 */
  action?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  avatar: false,
  action: false,
});
</script>

<template>
  <div :class="cn('flex flex-col gap-4', props.class)">
    <div
      v-for="(_, idx) in props.rows"
      :key="idx"
      class="flex items-center gap-3"
    >
      <!-- 左侧圆形头像占位 -->
      <YdSkeleton
        v-if="props.avatar"
        variant="circular"
        class="size-10"
      />

      <!-- 中间文本区域 -->
      <div class="flex-1 space-y-2">
        <YdSkeleton variant="text" class="h-3" />
        <YdSkeleton variant="text" class="h-3 w-3/4" />
      </div>

      <!-- 右侧操作按钮占位 -->
      <YdSkeleton
        v-if="props.action"
        variant="rounded"
        class="h-8 w-16"
      />
    </div>
  </div>
</template>
