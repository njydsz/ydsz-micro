<!--
 * 复选框：在 radix CheckboxRoot 之上补充 indeterminate 半选态。
 *
 * 半选态用于「父级勾选框」表达子项部分选中的状态，原生 checkbox 只能通过 JS
 * 设置且不同浏览器表现不一，这里统一为受控属性以便树形选择场景复用。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\checkbox\checkbox.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'radix-vue';

import { useId } from 'vue';

import { useForwardPropsEmits } from 'radix-vue';

import { Checkbox } from '../../ui/checkbox';

const props = defineProps<CheckboxRootProps & { indeterminate?: boolean }>();

const emits = defineEmits<CheckboxRootEmits>();

const checked = defineModel<boolean>('checked');

const forwarded = useForwardPropsEmits(props, emits);

const id = useId();
</script>

<template>
  <div class="flex items-center">
    <Checkbox
      v-bind="forwarded"
      :id="id"
      v-model:checked="checked"
      :aria-label="typeof forwarded.label === 'string' ? forwarded.label : undefined"
    />
    <label :for="id" class="ml-2 cursor-pointer text-sm"> <slot></slot> </label>
  </div>
</template>

