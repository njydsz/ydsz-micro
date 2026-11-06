<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { MenuAnchor, MenuContent, MenuPortal, type MenuProps, MenuRoot } from '..';

interface Props extends MenuProps {}
const props = withDefaults(defineProps<Props>(), {
  open: true,
});

const open = useVModel(props, 'open');
</script>

<template>
  <MenuRoot :open="open" :modal="false">
    <MenuAnchor :style="{ display: 'inline-block' }" />
    <MenuPortal>
      <MenuContent
        class="box-border inline-block min-w-[130px] rounded-[6px] border border-gray-100 bg-white p-[5px] font-sans text-[13px] shadow-md focus-within:border-black"
        align="start"
        @close-auto-focus.prevent
      >
        <slot />
      </MenuContent>
    </MenuPortal>
  </MenuRoot>
</template>
