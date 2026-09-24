<script lang="ts">
// @ts-nocheck
import type { MenuSubEmits, MenuSubProps } from '../Menu/index.ts'
import type { Ref } from 'vue'

export type DropdownMenuSubEmits = MenuSubEmits
export interface DropdownMenuSubProps extends MenuSubProps {
  /** The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
}
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { MenuSub } from '../Menu/index.ts'
import { useForwardExpose } from '../shared/index.ts'

const props = withDefaults(defineProps<DropdownMenuSubProps>(), {
  open: undefined,
})
const emit = defineEmits<DropdownMenuSubEmits>()

defineSlots<{
  default: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const open = useVModel(props, 'open', emit, {
  passive: (props.open === undefined) as false,
  defaultValue: props.defaultOpen ?? false,
}) as Ref<boolean>

useForwardExpose()
</script>

<template>
  <MenuSub v-model:open="open">
    <slot :open="open" />
  </MenuSub>
</template>
