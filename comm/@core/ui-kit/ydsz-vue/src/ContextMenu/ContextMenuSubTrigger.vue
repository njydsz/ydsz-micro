<script lang="ts">
// @ts-nocheck
import type { MenuSubTriggerProps } from '../Menu/index.ts'

export interface ContextMenuSubTriggerProps extends MenuSubTriggerProps {}
</script>

<script setup lang="ts">
import { MenuSubTrigger } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

const props = defineProps<ContextMenuSubTriggerProps>()
useForwardExpose()
</script>

<template>
  <MenuSubTrigger v-bind="props">
    <slot />
  </MenuSubTrigger>
</template>
