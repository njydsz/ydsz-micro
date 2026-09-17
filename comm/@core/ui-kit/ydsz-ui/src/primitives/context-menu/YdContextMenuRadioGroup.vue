<!--
 * 右键菜单单选组：为一组 YdContextMenuRadioItem 提供互斥的选中上下文。
 *
 * 互斥语义由 radix 维护（含键盘导航与 aria 角色），包装层不介入取值逻辑。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\YdContextMenuRadioGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  ContextMenuRadioGroupEmits,
  ContextMenuRadioGroupProps,
} from '@ydsz-core/ydsz-vue';

import { YdContextMenuRadioGroup, useForwardPropsEmits } from '@ydsz-core/ydsz-vue';

const props = defineProps<ContextMenuRadioGroupProps>();
const emits = defineEmits<ContextMenuRadioGroupEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <YdContextMenuRadioGroup v-bind="forwarded">
    <slot></slot>
  </YdContextMenuRadioGroup>
</template>
