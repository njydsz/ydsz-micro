<script lang="ts">
// @ts-nocheck
import type { PopperAnchorProps } from '../Popper/index.ts'
import { useForwardExpose } from '../shared/index.ts'

export interface PopoverAnchorProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import { onBeforeMount, onUnmounted } from 'vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { PopperAnchor } from '../Popper/index.ts'

const props = defineProps<PopoverAnchorProps>()

useForwardExpose()
const rootContext = injectPopoverRootContext()

onBeforeMount(() => {
  rootContext.hasCustomAnchor.value = true
})
onUnmounted(() => {
  rootContext.hasCustomAnchor.value = false
})
</script>

<template>
  <PopperAnchor v-bind="props">
    <slot />
  </PopperAnchor>
</template>
