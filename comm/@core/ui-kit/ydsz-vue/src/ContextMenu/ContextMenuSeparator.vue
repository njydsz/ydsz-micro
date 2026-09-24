<script lang="ts">
// @ts-nocheck
import type { MenuSeparatorProps } from '../Menu/index.ts'

export interface ContextMenuSeparatorProps extends MenuSeparatorProps {}
</script>

<script setup lang="ts">
import { MenuSeparator } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

const props = defineProps<ContextMenuSeparatorProps>()
useForwardExpose()
</script>

<template>
  <MenuSeparator v-bind="props">
    <slot />
  </MenuSeparator>
</template>
