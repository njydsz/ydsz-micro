<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface PopoverCloseProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import {
  injectPopoverRootContext,
} from './PopoverRoot.vue'
import { Primitive } from '../Primitive/index.ts'

const props = withDefaults(defineProps<PopoverCloseProps>(), {
  as: 'button',
})

useForwardExpose()
const rootContext = injectPopoverRootContext()
</script>

<template>
  <Primitive
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :as-child="props.asChild"
    @click="rootContext.onOpenChange(false)"
  >
    <slot />
  </Primitive>
</template>
