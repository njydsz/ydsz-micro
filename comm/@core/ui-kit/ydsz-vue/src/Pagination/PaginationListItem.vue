<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface PaginationListItemProps extends PrimitiveProps {
  /** Value for the page */
  value: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '../Primitive/index.ts'
import { injectPaginationRootContext } from './PaginationRoot.vue'

const props = withDefaults(defineProps<PaginationListItemProps>(), { as: 'button' })
useForwardExpose()

const rootContext = injectPaginationRootContext()
const isSelected = computed(() => rootContext.page.value === props.value)

const disabled = computed((): boolean => rootContext.disabled.value)
</script>

<template>
  <Primitive
    v-bind="props"
    data-type="page"
    :aria-label="`Page ${value}`"
    :aria-current="isSelected ? 'page' : undefined"
    :data-selected="isSelected ? 'true' : undefined"
    :disabled
    :type="as === 'button' ? 'button' : undefined"
    @click="!disabled && rootContext.onPageChange(value)"
  >
    <slot>{{ value }}</slot>
  </Primitive>
</template>
