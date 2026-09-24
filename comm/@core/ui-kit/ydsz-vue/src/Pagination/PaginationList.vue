<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface PaginationListProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'
import { computed } from 'vue'
import { injectPaginationRootContext } from './PaginationRoot.vue'
import { getRange, transform } from './utils'

const props = defineProps<PaginationListProps>()

defineSlots<{
  default: (props: {
    /** Pages item */
    items: typeof transformedRange.value
  }) => any
}>()

useForwardExpose()
const rootContext = injectPaginationRootContext()

const transformedRange = computed(() => {
  return transform(
    getRange(
      rootContext.page.value,
      rootContext.pageCount.value,
      rootContext.siblingCount.value,
      rootContext.showEdges.value,
    ),
  )
})
</script>

<template>
  <Primitive v-bind="props">
    <slot :items="transformedRange" />
  </Primitive>
</template>
