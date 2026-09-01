<!--
 * 布局页脚容器：支持固定定位与整体收起。
 *
 * 收起用负 marginBottom（等于自身高度）而非 v-if：页脚内容可能在隐藏期间仍持有
 * 状态（如播放器、统计脚本），销毁重建会丢失；同时保留高度参与占位计算，
 * 避免切换时出现跳动。
 * fixed 为真时改为 position: fixed 并叠加 zIndex，此时需由上层保证不遮挡内容。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\layout-footer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CSSProperties } from 'vue';

import { computed } from 'vue';

interface Props {
  /**
   * 是否固定在底部
   */
  fixed?: boolean;
  height: number;
  /**
   * 是否显示
   * @default true
   */
  show?: boolean;
  width: string;
  zIndex: number;
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
});

const style = computed((): CSSProperties => {
  const { fixed, height, show, width, zIndex } = props;
  return {
    height: `${height}px`,
    marginBottom: show ? '0' : `-${height}px`,
    position: fixed ? 'fixed' : 'static',
    width,
    zIndex,
  };
});
</script>

<template>
  <footer
    :style="style"
    class="bg-background-deep border-border bottom-0 w-full border transition-all duration-200"
  >
    <slot></slot>
  </footer>
</template>

