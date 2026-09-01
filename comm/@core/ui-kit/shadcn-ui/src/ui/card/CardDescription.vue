<!--
 * 卡片描述文本：弱化显示的辅助说明。
 *
 * 使用 p 标签而非 div：描述属于正文内容，需要正确的段落语义，
 * 读屏才会按文本而非容器节点播报。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\CardDescription.vue
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
  <p :class="cn('text-muted-foreground text-sm', props.class)">
    <slot></slot>
  </p>
</template>
