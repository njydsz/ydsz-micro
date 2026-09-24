<script lang="ts">
// @ts-nocheck
import type { MenuGroupProps } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface DropdownMenuGroupProps extends MenuGroupProps {}
</script>

<script setup lang="ts">
import { MenuGroup } from '../Menu/index.ts'

const props = defineProps<DropdownMenuGroupProps>()
useForwardExpose()
</script>

<template>
  <MenuGroup v-bind="props">
    <slot />
  </MenuGroup>
</template>
