<!--
 * 头像容器：按 shape / size 两个维度从 cva 变体中取类名，默认圆形小号。
 *
 * 尺寸与圆角全部由 avatarVariant 统一产出，外部若要覆盖必须走 cn()，
 * 因为默认变体已经带上 h-8 w-8 等具体尺寸类，直接拼字符串会被 tailwind-merge 判为冲突而丢失其一。
 * 图片与兜底内容分别由 AvatarImage / AvatarFallback 提供，本组件只负责裁剪与定尺。
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
