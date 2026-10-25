<script setup lang="ts">
/**
* 右键菜单单选组：为一组 YdContextMenuRadioItem 提供互斥的选中上下文。
* 
 * 互斥语义由 radix 维护（含键盘导航与 aria 角色），包装层不介入取值逻辑。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\YdContextMenuRadioGroup.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  ContextMenuRadioGroupEmits,
  ContextMenuRadioGroupProps,
} from '@ydsz-core/ydsz-vue';

import { ContextMenuRadioGroup, useForwardPropsEmits } from '@ydsz-core/ydsz-vue';

const props = defineProps<ContextMenuRadioGroupProps>();
const emits = defineEmits<ContextMenuRadioGroupEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ContextMenuRadioGroup v-bind="forwarded">
    <slot></slot>
  </ContextMenuRadioGroup>
</template>
