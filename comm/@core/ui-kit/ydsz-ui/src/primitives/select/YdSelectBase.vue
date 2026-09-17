<!--
 * YdSelectBase —— 选择器基础容器。
 *
 * 基于 radix-vue SelectRoot 的包装层，职责为 props 转发与 v-model 绑定。
 * 与 YdSelect 功能完全一致，提供「Base」命名导出保持 primitives 命名惯例统一。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\select\YdSelectBase.vue
 * @author ydsz-team
 * @since 1.0.0
 */
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
