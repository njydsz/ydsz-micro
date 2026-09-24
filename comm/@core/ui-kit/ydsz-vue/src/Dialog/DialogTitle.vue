<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface DialogTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { injectDialogRootContext } from './DialogRoot.vue'
import { Primitive } from '../Primitive/index.ts'

const props = withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' })
const rootContext = injectDialogRootContext()
useForwardExpose()
</script>

<template>
  <Primitive
    v-bind="props"
    :id="rootContext.titleId"
  >
    <slot />
  </Primitive>
</template>
