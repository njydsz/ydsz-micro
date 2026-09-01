<!--
 * 卡片标题：以 h3 渲染的区块标题。
 *
 * 固定为 h3 而非可配置层级：卡片通常嵌在已有 h2 的页面区块内，固定层级可避免
 * 标题层级被随意打乱；层级不适用的场景请自行渲染标题元素。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\CardTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
}>();
</script>

<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight', props.class)">
    <slot></slot>
  </h3>
</template>
