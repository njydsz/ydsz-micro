<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface PaginationEllipsisProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = defineProps<PaginationEllipsisProps>()
useForwardExpose()
</script>

<template>
  <Primitive
    v-bind="props"
    data-type="ellipsis"
  >
    <slot>&#8230;</slot>
  </Primitive>
</template>
