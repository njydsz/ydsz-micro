<!--
 * 抽屉的标题：radix 会将其注册为 aria-labelledby 的目标。
 *
 * 不可省略 —— 缺少标题的抽屉在读屏里只会播报「对话框」，
 * 用户无法判断自己打开了什么。字重取 medium 而非 semibold，
 * 因为抽屉标题通常与正文距离很近，过重会让层级显得脱节。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogTitleProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DialogTitle } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<DialogTitleProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DialogTitle
    :class="cn('text-foreground font-medium', props.class)"
    v-bind="delegatedProps"
  >
    <slot></slot>
  </DialogTitle>
</template>
