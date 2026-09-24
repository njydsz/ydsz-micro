<script lang="ts">
// @ts-nocheck
import type { MenuSubTriggerProps } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface DropdownMenuSubTriggerProps extends MenuSubTriggerProps {}
</script>

<script setup lang="ts">
import { MenuSubTrigger } from '../Menu/index.ts'

const props = defineProps<DropdownMenuSubTriggerProps>()
useForwardExpose()
</script>

<template>
  <MenuSubTrigger v-bind="props">
    <slot />
  </MenuSubTrigger>
</template>
