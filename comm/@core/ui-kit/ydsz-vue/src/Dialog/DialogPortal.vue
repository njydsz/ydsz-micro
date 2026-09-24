<script lang="ts">
// @ts-nocheck
import type { TeleportProps } from '../Teleport/index.ts'

export interface DialogPortalProps extends TeleportProps {}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '../Teleport/index.ts'

const props = defineProps<DialogPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
