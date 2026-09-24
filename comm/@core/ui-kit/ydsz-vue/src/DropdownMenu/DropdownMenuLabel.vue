<script lang="ts">
// @ts-nocheck
import type { MenuLabelProps } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface DropdownMenuLabelProps extends MenuLabelProps {}
</script>

<script setup lang="ts">
import { MenuLabel } from '../Menu/index.ts'

const props = defineProps<DropdownMenuLabelProps>()
useForwardExpose()
</script>

<template>
  <MenuLabel v-bind="props">
    <slot />
  </MenuLabel>
</template>
