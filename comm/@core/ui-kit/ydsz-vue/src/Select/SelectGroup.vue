<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { createContext, useId } from '../shared/index.ts'

export interface SelectGroupProps extends PrimitiveProps {}

interface SelectGroupContext {
  id: string
}

export const [injectSelectGroupContext, provideSelectGroupContext]
  = createContext<SelectGroupContext>('SelectGroup')
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = defineProps<SelectGroupProps>()

const id = useId(undefined, 'radix-vue-select-group')
provideSelectGroupContext({ id })
</script>

<template>
  <Primitive
    role="group"
    v-bind="props"
    :aria-labelledby="id"
  >
    <slot />
  </Primitive>
</template>
