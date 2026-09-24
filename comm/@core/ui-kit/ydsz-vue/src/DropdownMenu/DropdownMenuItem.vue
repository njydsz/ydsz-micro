<script lang="ts">
// @ts-nocheck
import type { MenuItemEmits, MenuItemProps } from '../Menu/index.ts'

export type DropdownMenuItemEmits = MenuItemEmits

export interface DropdownMenuItemProps extends MenuItemProps {}
</script>

<script setup lang="ts">
import { MenuItem } from '../Menu/index.ts'
import { useEmitAsProps, useForwardExpose } from '../shared/index.ts'

const props = defineProps<DropdownMenuItemProps>()
const emits = defineEmits<DropdownMenuItemEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()
</script>

<template>
  <MenuItem v-bind="{ ...props, ...emitsAsProps }">
    <slot />
  </MenuItem>
</template>
