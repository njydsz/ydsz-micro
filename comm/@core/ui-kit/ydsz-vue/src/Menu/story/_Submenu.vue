<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { MenuPortal, MenuSub, MenuSubContent, MenuSubTrigger } from '..';

const props = defineProps<{
  open: boolean;
  disabled?: boolean;
  heading?: string;
}>();

const open = useVModel(props, 'open');
</script>

<template>
  <MenuSub v-model:open="open">
    <MenuSubTrigger
      class="flex h-[25px] w-full cursor-default select-none items-center justify-between whitespace-nowrap rounded-[3px] px-[10px] leading-[1] text-black outline-none data-[highlighted]:bg-black data-[highlighted]:data-[state=open]:bg-black data-[state=open]:bg-black/10 data-[disabled]:text-gray-100 data-[highlighted]:data-[state=open]:text-white data-[highlighted]:text-white data-[state=open]:text-black"
      :disabled="disabled"
    >
      {{ heading ?? 'Submenu' }} →
    </MenuSubTrigger>
    <MenuPortal>
      <MenuSubContent
        class="box-border inline-block min-w-[130px] rounded-[6px] border border-gray-100 bg-white p-[5px] font-sans text-sm shadow-md focus-within:border-black"
      >
        <slot />
      </MenuSubContent>
    </MenuPortal>
  </MenuSub>
</template>
