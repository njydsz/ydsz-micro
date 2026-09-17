<!--
 * number-field-item 布局组件
 *
 * @path comm\effects\layouts\src\widgets\preferences\blocks\number-field-item.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectOption } from '@ydsz/types';

import { useSlots } from 'vue';

import { CircleHelp } from '@ydsz/icons';

import {
  YdNumberField,
  YdNumberFieldContent,
  YdNumberFieldDecrement,
  YdNumberFieldIncrement,
  YdNumberFieldInput,
  YdTooltip,
} from '@ydsz-core/ydsz-ui';

defineOptions({
  name: 'PreferenceSelectItem',
});

withDefaults(
  defineProps<{
    disabled?: boolean;
    items?: SelectOption[];
    placeholder?: string;
    tip?: string;
  }>(),
  {
    disabled: false,
    placeholder: '',
    tip: '',
    items: () => [],
  },
);

const inputValue = defineModel<number>();

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

      <YdTooltip v-if="slots.tip || tip" side="bottom">
        <template #trigger>
          <CircleHelp class="ml-1 size-3 cursor-help" />
        </template>
        <slot name="tip">
          <template v-if="tip">
            <p v-for="(line, index) in tip.split('\n')" :key="`tip-line-${index}`">
              {{ line }}
            </p>
          </template>
        </slot>
      </YdTooltip>
    </span>

    <YdNumberField v-model="inputValue" v-bind="$attrs" class="w-[165px]">
      <YdNumberFieldContent>
        <YdNumberFieldDecrement />
        <YdNumberFieldInput />
        <YdNumberFieldIncrement />
      </YdNumberFieldContent>
    </YdNumberField>
  </div>
</template>
