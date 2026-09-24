<script lang="ts">
// @ts-nocheck
import type {
  MenuRadioGroupEmits,
  MenuRadioGroupProps,
} from '../Menu/index.ts'

export type DropdownMenuRadioGroupEmits = MenuRadioGroupEmits

export interface DropdownMenuRadioGroupProps extends MenuRadioGroupProps {}
</script>

<script setup lang="ts">
import { MenuRadioGroup } from '../Menu/index.ts'
import { useEmitAsProps, useForwardExpose } from '../shared/index.ts'

const props = defineProps<MenuRadioGroupProps>()
const emits = defineEmits<MenuRadioGroupEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()
</script>

<template>
  <MenuRadioGroup v-bind="{ ...props, ...emitsAsProps }">
    <slot />
  </MenuRadioGroup>
</template>
