<!--
 * 手风琴容器：直接转发 radix AccordionRoot 的全部 props 与 emits，
 * 由调用方通过 type（single / multiple）与 collapsible 决定展开行为。
 *
 * 本层不加任何样式，只负责把 radix 的无障碍语义（键盘上下切换、aria-expanded）
 * 原样带到项目内，样式交由 YdAccordionItem / Trigger / Content 各自承担。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\accordion\YdAccordion.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AccordionRootEmits, AccordionRootProps } from '@ydsz-core/ydsz-vue';

import { AccordionRoot, useForwardPropsEmits } from '@ydsz-core/ydsz-vue';

const props = defineProps<AccordionRootProps>();
const emits = defineEmits<AccordionRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AccordionRoot v-bind="forwarded">
    <slot></slot>
  </AccordionRoot>
</template>
