<script lang="ts">
// @ts-nocheck
import type { MenuItemIndicatorProps } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface DropdownMenuItemIndicatorProps extends MenuItemIndicatorProps {}
</script>

<script setup lang="ts">
import { MenuItemIndicator } from '../Menu/index.ts'

const props = defineProps<DropdownMenuItemIndicatorProps>()
useForwardExpose()
</script>

<template>
  <MenuItemIndicator v-bind="props">
    <slot />
  </MenuItemIndicator>
</template>
