<script lang="ts">
// @ts-nocheck
import type { MenuSeparatorProps } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface DropdownMenuSeparatorProps extends MenuSeparatorProps {}
</script>

<script setup lang="ts">
import { MenuSeparator } from '../Menu/index.ts'

const props = defineProps<DropdownMenuSeparatorProps>()
useForwardExpose()
</script>

<template>
  <MenuSeparator v-bind="props">
    <slot />
  </MenuSeparator>
</template>
