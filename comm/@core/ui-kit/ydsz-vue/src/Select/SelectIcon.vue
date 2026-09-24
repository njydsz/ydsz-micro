<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'

export interface SelectIconProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

withDefaults(defineProps<SelectIconProps>(), {
  as: 'span',
})
</script>

<template>
  <Primitive
    aria-hidden="true"
    :as="as"
    :as-child="asChild"
  >
    <slot>▼</slot>
  </Primitive>
</template>
