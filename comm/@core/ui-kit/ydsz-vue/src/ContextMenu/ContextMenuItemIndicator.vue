<script lang="ts">
// @ts-nocheck
import type { MenuItemIndicatorProps } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface ContextMenuItemIndicatorProps extends MenuItemIndicatorProps {}
</script>

<script setup lang="ts">
import { MenuItemIndicator } from '../Menu/index.ts'

const props = defineProps<ContextMenuItemIndicatorProps>()
useForwardExpose()
</script>

<template>
  <MenuItemIndicator v-bind="props">
    <slot />
  </MenuItemIndicator>
</template>
