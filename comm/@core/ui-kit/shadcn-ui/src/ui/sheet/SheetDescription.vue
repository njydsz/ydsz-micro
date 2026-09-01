<!--
 * 抽屉的说明文字：会被 radix 注册为 aria-describedby 的目标。
 *
 * 抽屉常用于承载表单或详情，说明文字是读屏用户进入后的第一段有效信息，
 * 因此即使视觉上可省略也建议提供。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetDescription.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogDescriptionProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DialogDescription } from 'radix-vue';

const props = defineProps<DialogDescriptionProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DialogDescription
    :class="cn('text-muted-foreground text-sm', props.class)"
    v-bind="delegatedProps"
  >
    <slot></slot>
  </DialogDescription>
</template>
