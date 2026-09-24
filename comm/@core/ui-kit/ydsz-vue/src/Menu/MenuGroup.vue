<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'

export interface MenuGroupProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '../Primitive/index.ts'

const props = defineProps<MenuGroupProps>()
</script>

<template>
  <Primitive
    role="group"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
