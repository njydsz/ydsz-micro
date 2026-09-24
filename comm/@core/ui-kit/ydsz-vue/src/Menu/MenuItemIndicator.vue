<script lang="ts">
// @ts-nocheck
import type { Ref } from 'vue'
import type { PrimitiveProps } from '../Primitive/index.ts'
import { createContext } from '../shared/index.ts'
import type { CheckedState } from './utils'

interface MenuItemIndicatorContext {
  checked: Ref<CheckedState>
}

export interface MenuItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}

export const [injectMenuItemIndicatorContext, provideMenuItemIndicatorContext]
  = createContext<MenuItemIndicatorContext>(
    ['MenuCheckboxItem', 'MenuRadioItem'],
    'MenuItemIndicatorContext',
  )
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { getCheckedState, isIndeterminate } from './utils'
import { Primitive } from '../Primitive/index.ts'
import { Presence } from '../Presence/index.ts'

withDefaults(defineProps<MenuItemIndicatorProps>(), {
  as: 'span',
})

const indicatorContext = injectMenuItemIndicatorContext({
  checked: ref(false),
})
</script>

<template>
  <Presence
    :present="
      forceMount
        || isIndeterminate(indicatorContext.checked.value)
        || indicatorContext.checked.value === true
    "
  >
    <Primitive
      :as="as"
      :as-child="asChild"
      :data-state="getCheckedState(indicatorContext.checked.value)"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
