<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface LabelProps extends PrimitiveProps {
  /** The id of the element the label is associated with. */
  for?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = withDefaults(defineProps<LabelProps>(), {
  as: 'label',
})

useForwardExpose()
</script>

<template>
  <Primitive
    v-bind="props"
    @mousedown="(event) => {
      // prevent text selection when double clicking label
      if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
    }"
  >
    <slot />
  </Primitive>
</template>
