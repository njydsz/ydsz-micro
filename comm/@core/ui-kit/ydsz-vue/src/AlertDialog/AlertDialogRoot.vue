<script lang="ts">
// @ts-nocheck
import type {
  DialogRootEmits,
  DialogRootProps,
} from '../Dialog/index.ts'

export type AlertDialogEmits = DialogRootEmits
export interface AlertDialogProps extends Omit<DialogRootProps, 'modal'> {}
</script>

<script setup lang="ts">
import { DialogRoot } from '../Dialog/index.ts'
import { useForwardExpose, useForwardPropsEmits } from '../shared/index.ts'

const props = defineProps<AlertDialogProps>()
const emits = defineEmits<AlertDialogEmits>()

const forwarded = useForwardPropsEmits(props, emits)
useForwardExpose()
</script>

<template>
  <DialogRoot
    v-bind="forwarded"
    :modal="true"
  >
    <slot />
  </DialogRoot>
</template>
