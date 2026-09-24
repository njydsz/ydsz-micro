<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface CheckboxIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { injectCheckboxRootContext } from './CheckboxRoot.vue'
import { Primitive } from '../Primitive/index.ts'
import { Presence } from '../Presence/index.ts'
import { getState, isIndeterminate } from './utils'

withDefaults(defineProps<CheckboxIndicatorProps>(), {
  as: 'span',
})
const { forwardRef } = useForwardExpose()

const rootContext = injectCheckboxRootContext()
</script>

<template>
  <Presence
    :present="forceMount || isIndeterminate(rootContext.state.value) || rootContext.state.value === true"
  >
    <Primitive
      :ref="forwardRef"
      :data-state="getState(rootContext.state.value)"
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      :style="{ pointerEvents: 'none' }"
      :as-child="asChild"
      :as="as"
      v-bind="$attrs"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
