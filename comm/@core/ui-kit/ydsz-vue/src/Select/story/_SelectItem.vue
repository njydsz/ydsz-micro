<script setup lang="ts">
import { SelectItem, SelectItemIndicator, SelectItemText } from '..';
import { Icon } from '@iconify/vue';

defineProps<{
  options: string[];
}>();
</script>

<template>
  <SelectItem
    v-for="(option, index) in options"
    :key="index"
    class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none data-[disabled]:pointer-events-none data-[highlighted]:outline-none"
    :value="option"
  >
    <SelectItemIndicator class="absolute left-0 inline-flex w-[25px] items-center justify-center">
      <Icon icon="radix-icons:check" />
    </SelectItemIndicator>
    <SelectItemText>
      {{ option }}
    </SelectItemText>
  </SelectItem>
</template>
