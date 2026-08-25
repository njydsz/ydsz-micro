<!--
 * Avatar Vue 组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\avatar\Avatar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AvatarVariants } from './avatar';

import { cn } from '@YDSZ-core/shared/utils';

import { AvatarRoot } from 'radix-vue';

import { avatarVariant } from './avatar';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(
  defineProps<{
    class?: ClassValue;
    shape?: AvatarVariants['shape'];
    size?: AvatarVariants['size'];
  }>(),
  {
    shape: 'circle',
    size: 'sm',
  },
);
</script>

<template>
  <AvatarRoot :class="cn(avatarVariant({ size, shape }), props.class)">
    <slot></slot>
  </AvatarRoot>
</template>
