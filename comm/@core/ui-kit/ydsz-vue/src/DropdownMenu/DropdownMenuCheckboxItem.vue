<script lang="ts">
// @ts-nocheck
import type {
  MenuCheckboxItemEmits,
  MenuCheckboxItemProps,
} from '../Menu/index.ts'

export type DropdownMenuCheckboxItemEmits = MenuCheckboxItemEmits

export interface DropdownMenuCheckboxItemProps extends MenuCheckboxItemProps {}
</script>

<script setup lang="ts">
import { MenuCheckboxItem } from '../Menu/index.ts'
import { useEmitAsProps, useForwardExpose } from '../shared/index.ts'

const props = defineProps<DropdownMenuCheckboxItemProps>()
const emits = defineEmits<DropdownMenuCheckboxItemEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()
</script>

<template>
  <MenuCheckboxItem v-bind="{ ...props, ...emitsAsProps }">
    <slot />
  </MenuCheckboxItem>
</template>
