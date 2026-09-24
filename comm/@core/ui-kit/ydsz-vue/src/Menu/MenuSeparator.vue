<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'

export interface MenuSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = defineProps<MenuSeparatorProps>()
</script>

<template>
  <Primitive
    v-bind="props"
    role="separator"
    aria-orientation="horizontal"
  >
    <slot />
  </Primitive>
</template>
