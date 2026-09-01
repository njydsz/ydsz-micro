<!--
 * 轻量浮层的容器：转发 radix PopoverRoot 的全部 props 与 emits。
 *
 * 与 Dialog 的取舍：Popover 不锁滚动、不强制焦点，适合筛选器、快捷菜单这类
 * 「打开后仍要与页面其它部分对照」的场景；需要用户必须做出选择时用 AlertDialog。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\popover\Popover.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PopoverRootEmits, PopoverRootProps } from 'radix-vue';

import { PopoverRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<PopoverRootProps>();
const emits = defineEmits<PopoverRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverRoot v-bind="forwarded">
    <slot></slot>
  </PopoverRoot>
</template>
