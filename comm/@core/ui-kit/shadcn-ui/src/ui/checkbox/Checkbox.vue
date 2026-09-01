<!--
 * 复选框：包装 radix CheckboxRoot，并补充 indeterminate 半选态与自定义指示器。
 *
 * 半选态用于「全选」这类表达「子项部分选中」的场景，原生 checkbox 只能通过脚本
 * 设置且各浏览器表现不一，这里统一为受控属性。
 * props 中的 class 会被剥离后再转发给 radix：若原样透传，radix 会再套一份原始
 * class，与经 cn 合并后的结果重复，tailwind-merge 也就失去了消解冲突的机会。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\checkbox\Checkbox.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Check, Minus } from 'lucide-vue-next';
import {
  CheckboxIndicator,
  CheckboxRoot,
  useForwardPropsEmits,
} from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<
  CheckboxRootProps & { class?: ClassValue; indeterminate?: boolean }
>();
const emits = defineEmits<CheckboxRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border peer h-4 w-4 shrink-0 rounded-sm border transition focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      class="flex h-full w-full items-center justify-center text-current"
    >
      <slot>
        <component :is="indeterminate ? Minus : Check" class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
