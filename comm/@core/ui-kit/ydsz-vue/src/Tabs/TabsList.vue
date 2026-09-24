<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface TabsListProps extends PrimitiveProps {
  /** When `true`, keyboard navigation will loop from last tab to first, and vice versa. */
  loop?: boolean
}
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { injectTabsRootContext } from './TabsRoot.vue'
import { Primitive } from '../Primitive/index.ts'
import { RovingFocusGroup } from '../RovingFocus/index.ts'

const props = withDefaults(defineProps<TabsListProps>(), {
  loop: true,
})
const { loop } = toRefs(props)

const { forwardRef, currentElement } = useForwardExpose()
const context = injectTabsRootContext()

context.tabsList = currentElement
</script>

<template>
  <RovingFocusGroup
    as-child
    :orientation="context.orientation.value"
    :dir="context.dir.value"
    :loop="loop"
  >
    <Primitive
      :ref="forwardRef"
      role="tablist"
      :as-child="asChild"
      :as="as"
      :aria-orientation="context.orientation.value"
    >
      <slot />
    </Primitive>
  </RovingFocusGroup>
</template>
