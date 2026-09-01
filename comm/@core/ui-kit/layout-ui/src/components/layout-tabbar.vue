<!--
 * 布局标签栏容器：为多页签提供统一的条状容器与边框。
 *
 * 自身只负责容器样式与宽度（由上层按内容区宽度计算后传入），具体页签由
 * 默认插槽注入，使标签栏可替换实现而不影响布局骨架。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\layout-tabbar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CSSProperties } from 'vue';

import { computed } from 'vue';

interface Props {
  /**
   * 高度
   */
  height: number;
}

const props = withDefaults(defineProps<Props>(), {});

const style = computed((): CSSProperties => {
  const { height } = props;
  return {
    height: `${height}px`,
  };
});
</script>

<template>
  <section
    :style="style"
    class="border-border bg-background flex w-full border-b transition-all"
  >
    <slot></slot>
  </section>
</template>

