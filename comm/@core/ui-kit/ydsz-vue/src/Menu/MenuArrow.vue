<script lang="ts">
// @ts-nocheck
import type { PopperArrowProps } from '../Popper/index.ts'

export interface MenuArrowProps extends PopperArrowProps {}
</script>

<script setup lang="ts">
import { PopperArrow } from '../Popper/index.ts'

const props = defineProps<MenuArrowProps>()
</script>

<template>
  <PopperArrow v-bind="props">
    <slot />
  </PopperArrow>
</template>
