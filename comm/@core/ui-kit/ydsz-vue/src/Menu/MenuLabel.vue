<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'

export interface MenuLabelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = withDefaults(defineProps<MenuLabelProps>(), {
  as: 'div',
})
</script>

<template>
  <Primitive v-bind="props">
    <slot />
  </Primitive>
</template>
