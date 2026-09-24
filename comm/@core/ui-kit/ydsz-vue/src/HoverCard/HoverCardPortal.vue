<script lang="ts">
// @ts-nocheck
import type { TeleportProps } from '../Teleport/index.ts'

export interface HoverCardPortalProps extends TeleportProps {}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '../Teleport/index.ts'

const props = defineProps<HoverCardPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
