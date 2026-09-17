<!--
 * select-item 布局组件
 *
 * @path comm\effects\layouts\src\widgets\preferences\blocks\select-item.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectOption } from '@ydsz/types';

import { useSlots } from 'vue';

import { CircleHelp } from '@ydsz/icons';

import {
  YdTooltip,
  YdSelectBase,
  YdSelectContentBase,
  YdSelectItemBase,
  YdSelectTriggerBase,
  YdSelectValueBase,
} from '@ydsz-core/shadcn-ui';

defineOptions({
  name: 'PreferenceSelectItem',
});

withDefaults(
  defineProps<{
    disabled?: boolean;
    items?: SelectOption[];
    placeholder?: string;
  }>(),
  {
    disabled: false,
    placeholder: '',
    items: () => [],
  },
);

const selectValue = defineModel<string>();

const slots = useSlots();
</script>

<template>
  <div
    :class="{
      'hover:bg-accent': !slots.tip,
      'pointer-events-none opacity-50': disabled,
    }"
    class="my-1 flex w-full items-center justify-between rounded-md px-2 py-1"
  >
    <span class="flex items-center text-sm">
      <slot></slot>

      <YdTooltip v-if="slots.tip" side="bottom">
        <template #trigger>
          <CircleHelp class="ml-1 size-3 cursor-help" />
        </template>
        <slot name="tip"></slot>
      </YdTooltip>
    </span>
    <YdSelectBase v-model="selectValue">
      <YdSelectTriggerBase class="h-8 w-[165px]">
        <YdSelectValueBase :placeholder="placeholder" />
      </YdSelectTriggerBase>
      <YdSelectContentBase>
        <template v-for="item in items" :key="item.value">
          <YdSelectItemBase :value="item.value"> {{ item.label }} </YdSelectItemBase>
        </template>
      </YdSelectContentBase>
    </YdSelectBase>
  </div>
</template>
