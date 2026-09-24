<script lang="ts">
// @ts-nocheck
import type { PopperContentProps } from '../Popper/index.ts'
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '../DismissableLayer/index.ts'
import type { FocusScopeProps } from '../FocusScope/index.ts'

export type PopoverContentImplEmits = DismissableLayerEmits & {
  /**
   * Event handler called when auto-focusing on open.
   * Can be prevented.
   */
  openAutoFocus: [event: Event]
  /**
   * Event handler called when auto-focusing on close.
   * Can be prevented.
   */
  closeAutoFocus: [event: Event]
}

export interface PopoverContentImplProps
  extends PopperContentProps,
  DismissableLayerProps {
  /**
   * Whether focus should be trapped within the `MenuContent`
   * @defaultValue false
   */
  trapFocus?: FocusScopeProps['trapped']
}
</script>

<script setup lang="ts">
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { PopperContent } from '../Popper/index.ts'
import { DismissableLayer } from '../DismissableLayer/index.ts'
import { FocusScope } from '../FocusScope/index.ts'
import { useFocusGuards, useForwardExpose, useForwardProps } from '../shared/index.ts'

const props = defineProps<PopoverContentImplProps>()
const emits = defineEmits<PopoverContentImplEmits>()

const forwarded = useForwardProps(props)
const { forwardRef } = useForwardExpose()

const rootContext = injectPopoverRootContext()
useFocusGuards()
</script>

<template>
  <FocusScope
    as-child
    loop
    :trapped="trapFocus"
    @mount-auto-focus="emits('openAutoFocus', $event)"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      as-child
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @dismiss="rootContext.onOpenChange(false)"
    >
      <PopperContent
        v-bind="forwarded"
        :id="rootContext.contentId"
        :ref="forwardRef"
        :data-state="rootContext.open.value ? 'open' : 'closed'"
        role="dialog"
        :style="{
          '--radix-popover-content-transform-origin':
            'var(--radix-popper-transform-origin)',
          '--radix-popover-content-available-width':
            'var(--radix-popper-available-width)',
          '--radix-popover-content-available-height':
            'var(--radix-popper-available-height)',
          '--radix-popover-trigger-width': 'var(--radix-popper-anchor-width)',
          '--radix-popover-trigger-height': 'var(--radix-popper-anchor-height)',
        }"
      >
        <slot />
      </PopperContent>
    </DismissableLayer>
  </FocusScope>
</template>
