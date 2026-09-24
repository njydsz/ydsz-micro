<script lang="ts">
// @ts-nocheck
import type {
  MenuRadioItemEmits,
  MenuRadioItemProps,
} from '../Menu/index.ts'
import { useForwardExpose, useForwardPropsEmits } from '../shared/index.ts'

export type DropdownMenuRadioItemEmits = MenuRadioItemEmits

export interface DropdownMenuRadioItemProps extends MenuRadioItemProps {}
</script>

<script setup lang="ts">
import { MenuRadioItem } from '../Menu/index.ts'

const props = defineProps<DropdownMenuRadioItemProps>()
const emits = defineEmits<DropdownMenuRadioItemEmits>()

const forwarded = useForwardPropsEmits(props, emits)
useForwardExpose()
</script>

<template>
  <MenuRadioItem v-bind="forwarded">
    <slot />
  </MenuRadioItem>
</template>
