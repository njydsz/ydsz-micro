<script lang="ts">
// @ts-nocheck
import type { MenuLabelProps } from '../Menu/index.ts'

export interface ContextMenuLabelProps extends MenuLabelProps {}
</script>

<script setup lang="ts">
import { MenuLabel } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

const props = defineProps<ContextMenuLabelProps>()
useForwardExpose()
</script>

<template>
  <MenuLabel v-bind="props">
    <slot />
  </MenuLabel>
</template>
