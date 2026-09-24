<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface ScrollAreaCornerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import ScrollAreaCornerImpl from './ScrollAreaCornerImpl.vue'

const props = defineProps<ScrollAreaCornerProps>()

const { forwardRef } = useForwardExpose()
const rootContext = injectScrollAreaRootContext()

const hasBothScrollbarsVisible = computed(
  () => !!rootContext.scrollbarX.value && !!rootContext.scrollbarY.value,
)
const hasCorner = computed(
  () => rootContext.type.value !== 'scroll' && hasBothScrollbarsVisible.value,
)
</script>

<template>
  <ScrollAreaCornerImpl
    v-if="hasCorner"
    v-bind="props"
    :ref="forwardRef"
  >
    <slot />
  </ScrollAreaCornerImpl>
</template>
