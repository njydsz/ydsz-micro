<!--
 * 选择器中的选项分组：与 SelectLabel 配合使用，把长列表按语义切成若干段。
 *
 * radix 会把分组与标签做 aria 关联，因此标签必须放在分组内部，
 * 放在外面则读屏用户听不到「这一组是什么」。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\SelectGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectGroupProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { SelectGroup } from 'radix-vue';

const props = defineProps<SelectGroupProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <SelectGroup :class="cn('w-full p-1', props.class)" v-bind="delegatedProps">
    <slot></slot>
  </SelectGroup>
</template>
