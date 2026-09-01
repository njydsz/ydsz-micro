<!--
 * 单选组的容器：转发 radix RadioGroupRoot 的 props 与 emits。
 *
 * 用 grid gap-2 固定组内间距，使选项在表单中与其它字段的纵向节奏一致；
 * 键盘上下切换与 aria 关联由 radix 负责，本组件不自行管理选中项。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\radio-group\RadioGroup.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { RadioGroupRootEmits, RadioGroupRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { RadioGroupRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<RadioGroupRootProps & { class?: any }>();
const emits = defineEmits<RadioGroupRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <RadioGroupRoot :class="cn('grid gap-2', props.class)" v-bind="forwarded">
    <slot></slot>
  </RadioGroupRoot>
</template>
