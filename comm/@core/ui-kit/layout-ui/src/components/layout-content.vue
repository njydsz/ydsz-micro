<!--
 * 布局主内容区容器：承载页面内容并提供 overlay 遮罩层。
 *
 * 尺寸与内边距由 props 计算，元素引用交给 useLayoutContentStyle 测量后写入
 * CSS 变量，供其它区块消费；本组件自身不参与跨区块的尺寸计算。
 * overlay 插槽用于承载浮在内容之上的元素（如移动端展开侧边栏时的遮罩），
 * 其定位样式来自测量得到的可见矩形。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\layout-content.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CSSProperties } from 'vue';

import type { ContentCompactType } from '@YDSZ-core/typings';

import { computed } from 'vue';

import { useLayoutContentStyle } from '@YDSZ-core/composables';
import { Slot } from '@YDSZ-core/shadcn-ui';

interface Props {
  /**
   * 内容区域定宽
   */
  contentCompact: ContentCompactType;
  /**
   * 定宽布局宽度
   */
  contentCompactWidth: number;
  padding: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
}

const props = withDefaults(defineProps<Props>(), {});

const { contentElement, overlayStyle } = useLayoutContentStyle();

const style = computed((): CSSProperties => {
  const {
    contentCompact,
    padding,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
  } = props;

  const compactStyle: CSSProperties =
    contentCompact === 'compact'
      ? { margin: '0 auto', width: `${props.contentCompactWidth}px` }
      : {};
  return {
    ...compactStyle,
    flex: 1,
    padding: `${padding}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: `${paddingLeft}px`,
    paddingRight: `${paddingRight}px`,
    paddingTop: `${paddingTop}px`,
  };
});
</script>

<template>
  <main ref="contentElement" :style="style" class="bg-background-deep relative">
    <Slot :style="overlayStyle">
      <slot name="overlay"></slot>
    </Slot>
    <slot></slot>
  </main>
</template>

