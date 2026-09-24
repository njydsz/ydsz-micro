<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface SwitchThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { injectSwitchRootContext } from './SwitchRoot.vue'
import { Primitive } from '../Primitive/index.ts'

withDefaults(defineProps<SwitchThumbProps>(), { as: 'span' })

const rootContext = injectSwitchRootContext()

useForwardExpose()
</script>

<template>
  <Primitive
    :data-state="rootContext.checked?.value ? 'checked' : 'unchecked'"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
