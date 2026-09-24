<script lang="ts">
// @ts-nocheck
import type {
  MenuRadioGroupEmits,
  MenuRadioGroupProps,
} from '../Menu/index.ts'

export type ContextMenuRadioGroupEmits = MenuRadioGroupEmits

export interface ContextMenuRadioGroupProps extends MenuRadioGroupProps {}
</script>

<script setup lang="ts">
import { MenuRadioGroup } from '../Menu/index.ts'
import { useEmitAsProps, useForwardExpose } from '../shared/index.ts'

const props = defineProps<ContextMenuRadioGroupProps>()
const emits = defineEmits<ContextMenuRadioGroupEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()
</script>

<template>
  <MenuRadioGroup v-bind="{ ...props, ...emitsAsProps }">
    <slot />
  </MenuRadioGroup>
</template>
