<script lang="ts">
// @ts-nocheck
import type { Ref } from 'vue'
import type { PrimitiveProps } from '../Primitive/index.ts'
import type { ImageLoadingStatus } from './utils'
import { createContext, useForwardExpose } from '../shared/index.ts'

export interface AvatarRootProps extends PrimitiveProps {}

export type AvatarRootContext = {
  imageLoadingStatus: Ref<ImageLoadingStatus>
}

export const [injectAvatarRootContext, provideAvatarRootContext]
  = createContext<AvatarRootContext>('AvatarRoot')
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Primitive } from '../Primitive/index.ts'

withDefaults(defineProps<AvatarRootProps>(), {
  as: 'span',
})

useForwardExpose()

provideAvatarRootContext({
  imageLoadingStatus: ref<ImageLoadingStatus>('loading'),
})
</script>

<template>
  <Primitive
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
