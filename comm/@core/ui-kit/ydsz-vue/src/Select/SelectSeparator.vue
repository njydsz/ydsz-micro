<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'

export interface SelectSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = defineProps<SelectSeparatorProps>()
</script>

<template>
  <Primitive
    aria-hidden="true"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
