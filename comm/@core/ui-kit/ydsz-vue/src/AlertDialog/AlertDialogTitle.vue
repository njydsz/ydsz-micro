<script lang="ts">
// @ts-nocheck
import type { DialogTitleProps } from '../Dialog/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface AlertDialogTitleProps extends DialogTitleProps {}
</script>

<script setup lang="ts">
import { DialogTitle } from '../Dialog/index.ts'

const props = withDefaults(defineProps<AlertDialogTitleProps>(), { as: 'h2' })
useForwardExpose()
</script>

<template>
  <DialogTitle v-bind="props">
    <slot />
  </DialogTitle>
</template>
