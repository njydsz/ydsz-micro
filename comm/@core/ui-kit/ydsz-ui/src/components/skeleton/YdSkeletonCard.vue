<script lang="ts" setup>
/**
* Skeleton.Card：卡片骨架屏模板，带可选图片、标题、文本行与按钮。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\YdSkeletonCard.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import YdSkeleton from './YdSkeleton.vue';
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 顶部大矩形图片占位 */
  image?: boolean;
  /** 标题旁小圆头像 */
  avatar?: boolean;
  /** 文本行数 */
  lines?: number;
  /** 底部操作按钮 */
  actions?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  image: false,
  avatar: false,
  lines: 3,
  actions: false,
});
</script>

<template>
  <div :class="cn('rounded-lg border p-3', props.class)">
    <!-- 顶部图片 -->
    <YdSkeleton
      v-if="props.image"
      variant="rectangular"
      class="mb-3 h-40 w-full"
    />

    <!-- Header: 头像 + 标题行 -->
    <div class="mb-3 flex items-center gap-2">
      <YdSkeleton
        v-if="props.avatar"
        variant="circular"
        class="size-8"
      />
      <div class="flex-1 space-y-1.5">
        <YdSkeleton variant="text" class="h-3 w-1/2" />
      </div>
    </div>

    <!-- Body: 文本行 -->
    <div class="space-y-2">
      <YdSkeleton
        v-for="(_, idx) in props.lines"
        :key="idx"
        variant="text"
        :class="cn('h-3', idx === (props.lines - 1) ? 'w-2/3' : 'w-full')"
      />
    </div>

    <!-- Footer: 按钮 -->
    <div
      v-if="props.actions"
      class="mt-4 flex gap-2"
    >
      <YdSkeleton variant="rounded" class="h-8 w-20" />
      <YdSkeleton variant="rounded" class="h-8 w-16" />
    </div>
  </div>
</template>
