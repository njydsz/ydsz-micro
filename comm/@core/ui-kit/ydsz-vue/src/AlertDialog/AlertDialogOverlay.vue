<script lang="ts">
// @ts-nocheck
import type { DialogOverlayProps } from '../Dialog/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface AlertDialogOverlayProps extends DialogOverlayProps {}
</script>

<script setup lang="ts">
import { DialogOverlay } from '../Dialog/index.ts'

const props = defineProps<AlertDialogOverlayProps>()
useForwardExpose()
</script>

<template>
  <DialogOverlay v-bind="props">
    <slot />
  </DialogOverlay>
</template>
