<!--
 * 布局顶栏容器：提供 logo 与侧栏开合按钮的专用插槽。
 *
 * logo 插槽仅在其有内容时才渲染外层容器（v-if="slots.logo"），
 * 避免无 logo 时留下一个仍占宽度的空节点。
 * 容器宽度通过 logoStyle 的最小宽度与侧栏宽度对齐，使顶栏内容与下方主体左边缘
 * 保持同一基线；收起时用负 marginTop 移出视野而非销毁，保持与页脚一致的行为。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\layout-header.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CSSProperties } from 'vue';

import { computed, useSlots } from 'vue';

interface Props {
  /**
   * 横屏
   */
  fullWidth: boolean;
  /**
   * 高度
   */
  height: number;
  /**
   * 是否移动端
   */
  isMobile: boolean;
  /**
   * 是否显示
   */
  show: boolean;
  /**
   * 侧边菜单宽度
   */
  sidebarWidth: number;
  /**
   * 主题
   */
  theme: string | undefined;
  /**
   * 宽度
   */
  width: string;
  /**
   * zIndex
   */
  zIndex: number;
}

const props = withDefaults(defineProps<Props>(), {});

const slots = useSlots();

const style = computed((): CSSProperties => {
  const { fullWidth, height, show } = props;
  const right = !show || !fullWidth ? undefined : 0;

  return {
    height: `${height}px`,
    marginTop: show ? 0 : `-${height}px`,
    right,
  };
});

const logoStyle = computed((): CSSProperties => {
  return {
    minWidth: `${props.isMobile ? 40 : props.sidebarWidth}px`,
  };
});
</script>

<template>
  <header
    :class="theme"
    :style="style"
    class="border-border bg-header top-0 flex w-full flex-[0_0_auto] items-center border-b pl-2 transition-[margin-top] duration-200"
  >
    <div v-if="slots.logo" :style="logoStyle">
      <slot name="logo"></slot>
    </div>

    <slot name="toggle-button"> </slot>

    <slot></slot>
  </header>
</template>

