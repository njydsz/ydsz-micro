<!--
 * 标签页容器：转发 radix TabsRoot 的 props 与 emits。
 *
 * 只做状态托管与无障碍关联，自身不渲染可见结构，
 * 因此激活值既可以用 v-model 双向绑定，也可以完全受控地自行处理 update:modelValue。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tabs\Tabs.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TabsRootEmits, TabsRootProps } from 'radix-vue';

import { TabsRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<TabsRootProps>();
const emits = defineEmits<TabsRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TabsRoot v-bind="forwarded">
    <slot></slot>
  </TabsRoot>
</template>
