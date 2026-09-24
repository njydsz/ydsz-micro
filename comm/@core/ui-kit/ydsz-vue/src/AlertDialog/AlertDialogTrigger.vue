<script lang="ts">
// @ts-nocheck
import type { DialogTriggerProps } from '../Dialog/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface AlertDialogTriggerProps extends DialogTriggerProps {}
</script>

<script setup lang="ts">
import { DialogTrigger } from '../Dialog/index.ts'

const props = withDefaults(defineProps<AlertDialogTriggerProps>(), { as: 'button' })
useForwardExpose()
</script>

<template>
  <DialogTrigger v-bind="props">
    <slot />
  </DialogTrigger>
</template>
