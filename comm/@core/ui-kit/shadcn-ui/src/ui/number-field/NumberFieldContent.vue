<!--
 * 数字输入框的定位容器：为绝对定位的增减按钮提供 relative 参照系，并按按钮存在与否调整输入框内边距。
 *
 * 内边距用 has-[[data-slot=decrement]] / has-[[data-slot=increment]] 选择器判定，
 * 而不是由调用方传布尔值 —— 只放一个按钮时也能自动只留一侧边距，不会出现多余的空白。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\number-field\NumberFieldContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

const props = defineProps<{
  class?: any;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'relative [&>[data-slot=input]]:has-[[data-slot=decrement]]:pl-5 [&>[data-slot=input]]:has-[[data-slot=increment]]:pr-5',
        props.class,
      )
    "
  >
    <slot></slot>
  </div>
</template>
