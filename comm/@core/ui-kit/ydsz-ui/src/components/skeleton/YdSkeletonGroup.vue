<script lang="ts" setup>
/**
* Skeleton.Group：简化显示的 block 组合工具，用于快速拼装多个骨架屏。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\YdSkeletonGroup.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 行数 */
  rows?: number;
  /** 自定义类名 */
  class?: any;
}

withDefaults(defineProps<Props>(), {
  rows: 3,
});
</script>

<template>
  <div :class="cn('flex flex-col gap-3', props.class)">
    <slot />
  </div>
</template>
