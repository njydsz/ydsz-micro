<script lang="ts">
// @ts-nocheck
import type { DialogCloseProps } from '../Dialog/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface AlertDialogActionProps extends DialogCloseProps {}
</script>

<script setup lang="ts">
import { DialogClose } from '../Dialog/index.ts'

const props = withDefaults(defineProps<AlertDialogActionProps>(), { as: 'button' })
useForwardExpose()
</script>

<template>
  <DialogClose v-bind="props">
    <slot />
  </DialogClose>
</template>
