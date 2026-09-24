<script lang="ts">
// @ts-nocheck
import type { TeleportProps } from '../Teleport/index.ts'

export interface PopoverPortalProps extends TeleportProps {}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '../Teleport/index.ts'

const props = defineProps<PopoverPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
