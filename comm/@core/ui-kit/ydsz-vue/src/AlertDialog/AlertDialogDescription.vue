<script lang="ts">
// @ts-nocheck
import type { DialogDescriptionProps } from '../Dialog/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface AlertDialogDescriptionProps extends DialogDescriptionProps {}
</script>

<script setup lang="ts">
import { DialogDescription } from '../Dialog/index.ts'

const props = withDefaults(defineProps<AlertDialogDescriptionProps>(), { as: 'p' })
useForwardExpose()
</script>

<template>
  <DialogDescription v-bind="props">
    <slot />
  </DialogDescription>
</template>
