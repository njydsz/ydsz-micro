<script lang="ts">
// @ts-nocheck
import type { MenuPortalProps } from '../Menu/index.ts'

export interface DropdownMenuPortalProps extends MenuPortalProps {}
</script>

<script setup lang="ts">
import { MenuPortal } from '../Menu/index.ts'

const props = defineProps<DropdownMenuPortalProps>()
</script>

<template>
  <MenuPortal v-bind="props">
    <slot />
  </MenuPortal>
</template>
