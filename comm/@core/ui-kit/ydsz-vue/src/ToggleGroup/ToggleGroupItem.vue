<script lang="ts">
// @ts-nocheck
import type { ToggleProps } from '../Toggle/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface ToggleGroupItemProps extends Omit<ToggleProps, 'pressed' | 'defaultValue'> {
  /**
   * A string value for the toggle group item. All items within a toggle group should use a unique value.
   */
  value: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { injectToggleGroupRootContext } from './ToggleGroupRoot.vue'
import { Toggle } from '../Toggle/index.ts'
import { RovingFocusItem } from '../RovingFocus/index.ts'
import { Primitive } from '../Primitive/index.ts'

const props = withDefaults(defineProps<ToggleGroupItemProps>(), {
  as: 'button',
})

const rootContext = injectToggleGroupRootContext()
const disabled = computed(() => rootContext.disabled?.value || props.disabled)
const pressed = computed(() => rootContext.modelValue.value?.includes(props.value))

const isPressed = computed(() => {
  return rootContext.isSingle.value
    ? rootContext.modelValue.value === props.value
    : rootContext.modelValue.value?.includes(props.value)
})

const { forwardRef } = useForwardExpose()
</script>

<template>
  <component
    :is="rootContext.rovingFocus.value ? RovingFocusItem : Primitive"
    as-child
    :focusable="!disabled"
    :active="pressed"
  >
    <Toggle
      v-bind="props"
      :ref="forwardRef"
      :disabled="disabled"
      :pressed="isPressed"
      @update:pressed="rootContext.changeModelValue(value)"
    >
      <slot />
    </Toggle>
  </component>
</template>
