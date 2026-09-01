<!--
 * 选择器的容器：转发 radix SelectRoot 的全部 props 与 emits。
 *
 * 本层只做状态托管与无障碍关联，不渲染任何 DOM 之外的内容，
 * 因此可以用 v-model 直接接管选中值，也可以完全受控地自行处理 update:modelValue。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\Select.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from 'radix-vue';

import { SelectRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<SelectRootProps>();
const emits = defineEmits<SelectRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SelectRoot v-bind="forwarded">
    <slot></slot>
  </SelectRoot>
</template>
