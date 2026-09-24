<script lang="ts">
// @ts-nocheck
import type { TeleportProps } from '../Teleport/index.ts'

export interface MenuPortalProps extends TeleportProps {}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '../Teleport/index.ts'

const props = defineProps<MenuPortalProps>()
</script>

<template>
  <TeleportPrimitive v-bind="props">
    <slot />
  </TeleportPrimitive>
</template>
