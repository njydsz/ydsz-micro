<script lang="ts">
// @ts-nocheck
import type { PopperArrowProps } from '../Popper/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface HoverCardArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '../Popper/index.ts'

const props = withDefaults(defineProps<HoverCardArrowProps>(), {
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
