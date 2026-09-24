<script lang="ts">
// @ts-nocheck
import type { PopperArrowProps } from '../Popper/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface PopoverArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '../Popper/index.ts'

const props = withDefaults(defineProps<PopoverArrowProps>(), {
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
