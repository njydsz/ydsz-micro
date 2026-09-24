<script lang="ts">
// @ts-nocheck
import type { PopperArrowProps } from '../Popper/index.ts'

export interface SelectArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { injectSelectRootContext } from './SelectRoot.vue'
import { SelectContentDefaultContextValue, injectSelectContentContext } from './SelectContentImpl.vue'
import { PopperArrow } from '../Popper/index.ts'

const props = withDefaults(defineProps<SelectArrowProps>(), {
  width: 10,
  height: 5,
  as: 'svg',
})
const rootContext = injectSelectRootContext()
const contentContext = injectSelectContentContext(SelectContentDefaultContextValue)
</script>

<template>
  <PopperArrow
    v-if="rootContext.open.value && contentContext.position === 'popper'"
    v-bind="props"
  >
    <slot />
  </PopperArrow>
</template>
