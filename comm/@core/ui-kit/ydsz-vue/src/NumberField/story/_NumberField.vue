<script setup lang="ts">
import type { NumberFieldRootProps } from '../';
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '../';
import { Icon } from '@iconify/vue';

const props = defineProps<NumberFieldRootProps>();
</script>

<template>
  <NumberFieldRoot
    v-bind="props"
    id="number-field"
    data-testid="root"
    class="bg-blackA7 border-blackA9 flex items-center rounded-md border text-sm text-white"
  >
    <label for="number-field" data-testid="label">Number Field</label>
    <NumberFieldDecrement class="p-2" data-testid="decrement">
      <Icon icon="radix-icons:minus" />
    </NumberFieldDecrement>
    <NumberFieldInput
      data-testid="input"
      class="w-32 bg-transparent p-1 tabular-nums focus:outline-0"
    />
    <NumberFieldIncrement class="p-2" data-testid="increment">
      <Icon icon="radix-icons:plus" />
    </NumberFieldIncrement>
  </NumberFieldRoot>
</template>
