<script lang="ts">
// @ts-nocheck
import DialogOverlayImpl, { type DialogOverlayImplProps } from './DialogOverlayImpl.vue'
import { useForwardExpose } from '../shared/index.ts'

export interface DialogOverlayProps extends DialogOverlayImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { injectDialogRootContext } from './DialogRoot.vue'
import { Presence } from '../Presence/index.ts'

defineProps<DialogOverlayProps>()
const rootContext = injectDialogRootContext()

const { forwardRef } = useForwardExpose()
</script>

<template>
  <Presence
    v-if="rootContext?.modal.value"
    :present="forceMount || rootContext.open.value"
  >
    <DialogOverlayImpl
      v-bind="$attrs"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </DialogOverlayImpl>
  </Presence>
</template>
