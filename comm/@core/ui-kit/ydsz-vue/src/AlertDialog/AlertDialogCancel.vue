<script lang="ts">
// @ts-nocheck
import type { DialogCloseProps } from '../Dialog/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface AlertDialogCancelProps extends DialogCloseProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { injectAlertDialogContentContext } from './AlertDialogContent.vue'
import { DialogClose } from '../Dialog/index.ts'

const props = withDefaults(defineProps<AlertDialogCancelProps>(), { as: 'button' })
const contentContext = injectAlertDialogContentContext()
const { forwardRef, currentElement } = useForwardExpose()

onMounted(() => {
  contentContext.onCancelElementChange(currentElement.value)
})
</script>

<template>
  <DialogClose
    v-bind="props"
    :ref="forwardRef"
  >
    <slot />
  </DialogClose>
</template>
