<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface TooltipArrowProps extends PrimitiveProps {
  /**
   * The width of the arrow in pixels.
   *
   * @defaultValue 10
   */
  width?: number

  /**
   * The height of the arrow in pixels.
   *
   * @defaultValue 5
   */
  height?: number
}
</script>

<script setup lang="ts">
import { PopperArrow } from '../Popper/index.ts'

const props = withDefaults(defineProps<TooltipArrowProps>(), {
  width: 10,
  height: 5,
  as: 'svg',
})
useForwardExpose()
</script>

<template>
  <PopperArrow v-bind="props">
    <slot />
  </PopperArrow>
</template>
