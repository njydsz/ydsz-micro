<!--
 * 对话框描述：为对话框提供补充说明，并关联到无障碍描述。
 *
 * 会被 radix 用作 aria-describedby 的目标，建议始终提供；缺省时读屏只播报标题，
 * 用户不清楚该对话框要做什么。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogDescription.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogDescriptionProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DialogDescription, useForwardProps } from 'radix-vue';

const props = defineProps<DialogDescriptionProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogDescription
    v-bind="forwardedProps"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot></slot>
  </DialogDescription>
</template>
