<script lang="ts">
// @ts-nocheck
import type {
  DialogContentEmits,
  DialogContentProps,
} from '../Dialog/index.ts'
import { createContext, useEmitAsProps, useForwardExpose } from '../shared/index.ts'

interface AlertDialogContentContext {
  onCancelElementChange: (el: HTMLElement | undefined) => void
}

export const [injectAlertDialogContentContext, provideAlertDialogContentContext]
  = createContext<AlertDialogContentContext>('AlertDialogContent')

export type AlertDialogContentEmits = DialogContentEmits
export interface AlertDialogContentProps extends DialogContentProps {}
</script>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { DialogContent } from '../Dialog/index.ts'

const props = defineProps<AlertDialogContentProps>()
const emits = defineEmits<AlertDialogContentEmits>()

const emitsAsProps = useEmitAsProps(emits)
useForwardExpose()

const cancelElement = ref<HTMLElement | undefined>()

provideAlertDialogContentContext({
  onCancelElementChange: (el) => {
    cancelElement.value = el
  },
})
</script>

<template>
  <DialogContent
    v-bind="{ ...props, ...emitsAsProps }"
    role="alertdialog"
    @pointer-down-outside.prevent
    @interact-outside.prevent
    @open-auto-focus="
      () => {
        nextTick(() => {
          cancelElement?.focus({
            preventScroll: true,
          });
        });
      }
    "
  >
    <slot />
  </DialogContent>
</template>
