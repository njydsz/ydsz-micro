<script lang="ts">
// @ts-nocheck
import type { PrimitiveProps } from '../Primitive/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface SliderThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import SliderThumbImpl from './SliderThumbImpl.vue'
import { useCollection } from '../Collection/index.ts'
import { computed } from 'vue'

const props = defineProps<SliderThumbProps>()
const { getItems } = useCollection()

const { forwardRef, currentElement: thumbElement } = useForwardExpose()

const index = computed(() => thumbElement.value ? getItems().findIndex(i => i.ref === thumbElement.value) : -1)
</script>

<template>
  <SliderThumbImpl
    :ref="forwardRef"
    v-bind="props"
    :index="index"
  >
    <slot />
  </SliderThumbImpl>
</template>
